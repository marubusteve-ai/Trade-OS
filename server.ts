/**
 * TradeOS Full-Stack Server
 * 
 * Secure Node/Express Server hosting Vite in development and serving static assets in production.
 * Houses server-side Gemini AI integrations so API keys and proprietary trading telemetry
 * are never exposed to the client browser.
 */

import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const PORT = 3000;
const app = express();

app.use(express.json({ limit: '10mb' }));

// Lazy initializer for Gemini client
let genAIClient: GoogleGenAI | null = null;
function getGenAI(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!genAIClient) {
    genAIClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return genAIClient;
}

// -------------------------------------------------------------
// AI Intelligence Layer API Endpoints
// -------------------------------------------------------------

app.get('/api/ai/health', (req: Request, res: Response) => {
  const hasKey = !!process.env.GEMINI_API_KEY;
  res.json({
    status: 'ok',
    hasApiKey: hasKey,
    model: 'gemini-3.8-flash',
    version: '1.0.0',
    capabilities: [
      'TRADE_REVIEW',
      'JOURNAL_SUMMARY',
      'DAILY_REVIEW',
      'WEEKLY_REVIEW',
      'MONTHLY_REVIEW',
      'MISTAKE_ANALYSIS',
      'PATTERN_DISCOVERY',
      'STRATEGY_REVIEW',
      'PLAYBOOK_REVIEW',
      'PSYCHOLOGY_REVIEW',
      'RISK_REVIEW',
      'PERFORMANCE_COACHING',
      'CUSTOM_INQUIRY',
    ],
  });
});

app.post('/api/ai/generate', async (req: Request, res: Response) => {
  try {
    const { reviewType, dataset, customQuery } = req.body;

    if (!reviewType || !dataset) {
      return res.status(400).json({ error: 'Missing reviewType or dataset in request payload.' });
    }

    const ai = getGenAI();
    if (!ai) {
      return res.status(503).json({
        error: 'Gemini API key is not configured on the server.',
        fallback: true,
      });
    }

    const systemPrompt = `You are TradeOS AI, an elite institutional trading coach, quantitative risk auditor, and behavioral psychologist.
Your role is to analyze strictly verified trading journal data and produce an objective, evidence-based performance review.

CRITICAL INVIOLABLE RULES:
1. NEVER INVENT OR FABRICATE STATISTICS. You may only cite numbers directly provided in the dataset or calculate direct ratios from them.
2. YOU MUST STRICTLY DISTINGUISH:
   - [OBSERVED DATA]: Factual records, counts, timestamps, mistake tags, and trade counts from the ledger.
   - [CALCULATED METRIC]: Deterministic financial and risk metrics (e.g. Win Rate, Profit Factor, Expectancy R, VaR, Drawdown %).
   - [INTERPRETATION]: Logical deductions, behavioral pattern analysis, and execution edge dynamics.
   - [RECOMMENDATION]: Concrete, actionable discipline and process changes (risk sizing, cooldowns, rule adherence).
3. INSUFFICIENT DATA: If the sample size is under 5 trades for a setup or under 10 for broad statistical assertions, explicitly state this in insufficientDataWarnings.
4. DISCLAIMER: AI recommendations are educational heuristics and not guaranteed financial advice. AI does not execute trades.`;

    const userPrompt = `Review Type Requested: ${reviewType}
User Inquiry / Focus: ${customQuery || 'Comprehensive Audit'}

Verified Grounded Dataset:
${JSON.stringify(dataset, null, 2)}

Provide a structured, institutional-grade evaluation in strict JSON adhering to the specified schema.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            reviewType: { type: Type.STRING },
            title: { type: Type.STRING },
            summary: { type: Type.STRING },
            observedData: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  label: { type: Type.STRING },
                  value: { type: Type.STRING },
                  source: { type: Type.STRING },
                  context: { type: Type.STRING },
                },
                required: ['label', 'value', 'source'],
              },
            },
            calculatedMetrics: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  metric: { type: Type.STRING },
                  value: { type: Type.STRING },
                  formulaOrSource: { type: Type.STRING },
                  benchmark: { type: Type.STRING },
                },
                required: ['metric', 'value', 'formulaOrSource'],
              },
            },
            interpretations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  text: { type: Type.STRING },
                  confidence: { type: Type.STRING },
                },
                required: ['title', 'text', 'confidence'],
              },
            },
            recommendations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  action: { type: Type.STRING },
                  priority: { type: Type.STRING },
                  rationale: { type: Type.STRING },
                  category: { type: Type.STRING },
                },
                required: ['action', 'priority', 'rationale', 'category'],
              },
            },
            insufficientDataWarnings: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  field: { type: Type.STRING },
                  observedCount: { type: Type.NUMBER },
                  requiredMinimum: { type: Type.NUMBER },
                  warningMessage: { type: Type.STRING },
                },
                required: ['field', 'observedCount', 'requiredMinimum', 'warningMessage'],
              },
            },
            disclaimer: { type: Type.STRING },
          },
          required: [
            'reviewType',
            'title',
            'summary',
            'observedData',
            'calculatedMetrics',
            'interpretations',
            'recommendations',
            'insufficientDataWarnings',
            'disclaimer',
          ],
        },
      },
    });

    const textOutput = response.text?.trim() || '{}';
    const parsed = JSON.parse(textOutput);

    res.json({
      success: true,
      model: 'gemini-3.8-flash',
      analysis: {
        ...parsed,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('Gemini server execution error:', error);
    res.status(500).json({
      error: error?.message || 'Failed to generate AI evaluation.',
      fallback: true,
    });
  }
});

// -------------------------------------------------------------
// Server & Vite Middleware Lifecycle
// -------------------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`TradeOS Full-Stack Server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
