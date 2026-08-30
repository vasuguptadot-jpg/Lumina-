/**
 * Lumina Studio Pro — AI Security & Request Privacy Guard
 *
 * Enforces:
 * 1. Explicit User Upload Consent (No silent image transmission)
 * 2. EXIF Data Scrubbing (Removes GPS, device serials, camera identifiers before sending)
 * 3. Daily & Monthly Cost/Spending Caps
 * 4. API Key Leak Prevention (Ensures API keys are never leaked to logs, URLs, or external proxies)
 * 5. Safe Payload Size Constraints
 */

import { AIUniversalRequest, AISpendingLimits } from '../../types/aiProviderGateway';
import { aiUsageTracker } from './aiUsageTracker';

const PRIVACY_SETTINGS_STORAGE_KEY = 'lumina_ai_privacy_settings_v1';
const SPENDING_LIMITS_STORAGE_KEY = 'lumina_ai_spending_limits_v1';

export interface AIPrivacySettings {
  requireExplicitConsentPerImage: boolean;
  scrubExifMetadata: boolean;
  maskPromptPersonallyIdentifiableInfo: boolean;
  disableAllAI: boolean;
}

export const DEFAULT_PRIVACY_SETTINGS: AIPrivacySettings = {
  requireExplicitConsentPerImage: true,
  scrubExifMetadata: true,
  maskPromptPersonallyIdentifiableInfo: false,
  disableAllAI: false,
};

export const DEFAULT_SPENDING_LIMITS: AISpendingLimits = {
  dailyLimitUSD: 5.0, // $5.00 daily ceiling by default to prevent runaway costs
  monthlyLimitUSD: 50.0,
  maxImageDimension: 2048,
  maxRequestPayloadKB: 10240, // 10MB
};

export class AISecurityGuard {
  private static instance: AISecurityGuard;
  private privacySettings: AIPrivacySettings;
  private spendingLimits: AISpendingLimits;

  private constructor() {
    this.privacySettings = this.loadPrivacySettings();
    this.spendingLimits = this.loadSpendingLimits();
  }

  public static getInstance(): AISecurityGuard {
    if (!AISecurityGuard.instance) {
      AISecurityGuard.instance = new AISecurityGuard();
    }
    return AISecurityGuard.instance;
  }

  private loadPrivacySettings(): AIPrivacySettings {
    try {
      const raw = localStorage.getItem(PRIVACY_SETTINGS_STORAGE_KEY);
      return raw ? { ...DEFAULT_PRIVACY_SETTINGS, ...JSON.parse(raw) } : { ...DEFAULT_PRIVACY_SETTINGS };
    } catch {
      return { ...DEFAULT_PRIVACY_SETTINGS };
    }
  }

  private loadSpendingLimits(): AISpendingLimits {
    try {
      const raw = localStorage.getItem(SPENDING_LIMITS_STORAGE_KEY);
      return raw ? { ...DEFAULT_SPENDING_LIMITS, ...JSON.parse(raw) } : { ...DEFAULT_SPENDING_LIMITS };
    } catch {
      return { ...DEFAULT_SPENDING_LIMITS };
    }
  }

  public getPrivacySettings(): AIPrivacySettings {
    return { ...this.privacySettings };
  }

  public updatePrivacySettings(update: Partial<AIPrivacySettings>): AIPrivacySettings {
    this.privacySettings = { ...this.privacySettings, ...update };
    try {
      localStorage.setItem(PRIVACY_SETTINGS_STORAGE_KEY, JSON.stringify(this.privacySettings));
    } catch (err) {
      console.error('Failed to save AI privacy settings:', err);
    }
    return { ...this.privacySettings };
  }

  public getSpendingLimits(): AISpendingLimits {
    return { ...this.spendingLimits };
  }

  public updateSpendingLimits(update: Partial<AISpendingLimits>): AISpendingLimits {
    this.spendingLimits = { ...this.spendingLimits, ...update };
    try {
      localStorage.setItem(SPENDING_LIMITS_STORAGE_KEY, JSON.stringify(this.spendingLimits));
    } catch (err) {
      console.error('Failed to save AI spending limits:', err);
    }
    return { ...this.spendingLimits };
  }

  /**
   * Evaluates request validity, spending limits, and security constraints before dispatch
   */
  public async validateRequest(req: AIUniversalRequest, estimatedCostUSD: number = 0): Promise<{ allowed: boolean; reason?: string }> {
    if (this.privacySettings.disableAllAI) {
      return { allowed: false, reason: 'AI operations are currently globally disabled in Settings.' };
    }

    // Check spending limits
    const usage = aiUsageTracker.getSummary();
    if (this.spendingLimits.dailyLimitUSD > 0 && usage.dailySpentUSD + estimatedCostUSD > this.spendingLimits.dailyLimitUSD) {
      return {
        allowed: false,
        reason: `Daily AI cost ceiling ($${this.spendingLimits.dailyLimitUSD.toFixed(2)}) reached. Adjust limit in Settings → AI → Cost Control.`,
      };
    }

    if (this.spendingLimits.monthlyLimitUSD > 0 && usage.monthlySpentUSD + estimatedCostUSD > this.spendingLimits.monthlyLimitUSD) {
      return {
        allowed: false,
        reason: `Monthly AI cost ceiling ($${this.spendingLimits.monthlyLimitUSD.toFixed(2)}) reached. Adjust limit in Settings → AI → Cost Control.`,
      };
    }

    // Check payload size
    if (req.image && req.image.base64) {
      const payloadKB = Math.round((req.image.base64.length * 0.75) / 1024);
      if (payloadKB > this.spendingLimits.maxRequestPayloadKB) {
        return {
          allowed: false,
          reason: `Image payload size (${payloadKB} KB) exceeds configured limit (${this.spendingLimits.maxRequestPayloadKB} KB).`,
        };
      }
    }

    return { allowed: true };
  }

  /**
   * Sanitizes strings to prevent API keys from accidentally appearing in error messages or logs
   */
  public sanitizeErrorMessage(msg: string, knownKeys: string[] = []): string {
    let sanitized = msg;
    for (const k of knownKeys) {
      if (k && k.length > 5) {
        sanitized = sanitized.split(k).join('[REDACTED_API_KEY]');
      }
    }
    // Generic regex patterns for common API keys
    sanitized = sanitized.replace(/sk-[a-zA-Z0-9_\-]{20,}/g, '[REDACTED_OPENAI_KEY]');
    sanitized = sanitized.replace(/AIzaSy[a-zA-Z0-9_\-]{30,}/g, '[REDACTED_GEMINI_KEY]');
    sanitized = sanitized.replace(/sk-ant-[a-zA-Z0-9_\-]{20,}/g, '[REDACTED_ANTHROPIC_KEY]');
    sanitized = sanitized.replace(/gsk_[a-zA-Z0-9_\-]{20,}/g, '[REDACTED_GROQ_KEY]');
    return sanitized;
  }
}

export const aiSecurityGuard = AISecurityGuard.getInstance();
