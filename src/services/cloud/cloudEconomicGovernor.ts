/**
 * Lumina Studio Pro - Phase 13H: Cloud GPU Economic Governor
 * Real-time economic cost accounting, user quota governance, and multi-stage billing protection.
 */

export type EconomicGovernorState =
  | 'NORMAL'
  | 'COST_WARNING'
  | 'THROTTLE'
  | 'LOCAL_ONLY_MODE'
  | 'EMERGENCY_CIRCUIT_BREAKER';

export interface UserQuotaLimits {
  userId: string;
  hourlyGpuSecondsMax: number;
  dailyGpuSecondsMax: number;
  monthlyGpuSecondsMax: number;
  maxConcurrentJobs: number;
  currentHourlySecondsUsed: number;
  currentDailySecondsUsed: number;
  currentMonthlySecondsUsed: number;
  activeConcurrentJobs: number;
}

export interface GlobalBudgetStatus {
  monthlyBudgetCapUSD: number;
  currentSpendUSD: number;
  spendPercentage: number;
  emergencyThresholdUSD: number;
  currentState: EconomicGovernorState;
  stateReason: string;
  activeWorkersCount: number;
  queueDepth: number;
  maxQueueSaturation: number;
}

export class CloudEconomicGovernor {
  private static globalBudget: GlobalBudgetStatus = {
    monthlyBudgetCapUSD: 250.0,
    currentSpendUSD: 42.85,
    spendPercentage: 17.14,
    emergencyThresholdUSD: 225.0,
    currentState: 'NORMAL',
    stateReason: 'Spend is within normal operating boundaries (<80% budget cap).',
    activeWorkersCount: 8,
    queueDepth: 2,
    maxQueueSaturation: 64,
  };

  private static defaultUserQuota: UserQuotaLimits = {
    userId: 'current_user',
    hourlyGpuSecondsMax: 120, // 2 minutes GPU / hour
    dailyGpuSecondsMax: 600, // 10 minutes GPU / day
    monthlyGpuSecondsMax: 7200, // 2 hours GPU / month
    maxConcurrentJobs: 3,
    currentHourlySecondsUsed: 14.5,
    currentDailySecondsUsed: 48.2,
    currentMonthlySecondsUsed: 312.0,
    activeConcurrentJobs: 0,
  };

  public static getGlobalStatus(): GlobalBudgetStatus {
    return { ...this.globalBudget };
  }

  public static getUserQuota(): UserQuotaLimits {
    return { ...this.defaultUserQuota };
  }

  /**
   * Evaluate a requested cloud job before dispatching to prevent runaway costs
   */
  public static authorizeJob(estimatedCostUSD: number, estimatedGpuSeconds: number): {
    authorized: boolean;
    governorState: EconomicGovernorState;
    reason: string;
    suggestedAlternative: 'PROCEED' | 'FALLBACK_LOCAL' | 'QUEUE_DELAY';
  } {
    // Check Global Governor State
    if (this.globalBudget.currentState === 'EMERGENCY_CIRCUIT_BREAKER') {
      return {
        authorized: false,
        governorState: 'EMERGENCY_CIRCUIT_BREAKER',
        reason: 'Global cloud GPU spending ceiling reached. Emergency circuit breaker engaged.',
        suggestedAlternative: 'FALLBACK_LOCAL',
      };
    }

    if (this.globalBudget.currentState === 'LOCAL_ONLY_MODE') {
      return {
        authorized: false,
        governorState: 'LOCAL_ONLY_MODE',
        reason: 'Cloud GPU temporarily in local-only conservation mode.',
        suggestedAlternative: 'FALLBACK_LOCAL',
      };
    }

    // Check User Quotas
    if (this.defaultUserQuota.activeConcurrentJobs >= this.defaultUserQuota.maxConcurrentJobs) {
      return {
        authorized: false,
        governorState: this.globalBudget.currentState,
        reason: `Maximum concurrent cloud jobs (${this.defaultUserQuota.maxConcurrentJobs}) active. Please wait for existing jobs to complete.`,
        suggestedAlternative: 'QUEUE_DELAY',
      };
    }

    if (this.defaultUserQuota.currentDailySecondsUsed + estimatedGpuSeconds > this.defaultUserQuota.dailyGpuSecondsMax) {
      return {
        authorized: false,
        governorState: 'THROTTLE',
        reason: 'Daily GPU compute quota reached. Free local rendering remains fully available.',
        suggestedAlternative: 'FALLBACK_LOCAL',
      };
    }

    // Check Global Budget Proximity
    if (this.globalBudget.currentSpendUSD + estimatedCostUSD >= this.globalBudget.emergencyThresholdUSD) {
      this.transitionState('EMERGENCY_CIRCUIT_BREAKER', 'Budget threshold breached by impending workload.');
      return {
        authorized: false,
        governorState: 'EMERGENCY_CIRCUIT_BREAKER',
        reason: 'Emergency spending threshold reached.',
        suggestedAlternative: 'FALLBACK_LOCAL',
      };
    }

    // Deduct & Track
    this.defaultUserQuota.currentHourlySecondsUsed += estimatedGpuSeconds;
    this.defaultUserQuota.currentDailySecondsUsed += estimatedGpuSeconds;
    this.defaultUserQuota.currentMonthlySecondsUsed += estimatedGpuSeconds;
    this.globalBudget.currentSpendUSD += estimatedCostUSD;
    this.globalBudget.spendPercentage = Math.round((this.globalBudget.currentSpendUSD / this.globalBudget.monthlyBudgetCapUSD) * 10000) / 100;

    this.updateGovernorState();

    return {
      authorized: true,
      governorState: this.globalBudget.currentState,
      reason: 'Job authorized under active user and global quota thresholds.',
      suggestedAlternative: 'PROCEED',
    };
  }

  /**
   * Update State Machine based on spend percentages
   */
  private static updateGovernorState(): void {
    const pct = this.globalBudget.spendPercentage;
    if (pct >= 95) {
      this.transitionState('EMERGENCY_CIRCUIT_BREAKER', 'Spend exceeded 95% of monthly limit.');
    } else if (pct >= 85) {
      this.transitionState('LOCAL_ONLY_MODE', 'Spend exceeded 85% of monthly limit; non-essential cloud offloads disabled.');
    } else if (pct >= 75) {
      this.transitionState('THROTTLE', 'Spend exceeded 75% of monthly limit; job concurrency throttled.');
    } else if (pct >= 60) {
      this.transitionState('COST_WARNING', 'Spend reached 60% warning threshold.');
    } else {
      this.transitionState('NORMAL', 'Spend is healthy.');
    }
  }

  public static transitionState(state: EconomicGovernorState, reason: string): void {
    this.globalBudget.currentState = state;
    this.globalBudget.stateReason = reason;
  }

  public static resetSimulationQuota(): void {
    this.globalBudget.currentSpendUSD = 42.85;
    this.globalBudget.spendPercentage = 17.14;
    this.globalBudget.currentState = 'NORMAL';
    this.globalBudget.stateReason = 'Spend is within normal operating boundaries (<80% budget cap).';
    this.defaultUserQuota.currentDailySecondsUsed = 48.2;
    this.defaultUserQuota.activeConcurrentJobs = 0;
  }
}
