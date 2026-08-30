/**
 * Lumina Studio Pro — AI Cost & Usage Tracker
 *
 * Tracks requests, estimated token counts, approximate spending, and session telemetry.
 * All usage logs are stored strictly on the local device (IndexedDB/LocalStorage).
 */

import { AIUsageRecord, AIUsageSummary } from '../../types/aiProviderGateway';

const USAGE_HISTORY_STORAGE_KEY = 'lumina_ai_usage_history_v1';
const MAX_HISTORY_RECORDS = 500;

export class AIUsageTracker {
  private static instance: AIUsageTracker;
  private records: AIUsageRecord[] = [];
  private sessionStartTime: number = Date.now();
  private sessionRequests: number = 0;
  private sessionCostUSD: number = 0;

  private constructor() {
    this.loadHistory();
  }

  public static getInstance(): AIUsageTracker {
    if (!AIUsageTracker.instance) {
      AIUsageTracker.instance = new AIUsageTracker();
    }
    return AIUsageTracker.instance;
  }

  private loadHistory(): void {
    try {
      const raw = localStorage.getItem(USAGE_HISTORY_STORAGE_KEY);
      if (raw) {
        this.records = JSON.parse(raw);
      }
    } catch {
      this.records = [];
    }
  }

  private persistHistory(): void {
    try {
      const trimmed = this.records.slice(-MAX_HISTORY_RECORDS);
      localStorage.setItem(USAGE_HISTORY_STORAGE_KEY, JSON.stringify(trimmed));
    } catch (err) {
      console.error('Failed to persist AI usage history:', err);
    }
  }

  public recordUsage(record: Omit<AIUsageRecord, 'id' | 'timestamp'>): void {
    const fullRecord: AIUsageRecord = {
      ...record,
      id: `usage_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      timestamp: Date.now(),
    };

    this.records.push(fullRecord);
    this.sessionRequests += 1;
    this.sessionCostUSD += record.estimatedCostUSD || 0;
    this.persistHistory();
  }

  public getHistory(): AIUsageRecord[] {
    return [...this.records];
  }

  public getSummary(): AIUsageSummary {
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

    let totalTokens = 0;
    let totalEstimatedCostUSD = 0;
    let imageGenerations = 0;
    let imageAnalyses = 0;
    let dailySpentUSD = 0;
    let monthlySpentUSD = 0;

    for (const r of this.records) {
      totalTokens += r.totalTokens || 0;
      totalEstimatedCostUSD += r.estimatedCostUSD || 0;
      if (r.isImageGeneration) imageGenerations += 1;
      if (r.isImageAnalysis) imageAnalyses += 1;

      if (r.timestamp >= oneDayAgo) {
        dailySpentUSD += r.estimatedCostUSD || 0;
      }
      if (r.timestamp >= thirtyDaysAgo) {
        monthlySpentUSD += r.estimatedCostUSD || 0;
      }
    }

    return {
      totalRequests: this.records.length,
      totalTokens,
      totalEstimatedCostUSD,
      imageGenerations,
      imageAnalyses,
      sessionRequests: this.sessionRequests,
      sessionEstimatedCostUSD: this.sessionCostUSD,
      dailySpentUSD,
      monthlySpentUSD,
    };
  }

  public clearHistory(): void {
    this.records = [];
    this.sessionRequests = 0;
    this.sessionCostUSD = 0;
    localStorage.removeItem(USAGE_HISTORY_STORAGE_KEY);
  }
}

export const aiUsageTracker = AIUsageTracker.getInstance();
