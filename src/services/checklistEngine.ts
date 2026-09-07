/**
 * Checklist Engine
 * 
 * Evaluates execution checklists, weighted scores, mandatory rule violations,
 * and overall pass/fail state.
 */

import { ChecklistItem, ChecklistEvaluationItem, ChecklistAuditResult, Playbook } from '../types/domain';

export class ChecklistEngine {
  /**
   * Builds an initial checklist evaluation structure from a Playbook
   */
  static generateEvaluationItems(playbook: Playbook): ChecklistEvaluationItem[] {
    const items: ChecklistEvaluationItem[] = [];

    // 1. Confirmations
    (playbook.confirmationChecklist || []).forEach(item => {
      items.push({
        itemId: item.id || `conf_${Math.random().toString(36).substr(2, 6)}`,
        label: item.label,
        category: 'CONFIRMATION',
        isRequired: item.isRequired ?? true,
        weight: item.weight || 2,
        isChecked: false,
      });
    });

    // 2. Strict Rules
    (playbook.ruleChecklist || []).forEach(item => {
      items.push({
        itemId: item.id || `rule_${Math.random().toString(36).substr(2, 6)}`,
        label: item.label,
        category: 'RULE',
        isRequired: item.isRequired ?? true,
        weight: item.weight || 3,
        isChecked: false,
      });
    });

    // 3. Confluences
    (playbook.confluenceChecklist || []).forEach(item => {
      items.push({
        itemId: item.id || `conf_${Math.random().toString(36).substr(2, 6)}`,
        label: item.label,
        category: 'CONFLUENCE',
        isRequired: item.isRequired ?? false,
        weight: item.weight || 1,
        isChecked: false,
      });
    });

    return items;
  }

  /**
   * Evaluates checked items against requirements and computes weighted score
   */
  static auditChecklist(items: ChecklistEvaluationItem[], passingThresholdPercent = 70): ChecklistAuditResult {
    if (!items || items.length === 0) {
      return {
        totalItems: 0,
        checkedItems: 0,
        passedRequired: true,
        failedRequiredCount: 0,
        violations: [],
        weightedScore: 100,
        isOverallPass: true,
      };
    }

    let totalWeight = 0;
    let checkedWeight = 0;
    let checkedCount = 0;
    let failedRequiredCount = 0;
    const violations: string[] = [];

    items.forEach(item => {
      const weight = Math.max(1, item.weight || 1);
      totalWeight += weight;

      if (item.isChecked) {
        checkedWeight += weight;
        checkedCount++;
      } else {
        if (item.isRequired) {
          failedRequiredCount++;
          violations.push(`Unmet Required Criterion: "${item.label}"`);
        }
      }
    });

    const weightedScore = totalWeight > 0 
      ? Number(((checkedWeight / totalWeight) * 100).toFixed(1)) 
      : 100;

    const passedRequired = failedRequiredCount === 0;
    const isOverallPass = passedRequired && weightedScore >= passingThresholdPercent;

    return {
      totalItems: items.length,
      checkedItems: checkedCount,
      passedRequired,
      failedRequiredCount,
      violations,
      weightedScore,
      isOverallPass,
    };
  }

  /**
   * Evaluates a list of checklist items given an array of checked item IDs
   */
  static evaluateChecklist(items: ChecklistItem[], checkedIds: string[], passingThresholdPercent = 70): {
    scorePercentage: number;
    passed: boolean;
    passedRequiredCount: number;
    failedRequiredCount: number;
    violations: string[];
  } {
    const checkedSet = new Set(checkedIds);
    const evalItems: ChecklistEvaluationItem[] = items.map(item => ({
      itemId: item.id,
      label: item.label,
      category: item.category,
      isRequired: item.isRequired,
      weight: item.weight,
      isChecked: checkedSet.has(item.id),
    }));

    const audit = this.auditChecklist(evalItems, passingThresholdPercent);
    const totalRequired = items.filter(i => i.isRequired).length;
    const passedRequiredCount = totalRequired - audit.failedRequiredCount;

    return {
      scorePercentage: audit.weightedScore,
      passed: audit.isOverallPass,
      passedRequiredCount,
      failedRequiredCount: audit.failedRequiredCount,
      violations: audit.violations,
    };
  }

  /**
   * Helper to merge or update a single evaluation item
   */
  static toggleItem(items: ChecklistEvaluationItem[], itemId: string): ChecklistEvaluationItem[] {
    return items.map(item => 
      item.itemId === itemId ? { ...item, isChecked: !item.isChecked } : item
    );
  }
}
