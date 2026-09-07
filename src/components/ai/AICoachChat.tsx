/**
 * TradeOS Dedicated AI Coach Interactive Console
 * 
 * Provides an institutional Q&A chat interface with quick inquiry chips,
 * multi-account context filtering, and rich structured analysis rendering.
 */

import React, { useState, useEffect, useRef } from 'react';
import { useTradeOS } from '../../context/TradeOSContext';
import { useAuth } from '../../context/AuthContext';
import { AIService, AI_PRESET_QUESTIONS } from '../../services/aiService';
import { AICoachMessage } from '../../types/ai';
import { AIResponseCard } from './AIResponseCard';
import { Button } from '../ui/Button';
import {
  Sparkles,
  Send,
  Trash2,
  Bot,
  User,
  Compass,
  AlertTriangle,
  Flame,
  Clock,
  BookOpen,
  CheckCircle2,
  TrendingUp,
  Search,
  RefreshCw,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { useNotification } from '../../context/NotificationContext';

export const AICoachChat: React.FC = () => {
  const { currentUser } = useAuth();
  const {
    accounts,
    selectedAccountId,
    setSelectedAccountId,
    trades,
    selectedAccountTrades,
    strategies,
    playbooks,
    sessionCheckIns,
    riskPolicy,
  } = useTradeOS();
  const { notify } = useNotification();

  const [messages, setMessages] = useState<AICoachMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const activeTrades = selectedAccountId === 'ALL' ? trades : selectedAccountTrades;
  const activeAccount = accounts.find((a) => a.id === selectedAccountId) || null;

  // Load chat history on mount
  useEffect(() => {
    const loadHistory = async () => {
      const history = await AIService.getChatHistory(currentUser?.id || 'user-default');
      if (history && history.length > 0) {
        setMessages(history);
      } else {
        // Initial greeting
        const initialMsg: AICoachMessage = {
          id: 'welcome-msg',
          role: 'assistant',
          content: `Welcome to TradeOS AI Coach. I am grounded in your ${activeTrades.length} recorded trades across ${accounts.length} accounts. Ask me any question regarding your trading edge, costly mistakes, session win rates, or playbook adherence below.`,
          timestamp: new Date().toISOString(),
          groundedContextSummary: {
            accountName: activeAccount?.name || 'All Accounts (Consolidated)',
            tradeCount: activeTrades.length,
            winRate: 0,
            netPnL: 0,
            profitFactor: 0,
          },
        };
        setMessages([initialMsg]);
      }
    };
    loadHistory();
  }, [currentUser?.id, selectedAccountId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleSendMessage = async (queryText?: string) => {
    const textToSend = queryText || inputText;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: AICoachMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toISOString(),
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInputText('');
    setIsLoading(true);

    try {
      const assistantResponse = await AIService.askCoach(
        textToSend,
        activeTrades,
        activeAccount,
        strategies,
        playbooks,
        sessionCheckIns,
        riskPolicy,
        currentUser?.id || 'user-default'
      );

      const updated = [...newMessages, assistantResponse];
      setMessages(updated);
      await AIService.saveChatHistory(currentUser?.id || 'user-default', updated);
    } catch (err: any) {
      console.error('Failed to get coach response:', err);
      notify.error('Coach Error', err?.message || 'Failed to process inquiry.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = async () => {
    await AIService.clearChatHistory(currentUser?.id || 'user-default');
    setMessages([]);
    notify.info('Chat Reset', 'AI Coach conversation history has been cleared.');
  };

  const getPresetIcon = (iconName: string) => {
    switch (iconName) {
      case 'Sparkles': return <Sparkles className="h-3.5 w-3.5 text-purple-400" />;
      case 'AlertTriangle': return <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />;
      case 'Compass': return <Compass className="h-3.5 w-3.5 text-cyan-400" />;
      case 'Clock': return <Clock className="h-3.5 w-3.5 text-amber-400" />;
      case 'Flame': return <Flame className="h-3.5 w-3.5 text-orange-400" />;
      case 'BookOpen': return <BookOpen className="h-3.5 w-3.5 text-blue-400" />;
      case 'CheckCircle2': return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />;
      case 'TrendingUp': return <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />;
      case 'Search': return <Search className="h-3.5 w-3.5 text-indigo-400" />;
      default: return <HelpCircle className="h-3.5 w-3.5 text-gray-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Context Bar & Presets */}
      <div className="p-4 rounded-xl bg-[#121418] border border-[#22252A] space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#22252A]">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
              <Bot className="h-4 w-4" />
            </div>
            <div>
              <span className="text-sm font-bold text-white block">AI Quantitative Coach</span>
              <span className="text-xs text-[#848B98]">
                Grounded in {activeTrades.length} trades from {activeAccount ? activeAccount.name : 'All Accounts'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Account Selector */}
            <div className="flex items-center gap-1.5 text-xs text-[#848B98]">
              <Layers className="h-3.5 w-3.5" />
              <span>Scope:</span>
            </div>
            <select
              value={selectedAccountId}
              onChange={(e) => setSelectedAccountId(e.target.value)}
              className="px-2.5 py-1 text-xs bg-[#181B20] border border-[#2A2E35] rounded-md text-white font-medium focus:outline-none focus:border-purple-500"
            >
              <option value="ALL">All Accounts (Consolidated)</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.accountNumber})
                </option>
              ))}
            </select>

            <Button
              variant="outline"
              size="sm"
              onClick={handleClearHistory}
              className="text-xs border-[#2A2E35] text-[#848B98] hover:text-rose-400"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              Clear
            </Button>
          </div>
        </div>

        {/* Quick Inquiry Chips (All 9 Core Requirements) */}
        <div className="space-y-2">
          <span className="text-[11px] font-bold text-[#848B98] uppercase tracking-wider block">
            Suggested Quantitative Inquiries
          </span>
          <div className="flex flex-wrap gap-2">
            {AI_PRESET_QUESTIONS.map((pq) => (
              <button
                key={pq.id}
                disabled={isLoading}
                onClick={() => handleSendMessage(pq.question)}
                className="group px-3 py-1.5 rounded-lg bg-[#181B20] border border-[#2A2E35] hover:border-purple-500/50 hover:bg-purple-500/10 text-xs text-[#D1D5DB] hover:text-white transition-all flex items-center gap-2 text-left disabled:opacity-50"
              >
                {getPresetIcon(pq.iconName)}
                <span className="font-medium">{pq.question}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Conversation Thread */}
      <div className="space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col space-y-2 ${
              msg.role === 'user' ? 'items-end' : 'items-start'
            }`}
          >
            <div className="flex items-center gap-2 text-[10px] text-[#848B98] px-1 font-mono">
              {msg.role === 'user' ? (
                <>
                  <span>YOU</span>
                  <User className="h-3 w-3 text-blue-400" />
                  <span>•</span>
                  <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </>
              ) : (
                <>
                  <Bot className="h-3 w-3 text-purple-400" />
                  <span className="text-purple-400 font-bold">TRADEOS AI COACH</span>
                  <span>•</span>
                  <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </>
              )}
            </div>

            {msg.role === 'user' ? (
              <div className="max-w-2xl px-4 py-3 rounded-2xl rounded-tr-none bg-blue-600 text-white text-sm shadow-md font-medium">
                {msg.content}
              </div>
            ) : (
              <div className="w-full space-y-3">
                {/* Regular text summary if present */}
                {!msg.structuredResponse && (
                  <div className="max-w-3xl px-4 py-3 rounded-2xl rounded-tl-none bg-[#121418] border border-[#22252A] text-sm text-[#F3F4F6] shadow-md leading-relaxed">
                    {msg.content}
                  </div>
                )}

                {/* Structured Rich AI Response Card */}
                {msg.structuredResponse && (
                  <AIResponseCard response={msg.structuredResponse} />
                )}
              </div>
            )}
          </div>
        ))}

        {/* Loading Bubble */}
        {isLoading && (
          <div className="flex flex-col items-start space-y-2">
            <div className="flex items-center gap-2 text-[10px] text-[#848B98] px-1 font-mono">
              <Bot className="h-3 w-3 text-purple-400" />
              <span className="text-purple-400 font-bold">ANALYZING JOURNAL DATA...</span>
            </div>
            <div className="px-4 py-3 rounded-2xl rounded-tl-none bg-[#121418] border border-purple-500/30 text-sm text-purple-300 flex items-center gap-3">
              <RefreshCw className="h-4 w-4 animate-spin text-purple-400" />
              <span>Querying CalculationEngine and generating grounded audit...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Console */}
      <div className="p-3 rounded-xl bg-[#121418] border border-[#22252A] flex items-center gap-2 sticky bottom-4 shadow-2xl">
        <input
          type="text"
          value={inputText}
          disabled={isLoading}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSendMessage();
            }
          }}
          placeholder="Ask AI Coach a question (e.g., 'What happens after consecutive losses?')..."
          className="flex-1 bg-[#181B20] border border-[#2A2E35] rounded-lg px-4 py-2.5 text-sm text-white placeholder-[#848B98] focus:outline-none focus:border-purple-500 font-normal"
        />

        <Button
          variant="primary"
          onClick={() => handleSendMessage()}
          disabled={isLoading || !inputText.trim()}
          className="px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg flex items-center gap-1.5 text-xs font-bold"
        >
          <Send className="h-4 w-4" />
          <span>Ask AI</span>
        </Button>
      </div>
    </div>
  );
};
