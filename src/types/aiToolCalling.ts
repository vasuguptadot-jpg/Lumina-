import { AdjustmentSettings, ToneCurves, HSLSettings, SelectiveMask, CropSettings } from './editor';

export type ToolRiskLevel = 'safe' | 'low' | 'moderate' | 'elevated' | 'destructive';

export type PipelineStage = 
  | 'groq_raw_response'
  | 'tool_call_extraction'
  | 'schema_validation'
  | 'permission_check'
  | 'editing_engine_dispatch'
  | 'result_verification';

export interface AIToolCall<T = Record<string, any>> {
  id?: string;
  tool: string;
  parameters: T;
  rawResponse?: string;
  reasoning?: string;
  timestamp?: number;
}

export interface ParameterSchemaDef {
  type: 'number' | 'string' | 'boolean' | 'array' | 'object';
  description: string;
  required?: boolean;
  min?: number;
  max?: number;
  enum?: string[];
  default?: any;
  items?: ParameterSchemaDef;
}

export interface ToolDefinition {
  name: string;
  description: string;
  category: 'exposure' | 'color' | 'curves' | 'masking' | 'film' | 'geometry' | 'utility';
  riskLevel: ToolRiskLevel;
  parameters: {
    type: 'object';
    properties: Record<string, ParameterSchemaDef>;
    required?: string[];
    additionalProperties?: boolean;
  };
  exampleCall: AIToolCall;
}

export interface ValidationIssue {
  field: string;
  message: string;
  type: 'missing_parameter' | 'invalid_type' | 'out_of_bounds' | 'unknown_parameter' | 'syntax_error';
  originalValue?: any;
  clampedValue?: any;
}

export interface ToolValidationResult {
  valid: boolean;
  toolName: string;
  sanitizedParameters: Record<string, any>;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  schemaApplied: boolean;
}

export interface PermissionCheckResult {
  permitted: boolean;
  riskLevel: ToolRiskLevel;
  requiresUserConfirmation: boolean;
  reason: string;
  policyViolated?: string;
}

export interface ToolExecutionOutput {
  success: boolean;
  tool: string;
  appliedChanges: Record<string, any>;
  affectedTrack: 'adjustments' | 'curves' | 'hsl' | 'masks' | 'crop' | 'film' | 'system';
  executionTimeMs: number;
  message: string;
  error?: string;
}

export interface PipelineExecutionLog {
  id: string;
  timestamp: number;
  userPrompt: string;
  rawAIOutput: string;
  extractedToolCall: AIToolCall | null;
  validationResult: ToolValidationResult | null;
  permissionResult: PermissionCheckResult | null;
  engineResult: ToolExecutionOutput | null;
  overallStatus: 'success' | 'validation_failed' | 'permission_denied' | 'engine_error';
  latencyMs: number;
}

export interface ToolPolicyConfig {
  autoApproveSafe: boolean;
  autoApproveModerate: boolean;
  requireConfirmationElevated: boolean;
  blockDestructive: boolean;
  strictSchemaValidation: boolean;
  clampOutOfBounds: boolean; // if true, clamp e.g. exposure 150 -> 100 instead of failing
}

export const DEFAULT_TOOL_POLICY: ToolPolicyConfig = {
  autoApproveSafe: true,
  autoApproveModerate: true,
  requireConfirmationElevated: true,
  blockDestructive: false,
  strictSchemaValidation: true,
  clampOutOfBounds: true,
};
