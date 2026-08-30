/**
 * Lumina Studio Pro — Standardized AI Provider Adapter Interface
 */

import {
  AIUniversalRequest,
  AIUniversalResponse,
  AIModelDefinition,
  StoredProviderConfig,
} from '../../../types/aiProviderGateway';

export interface AIProviderAdapter {
  providerId: string;

  /**
   * Tests the connection, validates credentials, and verifies endpoint reachability
   */
  validateCredentials(config: StoredProviderConfig, apiKey: string): Promise<{
    success: boolean;
    modelsFound?: number;
    error?: string;
    latencyMs: number;
  }>;

  /**
   * Discovers available models from the provider API endpoint
   */
  listModels(config: StoredProviderConfig, apiKey: string): Promise<AIModelDefinition[]>;

  /**
   * Dispatches a universal request to the AI provider
   */
  executeRequest(
    config: StoredProviderConfig,
    apiKey: string,
    req: AIUniversalRequest
  ): Promise<AIUniversalResponse>;
}
