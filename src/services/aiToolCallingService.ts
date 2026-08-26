import {
  AIToolCall,
  ToolDefinition,
  ToolValidationResult,
  ValidationIssue,
  PermissionCheckResult,
  ToolExecutionOutput,
  PipelineExecutionLog,
  ToolPolicyConfig,
  DEFAULT_TOOL_POLICY,
  ToolRiskLevel,
} from '../types/aiToolCalling';
import {
  AdjustmentSettings,
  ToneCurves,
  HSLSettings,
  SelectiveMask,
  CropSettings,
} from '../types/editor';

const STORAGE_KEY_POLICY = 'lumina_ai_tool_policy_v1';
const STORAGE_KEY_PIPELINE_LOGS = 'lumina_ai_tool_pipeline_logs_v1';

// ----------------------------------------------------------------------------
// 1. TOOL DEFINITIONS & JSON SCHEMAS (REGISTERED & VALIDATED)
// ----------------------------------------------------------------------------

export const REGISTERED_TOOLS: Record<string, ToolDefinition> = {
  adjust_exposure: {
    name: 'adjust_exposure',
    description: 'Adjust global exposure (brightness) of the photograph in EV stops or slider units (-100 to +100 or -5.0 to +5.0 EV).',
    category: 'exposure',
    riskLevel: 'safe',
    parameters: {
      type: 'object',
      properties: {
        value: {
          type: 'number',
          description: 'Exposure value. If between -5.0 and 5.0 it is treated as EV stops (normalized to slider), otherwise -100 to +100 slider range.',
          required: true,
          min: -100,
          max: 100,
        },
        unit: {
          type: 'string',
          description: 'Optional unit representation.',
          enum: ['slider', 'ev'],
          default: 'slider',
        },
      },
      required: ['value'],
    },
    exampleCall: {
      tool: 'adjust_exposure',
      parameters: {
        value: 0.35,
        unit: 'ev',
      },
    },
  },

  adjust_contrast: {
    name: 'adjust_contrast',
    description: 'Adjust global tonal contrast curve intensity.',
    category: 'exposure',
    riskLevel: 'safe',
    parameters: {
      type: 'object',
      properties: {
        value: {
          type: 'number',
          description: 'Contrast adjustment value from -100 (low contrast/flat) to +100 (high punchy contrast).',
          required: true,
          min: -100,
          max: 100,
        },
      },
      required: ['value'],
    },
    exampleCall: {
      tool: 'adjust_contrast',
      parameters: {
        value: 15,
      },
    },
  },

  adjust_highlights_shadows: {
    name: 'adjust_highlights_shadows',
    description: 'Tune highlights, shadows, pure whites, and pure blacks to expand or compress dynamic range.',
    category: 'exposure',
    riskLevel: 'safe',
    parameters: {
      type: 'object',
      properties: {
        highlights: { type: 'number', description: 'Highlight recovery or boost (-100 to 100)', min: -100, max: 100 },
        shadows: { type: 'number', description: 'Shadow recovery or darkening (-100 to 100)', min: -100, max: 100 },
        whites: { type: 'number', description: 'White point clipping adjustment (-100 to 100)', min: -100, max: 100 },
        blacks: { type: 'number', description: 'Black floor crush or lift (-100 to 100)', min: -100, max: 100 },
      },
    },
    exampleCall: {
      tool: 'adjust_highlights_shadows',
      parameters: {
        highlights: -30,
        shadows: 25,
        whites: -10,
        blacks: 15,
      },
    },
  },

  adjust_white_balance: {
    name: 'adjust_white_balance',
    description: 'Adjust color temperature (Kelvin warmth/coolness) and tint (green/magenta balance).',
    category: 'color',
    riskLevel: 'safe',
    parameters: {
      type: 'object',
      properties: {
        temperature: { type: 'number', description: 'Warmth/coolness adjustment (-100 to 100)', min: -100, max: 100 },
        tint: { type: 'number', description: 'Green/magenta tint adjustment (-100 to 100)', min: -100, max: 100 },
      },
    },
    exampleCall: {
      tool: 'adjust_white_balance',
      parameters: {
        temperature: 12,
        tint: -4,
      },
    },
  },

  adjust_color_vibrance: {
    name: 'adjust_color_vibrance',
    description: 'Smart skin-tone-aware vibrance and global saturation.',
    category: 'color',
    riskLevel: 'safe',
    parameters: {
      type: 'object',
      properties: {
        vibrance: { type: 'number', description: 'Smart vibrance (-100 to 100)', min: -100, max: 100 },
        saturation: { type: 'number', description: 'Global saturation (-100 to 100)', min: -100, max: 100 },
      },
    },
    exampleCall: {
      tool: 'adjust_color_vibrance',
      parameters: {
        vibrance: 20,
        saturation: -5,
      },
    },
  },

  adjust_details: {
    name: 'adjust_details',
    description: 'Local microcontrast, clarity, texture acutance, dehaze, and sharpening.',
    category: 'exposure',
    riskLevel: 'low',
    parameters: {
      type: 'object',
      properties: {
        clarity: { type: 'number', description: 'Midtone microcontrast (-100 to 100)', min: -100, max: 100 },
        texture: { type: 'number', description: 'High-frequency surface texture (-100 to 100)', min: -100, max: 100 },
        dehaze: { type: 'number', description: 'Atmospheric dehaze / haze recovery (-100 to 100)', min: -100, max: 100 },
        sharpen: { type: 'number', description: 'Edge sharpening (0 to 100)', min: 0, max: 100 },
      },
    },
    exampleCall: {
      tool: 'adjust_details',
      parameters: {
        clarity: 15,
        texture: 10,
        dehaze: 8,
      },
    },
  },

  adjust_hsl_color: {
    name: 'adjust_hsl_color',
    description: 'Targeted Hue, Saturation, and Luminance adjustment on 8 individual spectral color channels.',
    category: 'color',
    riskLevel: 'safe',
    parameters: {
      type: 'object',
      properties: {
        color: {
          type: 'string',
          description: 'Color channel to modify.',
          required: true,
          enum: ['red', 'orange', 'yellow', 'green', 'aqua', 'blue', 'purple', 'magenta'],
        },
        hue: { type: 'number', description: 'Hue shift (-100 to 100)', min: -100, max: 100 },
        saturation: { type: 'number', description: 'Saturation shift (-100 to 100)', min: -100, max: 100 },
        luminance: { type: 'number', description: 'Luminance brightness (-100 to 100)', min: -100, max: 100 },
      },
      required: ['color'],
    },
    exampleCall: {
      tool: 'adjust_hsl_color',
      parameters: {
        color: 'orange',
        hue: 4,
        saturation: 10,
        luminance: 15,
      },
    },
  },

  apply_split_toning: {
    name: 'apply_split_toning',
    description: 'Apply chromatic color grading to shadows and highlights (e.g. Teal & Orange movie grading).',
    category: 'color',
    riskLevel: 'low',
    parameters: {
      type: 'object',
      properties: {
        shadowHue: { type: 'number', description: 'Shadow target hue in degrees (0 to 360)', min: 0, max: 360 },
        shadowSat: { type: 'number', description: 'Shadow saturation (0 to 100)', min: 0, max: 100 },
        highlightHue: { type: 'number', description: 'Highlight target hue in degrees (0 to 360)', min: 0, max: 360 },
        highlightSat: { type: 'number', description: 'Highlight saturation (0 to 100)', min: 0, max: 100 },
        balance: { type: 'number', description: 'Split-toning threshold balance (-100 to 100)', min: -100, max: 100 },
      },
    },
    exampleCall: {
      tool: 'apply_split_toning',
      parameters: {
        shadowHue: 208,
        shadowSat: 24,
        highlightHue: 38,
        highlightSat: 18,
        balance: 0,
      },
    },
  },

  apply_tone_curve: {
    name: 'apply_tone_curve',
    description: 'Apply non-linear parametric or point-based tone curves for photographic roll-off and contrast.',
    category: 'curves',
    riskLevel: 'moderate',
    parameters: {
      type: 'object',
      properties: {
        preset: {
          type: 'string',
          description: 'Standard tone curve profile preset.',
          enum: ['linear', 'medium_contrast', 'high_contrast', 'lifted_shadows', 'matte_film', 'cross_process'],
        },
        channel: {
          type: 'string',
          description: 'Color channel for curve.',
          enum: ['rgb', 'red', 'green', 'blue'],
          default: 'rgb',
        },
        points: {
          type: 'array',
          description: 'Array of [x, y] control points from [0, 0] to [255, 255].',
        },
      },
    },
    exampleCall: {
      tool: 'apply_tone_curve',
      parameters: {
        preset: 'medium_contrast',
        channel: 'rgb',
      },
    },
  },

  create_semantic_mask: {
    name: 'create_semantic_mask',
    description: 'Create an AI neural semantic mask (e.g. Subject, Sky, Background, Skin, Foliage) and apply local adjustments.',
    category: 'masking',
    riskLevel: 'moderate',
    parameters: {
      type: 'object',
      properties: {
        target: {
          type: 'string',
          description: 'Semantic region to isolate.',
          required: true,
          enum: ['subject', 'sky', 'background', 'skin', 'foliage', 'radial_vignette', 'linear_gradient'],
        },
        exposure: { type: 'number', description: 'Local exposure offset (-100 to 100)', min: -100, max: 100 },
        contrast: { type: 'number', description: 'Local contrast offset (-100 to 100)', min: -100, max: 100 },
        clarity: { type: 'number', description: 'Local clarity offset (-100 to 100)', min: -100, max: 100 },
        shadows: { type: 'number', description: 'Local shadow recovery (-100 to 100)', min: -100, max: 100 },
        highlights: { type: 'number', description: 'Local highlight recovery (-100 to 100)', min: -100, max: 100 },
        feather: { type: 'number', description: 'Edge soft feathering (0 to 100)', min: 0, max: 100, default: 45 },
        opacity: { type: 'number', description: 'Mask blend opacity (0 to 100)', min: 0, max: 100, default: 100 },
        invert: { type: 'boolean', description: 'Whether to invert the semantic boundary.', default: false },
      },
      required: ['target'],
    },
    exampleCall: {
      tool: 'create_semantic_mask',
      parameters: {
        target: 'subject',
        exposure: 35,
        clarity: 15,
        shadows: 20,
        feather: 45,
      },
    },
  },

  apply_film_effects: {
    name: 'apply_film_effects',
    description: 'Simulate organic celluloid film grain, halation, and anamorphic optical vignette.',
    category: 'film',
    riskLevel: 'low',
    parameters: {
      type: 'object',
      properties: {
        grainAmount: { type: 'number', description: 'Film grain intensity (0 to 100)', min: 0, max: 100 },
        grainSize: { type: 'number', description: 'Grain cluster size (1 to 5)', min: 1, max: 5 },
        vignetteAmount: { type: 'number', description: 'Optical vignette amount (-100 to 100)', min: -100, max: 100 },
        vignetteFeather: { type: 'number', description: 'Vignette softness (0 to 100)', min: 0, max: 100 },
        fade: { type: 'number', description: 'Matte black shadow fade (0 to 100)', min: 0, max: 100 },
      },
    },
    exampleCall: {
      tool: 'apply_film_effects',
      parameters: {
        grainAmount: 25,
        grainSize: 2,
        vignetteAmount: -28,
        fade: 6,
      },
    },
  },

  crop_image: {
    name: 'crop_image',
    description: 'Non-destructive geometric framing and aspect ratio crop.',
    category: 'geometry',
    riskLevel: 'elevated',
    parameters: {
      type: 'object',
      properties: {
        aspectRatio: {
          type: 'string',
          description: 'Standard aspect ratio string.',
          enum: ['1:1', '4:3', '3:2', '16:9', '9:16', 'custom'],
        },
        x: { type: 'number', description: 'Crop top-left X coordinate percentage (0 to 100)', min: 0, max: 100 },
        y: { type: 'number', description: 'Crop top-left Y coordinate percentage (0 to 100)', min: 0, max: 100 },
        width: { type: 'number', description: 'Crop width percentage (1 to 100)', min: 1, max: 100 },
        height: { type: 'number', description: 'Crop height percentage (1 to 100)', min: 1, max: 100 },
      },
    },
    exampleCall: {
      tool: 'crop_image',
      parameters: {
        aspectRatio: '16:9',
        x: 0,
        y: 12.5,
        width: 100,
        height: 75,
      },
    },
  },

  reset_adjustments: {
    name: 'reset_adjustments',
    description: 'Reset editing tracks back to initial baseline.',
    category: 'utility',
    riskLevel: 'destructive',
    parameters: {
      type: 'object',
      properties: {
        target: {
          type: 'string',
          description: 'Which track or system to reset.',
          required: true,
          enum: ['all', 'adjustments', 'curves', 'hsl', 'masks', 'film'],
        },
      },
      required: ['target'],
    },
    exampleCall: {
      tool: 'reset_adjustments',
      parameters: {
        target: 'adjustments',
      },
    },
  },
};

// ----------------------------------------------------------------------------
// 2. CONFIGURATION & LOGGING HELPERS
// ----------------------------------------------------------------------------

export function getToolPolicyConfig(): ToolPolicyConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_POLICY);
    return raw ? { ...DEFAULT_TOOL_POLICY, ...JSON.parse(raw) } : { ...DEFAULT_TOOL_POLICY };
  } catch {
    return { ...DEFAULT_TOOL_POLICY };
  }
}

export function saveToolPolicyConfig(policy: Partial<ToolPolicyConfig>): ToolPolicyConfig {
  const current = getToolPolicyConfig();
  const updated = { ...current, ...policy };
  localStorage.setItem(STORAGE_KEY_POLICY, JSON.stringify(updated));
  return updated;
}

export function getPipelineExecutionLogs(): PipelineExecutionLog[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PIPELINE_LOGS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addPipelineExecutionLog(log: PipelineExecutionLog): void {
  try {
    const existing = getPipelineExecutionLogs();
    const updated = [log, ...existing].slice(0, 50); // Keep last 50
    localStorage.setItem(STORAGE_KEY_PIPELINE_LOGS, JSON.stringify(updated));
  } catch {
    // Ignore storage issues
  }
}

// ----------------------------------------------------------------------------
// 3. STEP 2: SCHEMA VALIDATION & CLAMPING
// ----------------------------------------------------------------------------

export function validateToolCall(
  call: any,
  policy: ToolPolicyConfig = getToolPolicyConfig()
): ToolValidationResult {
  const errors: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];
  const sanitizedParams: Record<string, any> = {};

  if (!call || typeof call !== 'object') {
    return {
      valid: false,
      toolName: 'unknown',
      sanitizedParameters: {},
      errors: [{ field: 'root', message: 'Tool call must be a valid JSON object.', type: 'syntax_error' }],
      warnings: [],
      schemaApplied: false,
    };
  }

  const toolName = (call.tool || call.name || '').trim();
  if (!toolName) {
    return {
      valid: false,
      toolName: 'unknown',
      sanitizedParameters: {},
      errors: [{ field: 'tool', message: 'Missing "tool" name in tool call payload.', type: 'missing_parameter' }],
      warnings: [],
      schemaApplied: false,
    };
  }

  const toolDef = REGISTERED_TOOLS[toolName];
  if (!toolDef) {
    return {
      valid: false,
      toolName,
      sanitizedParameters: {},
      errors: [
        {
          field: 'tool',
          message: `Unknown or unregistered tool "${toolName}". Must be one of registered Lumina tools.`,
          type: 'unknown_parameter',
        },
      ],
      warnings: [],
      schemaApplied: false,
    };
  }

  const rawParams = call.parameters || call.arguments || {};
  if (typeof rawParams !== 'object' || rawParams === null) {
    return {
      valid: false,
      toolName,
      sanitizedParameters: {},
      errors: [{ field: 'parameters', message: 'Parameters must be an object.', type: 'invalid_type' }],
      warnings: [],
      schemaApplied: true,
    };
  }

  const schemaProps = toolDef.parameters.properties;
  const requiredFields = toolDef.parameters.required || [];

  // Check required parameters
  for (const req of requiredFields) {
    if (rawParams[req] === undefined || rawParams[req] === null) {
      errors.push({
        field: req,
        message: `Missing required parameter "${req}" for tool "${toolName}".`,
        type: 'missing_parameter',
      });
    }
  }

  // Validate and clamp each provided parameter
  for (const [key, val] of Object.entries(rawParams)) {
    const propSchema = schemaProps[key];
    if (!propSchema) {
      if (policy.strictSchemaValidation) {
        warnings.push({
          field: key,
          message: `Ignoring unrecognized parameter "${key}".`,
          type: 'unknown_parameter',
        });
      }
      continue;
    }

    // Type checking
    if (propSchema.type === 'number') {
      const numVal = Number(val);
      if (isNaN(numVal)) {
        errors.push({
          field: key,
          message: `Parameter "${key}" must be a numeric value, received "${val}".`,
          type: 'invalid_type',
          originalValue: val,
        });
        continue;
      }

      // Range checking & Clamping
      let clamped = numVal;
      let wasClamped = false;

      // Special case: exposure EV vs Slider conversion (-5 to 5 vs -100 to 100)
      if (toolName === 'adjust_exposure' && key === 'value' && Math.abs(numVal) <= 5.0 && numVal !== 0 && rawParams.unit !== 'slider') {
        // Normalize e.g. +0.35 EV to slider percentage (~ +17.5)
        clamped = Math.round(numVal * 50);
        warnings.push({
          field: key,
          message: `Converted ${numVal} EV stops to slider unit ${clamped}.`,
          type: 'out_of_bounds',
          originalValue: numVal,
          clampedValue: clamped,
        });
      } else {
        if (propSchema.min !== undefined && clamped < propSchema.min) {
          if (policy.clampOutOfBounds) {
            clamped = propSchema.min;
            wasClamped = true;
          } else {
            errors.push({
              field: key,
              message: `Parameter "${key}" value ${numVal} is below minimum allowed (${propSchema.min}).`,
              type: 'out_of_bounds',
              originalValue: numVal,
            });
            continue;
          }
        }
        if (propSchema.max !== undefined && clamped > propSchema.max) {
          if (policy.clampOutOfBounds) {
            clamped = propSchema.max;
            wasClamped = true;
          } else {
            errors.push({
              field: key,
              message: `Parameter "${key}" value ${numVal} exceeds maximum allowed (${propSchema.max}).`,
              type: 'out_of_bounds',
              originalValue: numVal,
            });
            continue;
          }
        }

        if (wasClamped) {
          warnings.push({
            field: key,
            message: `Clamped parameter "${key}" from ${numVal} to valid range [${propSchema.min}, ${propSchema.max}] -> ${clamped}.`,
            type: 'out_of_bounds',
            originalValue: numVal,
            clampedValue: clamped,
          });
        }
      }

      sanitizedParams[key] = clamped;
    } else if (propSchema.type === 'string') {
      const strVal = String(val).toLowerCase().trim();
      if (propSchema.enum && !propSchema.enum.includes(strVal)) {
        errors.push({
          field: key,
          message: `Invalid enum option "${val}" for "${key}". Allowed: [${propSchema.enum.join(', ')}].`,
          type: 'invalid_type',
          originalValue: val,
        });
        continue;
      }
      sanitizedParams[key] = strVal;
    } else if (propSchema.type === 'boolean') {
      sanitizedParams[key] = Boolean(val);
    } else if (propSchema.type === 'array') {
      if (!Array.isArray(val)) {
        errors.push({
          field: key,
          message: `Parameter "${key}" must be an array.`,
          type: 'invalid_type',
          originalValue: val,
        });
      } else {
        sanitizedParams[key] = val;
      }
    } else {
      sanitizedParams[key] = val;
    }
  }

  // Set default values for missing optional parameters
  for (const [key, propSchema] of Object.entries(schemaProps)) {
    if (sanitizedParams[key] === undefined && propSchema.default !== undefined) {
      sanitizedParams[key] = propSchema.default;
    }
  }

  return {
    valid: errors.length === 0,
    toolName,
    sanitizedParameters: sanitizedParams,
    errors,
    warnings,
    schemaApplied: true,
  };
}

// ----------------------------------------------------------------------------
// 4. STEP 3: PERMISSION & SAFETY CHECK
// ----------------------------------------------------------------------------

export function checkToolPermission(
  toolName: string,
  params: Record<string, any>,
  policy: ToolPolicyConfig = getToolPolicyConfig()
): PermissionCheckResult {
  const toolDef = REGISTERED_TOOLS[toolName];
  const riskLevel: ToolRiskLevel = toolDef?.riskLevel || 'elevated';

  // 1. Destructive Tools (e.g. wipe adjustments, destructive resets)
  if (riskLevel === 'destructive') {
    if (policy.blockDestructive) {
      return {
        permitted: false,
        riskLevel,
        requiresUserConfirmation: false,
        reason: 'Policy violation: Destructive operations are strictly blocked by safety settings.',
        policyViolated: 'blockDestructive',
      };
    }
    return {
      permitted: true,
      riskLevel,
      requiresUserConfirmation: true,
      reason: 'Destructive action requires explicit user authorization before execution.',
    };
  }

  // 2. Elevated Risk (e.g. crop geometry, major layout shifts)
  if (riskLevel === 'elevated') {
    if (policy.requireConfirmationElevated) {
      return {
        permitted: true,
        riskLevel,
        requiresUserConfirmation: true,
        reason: 'Elevated risk operation requires confirmation.',
      };
    }
    return {
      permitted: true,
      riskLevel,
      requiresUserConfirmation: false,
      reason: 'Elevated risk operation permitted under current policy.',
    };
  }

  // 3. Moderate Risk (e.g. neural semantic masks, curve modifications)
  if (riskLevel === 'moderate') {
    return {
      permitted: true,
      riskLevel,
      requiresUserConfirmation: !policy.autoApproveModerate,
      reason: policy.autoApproveModerate ? 'Moderate risk tool auto-approved.' : 'Moderate risk tool requires review.',
    };
  }

  // 4. Safe & Low Risk (e.g. exposure, contrast, temperature, vibrance, HSL)
  return {
    permitted: true,
    riskLevel,
    requiresUserConfirmation: !policy.autoApproveSafe,
    reason: 'Safe non-destructive photographic adjustment auto-approved.',
  };
}

// ----------------------------------------------------------------------------
// 5. STEP 4: DISPATCH VALIDATED TOOL CALL TO EDITING ENGINE
// ----------------------------------------------------------------------------

export interface EngineContext {
  adjustments: AdjustmentSettings;
  toneCurves: ToneCurves;
  hsl: HSLSettings;
  masks: SelectiveMask[];
  crop?: CropSettings;
  setAdjustments?: (fn: (prev: AdjustmentSettings) => AdjustmentSettings) => void;
  setToneCurves?: (fn: (prev: ToneCurves) => ToneCurves) => void;
  setHsl?: (fn: (prev: HSLSettings) => HSLSettings) => void;
  setMasks?: (fn: (prev: SelectiveMask[]) => SelectiveMask[]) => void;
  setCrop?: (crop: CropSettings) => void;
}

export function executeValidatedToolCall(
  toolName: string,
  sanitizedParams: Record<string, any>,
  context: EngineContext
): ToolExecutionOutput {
  const startTime = performance.now();

  try {
    switch (toolName) {
      case 'adjust_exposure': {
        const val = sanitizedParams.value;
        context.setAdjustments?.((prev) => ({ ...prev, exposure: val }));
        return {
          success: true,
          tool: toolName,
          appliedChanges: { exposure: val },
          affectedTrack: 'adjustments',
          executionTimeMs: performance.now() - startTime,
          message: `Exposure updated to ${val > 0 ? '+' : ''}${val}`,
        };
      }

      case 'adjust_contrast': {
        const val = sanitizedParams.value;
        context.setAdjustments?.((prev) => ({ ...prev, contrast: val }));
        return {
          success: true,
          tool: toolName,
          appliedChanges: { contrast: val },
          affectedTrack: 'adjustments',
          executionTimeMs: performance.now() - startTime,
          message: `Contrast set to ${val > 0 ? '+' : ''}${val}`,
        };
      }

      case 'adjust_highlights_shadows': {
        const updates: Partial<AdjustmentSettings> = {};
        if (sanitizedParams.highlights !== undefined) updates.highlights = sanitizedParams.highlights;
        if (sanitizedParams.shadows !== undefined) updates.shadows = sanitizedParams.shadows;
        if (sanitizedParams.whites !== undefined) updates.whites = sanitizedParams.whites;
        if (sanitizedParams.blacks !== undefined) updates.blacks = sanitizedParams.blacks;

        context.setAdjustments?.((prev) => ({ ...prev, ...updates }));
        return {
          success: true,
          tool: toolName,
          appliedChanges: updates,
          affectedTrack: 'adjustments',
          executionTimeMs: performance.now() - startTime,
          message: `Dynamic range tuned: ${Object.entries(updates).map(([k, v]) => `${k}: ${v}`).join(', ')}`,
        };
      }

      case 'adjust_white_balance': {
        const updates: Partial<AdjustmentSettings> = {};
        if (sanitizedParams.temperature !== undefined) updates.temperature = sanitizedParams.temperature;
        if (sanitizedParams.tint !== undefined) updates.tint = sanitizedParams.tint;

        context.setAdjustments?.((prev) => ({ ...prev, ...updates }));
        return {
          success: true,
          tool: toolName,
          appliedChanges: updates,
          affectedTrack: 'adjustments',
          executionTimeMs: performance.now() - startTime,
          message: `White balance calibrated: Temp ${updates.temperature ?? '0'}, Tint ${updates.tint ?? '0'}`,
        };
      }

      case 'adjust_color_vibrance': {
        const updates: Partial<AdjustmentSettings> = {};
        if (sanitizedParams.vibrance !== undefined) updates.vibrance = sanitizedParams.vibrance;
        if (sanitizedParams.saturation !== undefined) updates.saturation = sanitizedParams.saturation;

        context.setAdjustments?.((prev) => ({ ...prev, ...updates }));
        return {
          success: true,
          tool: toolName,
          appliedChanges: updates,
          affectedTrack: 'adjustments',
          executionTimeMs: performance.now() - startTime,
          message: `Vibrance & saturation updated.`,
        };
      }

      case 'adjust_details': {
        const updates: Partial<AdjustmentSettings> = {};
        if (sanitizedParams.clarity !== undefined) updates.clarity = sanitizedParams.clarity;
        if (sanitizedParams.texture !== undefined) updates.texture = sanitizedParams.texture;
        if (sanitizedParams.dehaze !== undefined) updates.dehaze = sanitizedParams.dehaze;
        if (sanitizedParams.sharpen !== undefined) updates.sharpness = sanitizedParams.sharpen;

        context.setAdjustments?.((prev) => ({ ...prev, ...updates }));
        return {
          success: true,
          tool: toolName,
          appliedChanges: updates,
          affectedTrack: 'adjustments',
          executionTimeMs: performance.now() - startTime,
          message: `Acutance details updated: Clarity ${updates.clarity ?? 0}, Dehaze ${updates.dehaze ?? 0}`,
        };
      }

      case 'adjust_hsl_color': {
        const color = sanitizedParams.color as keyof HSLSettings;
        const colorUpdates: any = {};
        if (sanitizedParams.hue !== undefined) colorUpdates.hue = sanitizedParams.hue;
        if (sanitizedParams.saturation !== undefined) colorUpdates.saturation = sanitizedParams.saturation;
        if (sanitizedParams.luminance !== undefined) colorUpdates.luminance = sanitizedParams.luminance;

        context.setHsl?.((prev) => ({
          ...prev,
          [color]: { ...(prev[color] || { hue: 0, saturation: 0, luminance: 0 }), ...colorUpdates },
        }));

        return {
          success: true,
          tool: toolName,
          appliedChanges: { [color]: colorUpdates },
          affectedTrack: 'hsl',
          executionTimeMs: performance.now() - startTime,
          message: `HSL channel [${color.toUpperCase()}] updated.`,
        };
      }

      case 'apply_split_toning': {
        context.setAdjustments?.((prev) => ({
          ...prev,
          splitToning: {
            shadowHue: sanitizedParams.shadowHue ?? prev.splitToning?.shadowHue ?? 0,
            shadowSat: sanitizedParams.shadowSat ?? prev.splitToning?.shadowSat ?? 0,
            highlightHue: sanitizedParams.highlightHue ?? prev.splitToning?.highlightHue ?? 0,
            highlightSat: sanitizedParams.highlightSat ?? prev.splitToning?.highlightSat ?? 0,
            balance: sanitizedParams.balance ?? prev.splitToning?.balance ?? 0,
          },
        }));
        return {
          success: true,
          tool: toolName,
          appliedChanges: { splitToning: sanitizedParams },
          affectedTrack: 'adjustments',
          executionTimeMs: performance.now() - startTime,
          message: `Split toning applied (Shadows: ${sanitizedParams.shadowHue}° / Highlights: ${sanitizedParams.highlightHue}°).`,
        };
      }

      case 'apply_tone_curve': {
        const preset = sanitizedParams.preset;
        let points: [number, number][] = [[0, 0], [255, 255]];

        if (preset === 'medium_contrast') {
          points = [[0, 0], [64, 48], [128, 128], [192, 208], [255, 255]];
        } else if (preset === 'high_contrast') {
          points = [[0, 0], [64, 36], [128, 128], [192, 220], [255, 255]];
        } else if (preset === 'lifted_shadows' || preset === 'matte_film') {
          points = [[0, 18], [64, 55], [128, 128], [192, 205], [255, 245]];
        } else if (Array.isArray(sanitizedParams.points) && sanitizedParams.points.length >= 2) {
          points = sanitizedParams.points;
        }

        const channel = sanitizedParams.channel || 'master';
        const curveChannel = channel === 'rgb' ? 'master' : channel;
        const curvePoints = points.map(([x, y]) => ({ x, y }));

        context.setToneCurves?.((prev) => ({
          ...prev,
          [curveChannel]: curvePoints,
        }));

        return {
          success: true,
          tool: toolName,
          appliedChanges: { [curveChannel]: curvePoints },
          affectedTrack: 'curves',
          executionTimeMs: performance.now() - startTime,
          message: `Tone curve applied on channel [${curveChannel.toUpperCase()}] with ${points.length} points.`,
        };
      }

      case 'create_semantic_mask': {
        let maskType: any = 'ai-subject';
        if (sanitizedParams.target === 'sky') maskType = 'ai-sky';
        else if (sanitizedParams.target === 'background') maskType = 'ai-background';
        else if (sanitizedParams.target === 'skin') maskType = 'ai-skin';
        else if (sanitizedParams.target.includes('radial')) maskType = 'radial';
        else if (sanitizedParams.target.includes('linear')) maskType = 'linear';

        const newMask: SelectiveMask = {
          id: `ai_mask_${Date.now()}`,
          name: `AI Neural ${sanitizedParams.target.toUpperCase()} Mask`,
          type: maskType,
          visible: true,
          inverted: Boolean(sanitizedParams.invert),
          feather: sanitizedParams.feather ?? 45,
          opacity: sanitizedParams.opacity ?? 100,
          adjustments: {
            exposure: sanitizedParams.exposure ?? 0,
            contrast: sanitizedParams.contrast ?? 0,
            clarity: sanitizedParams.clarity ?? 0,
            shadows: sanitizedParams.shadows ?? 0,
            highlights: sanitizedParams.highlights ?? 0,
            saturation: 0,
            temperature: 0,
            tint: 0,
            dehaze: 0,
            sharpness: 0,
          },
        };

        context.setMasks?.((prev) => [...prev, newMask]);

        return {
          success: true,
          tool: toolName,
          appliedChanges: newMask as any,
          affectedTrack: 'masks',
          executionTimeMs: performance.now() - startTime,
          message: `Created semantic neural mask for ${sanitizedParams.target.toUpperCase()} with ${sanitizedParams.exposure ?? 0} exposure.`,
        };
      }

      case 'apply_film_effects': {
        const updates: Partial<AdjustmentSettings> = {};
        if (sanitizedParams.grainAmount !== undefined) updates.filmGrain = sanitizedParams.grainAmount;
        if (sanitizedParams.grainSize !== undefined) updates.filmGrainSize = sanitizedParams.grainSize;
        if (sanitizedParams.vignetteAmount !== undefined) updates.vignette = sanitizedParams.vignetteAmount;
        if (sanitizedParams.vignetteFeather !== undefined) updates.vignetteFeather = sanitizedParams.vignetteFeather;
        if (sanitizedParams.fade !== undefined) updates.fade = sanitizedParams.fade;

        context.setAdjustments?.((prev) => ({ ...prev, ...updates }));
        return {
          success: true,
          tool: toolName,
          appliedChanges: updates,
          affectedTrack: 'film',
          executionTimeMs: performance.now() - startTime,
          message: `35mm Analog film texture and vignette applied.`,
        };
      }

      case 'crop_image': {
        const cropSettings: CropSettings = {
          aspectRatio: 'free',
          x: (sanitizedParams.x ?? 0) / 100,
          y: (sanitizedParams.y ?? 0) / 100,
          width: (sanitizedParams.width ?? 100) / 100,
          height: (sanitizedParams.height ?? 100) / 100,
          rotation: 0,
          flipX: false,
          flipY: false,
          perspectiveX: 0,
          perspectiveY: 0,
        };
        context.setCrop?.(cropSettings);
        return {
          success: true,
          tool: toolName,
          appliedChanges: cropSettings as any,
          affectedTrack: 'crop',
          executionTimeMs: performance.now() - startTime,
          message: `Cropped frame to ${sanitizedParams.aspectRatio || 'custom'}.`,
        };
      }

      default:
        return {
          success: false,
          tool: toolName,
          appliedChanges: {},
          affectedTrack: 'system',
          executionTimeMs: performance.now() - startTime,
          message: `No execution handler implemented for tool "${toolName}".`,
          error: `Unhandled tool "${toolName}"`,
        };
    }
  } catch (err: any) {
    return {
      success: false,
      tool: toolName,
      appliedChanges: {},
      affectedTrack: 'system',
      executionTimeMs: performance.now() - startTime,
      message: `Failed to execute tool on engine: ${err.message}`,
      error: err.message,
    };
  }
}

// ----------------------------------------------------------------------------
// 6. FULL PIPELINE ORCHESTRATOR
// Flow: Groq -> Tool Call -> Schema Validation -> Permission Check -> Editing Engine -> Result
// ----------------------------------------------------------------------------

export interface ProcessPipelineResult {
  pipelineStages: {
    groqRaw: string;
    extractedToolCall: AIToolCall | null;
    validation: ToolValidationResult;
    permission: PermissionCheckResult;
    execution: ToolExecutionOutput | null;
  };
  success: boolean;
  statusMessage: string;
  totalTimeMs: number;
}

export function parseRawToolCallFromAI(rawOutput: string | any): AIToolCall | null {
  if (!rawOutput) return null;

  // 1. If already an object
  if (typeof rawOutput === 'object') {
    if (rawOutput.tool || rawOutput.name) {
      return {
        tool: rawOutput.tool || rawOutput.name,
        parameters: rawOutput.parameters || rawOutput.arguments || {},
        rawResponse: JSON.stringify(rawOutput),
        reasoning: rawOutput.reasoning,
        timestamp: Date.now(),
      };
    }
    if (rawOutput.tool_call || rawOutput.toolCall) {
      const inner = rawOutput.tool_call || rawOutput.toolCall;
      return {
        tool: inner.tool || inner.name,
        parameters: inner.parameters || inner.arguments || {},
        rawResponse: JSON.stringify(rawOutput),
        reasoning: rawOutput.reasoning,
        timestamp: Date.now(),
      };
    }
  }

  // 2. If JSON string
  if (typeof rawOutput === 'string') {
    const trimmed = rawOutput.trim();
    try {
      const parsed = JSON.parse(trimmed);
      return parseRawToolCallFromAI(parsed);
    } catch {
      // Look for ```json ... ``` blocks
      const jsonMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
      if (jsonMatch && jsonMatch[1]) {
        try {
          const parsedBlock = JSON.parse(jsonMatch[1]);
          return parseRawToolCallFromAI(parsedBlock);
        } catch {
          // continue
        }
      }

      // Look for first '{' and last '}'
      const firstBrace = trimmed.indexOf('{');
      const lastBrace = trimmed.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        try {
          const candidate = trimmed.substring(firstBrace, lastBrace + 1);
          const parsed = JSON.parse(candidate);
          return parseRawToolCallFromAI(parsed);
        } catch {
          // continue
        }
      }
    }
  }

  return null;
}

export async function processAIToolCallPipeline(
  rawAiOutput: any,
  context: EngineContext,
  userPrompt: string = '',
  policy: ToolPolicyConfig = getToolPolicyConfig()
): Promise<ProcessPipelineResult> {
  const startTime = performance.now();
  const rawString = typeof rawAiOutput === 'string' ? rawAiOutput : JSON.stringify(rawAiOutput, null, 2);

  // STAGE 1 & 2: Extract Tool Call
  const extractedCall = parseRawToolCallFromAI(rawAiOutput);

  if (!extractedCall) {
    const totalTimeMs = performance.now() - startTime;
    const validationFailedResult: ToolValidationResult = {
      valid: false,
      toolName: 'unknown',
      sanitizedParameters: {},
      errors: [{ field: 'syntax', message: 'Could not extract valid tool JSON from AI response.', type: 'syntax_error' }],
      warnings: [],
      schemaApplied: false,
    };
    const permBlocked: PermissionCheckResult = {
      permitted: false,
      riskLevel: 'elevated',
      requiresUserConfirmation: false,
      reason: 'Failed prior to permission check.',
    };

    addPipelineExecutionLog({
      id: `log_${Date.now()}`,
      timestamp: Date.now(),
      userPrompt,
      rawAIOutput: rawString,
      extractedToolCall: null,
      validationResult: validationFailedResult,
      permissionResult: permBlocked,
      engineResult: null,
      overallStatus: 'validation_failed',
      latencyMs: totalTimeMs,
    });

    return {
      pipelineStages: {
        groqRaw: rawString,
        extractedToolCall: null,
        validation: validationFailedResult,
        permission: permBlocked,
        execution: null,
      },
      success: false,
      statusMessage: 'Failed: AI did not output a valid tool call structure.',
      totalTimeMs,
    };
  }

  // STAGE 3: Schema Validation & Parameter Clamping
  const validationResult = validateToolCall(extractedCall, policy);

  if (!validationResult.valid) {
    const totalTimeMs = performance.now() - startTime;
    const permBlocked: PermissionCheckResult = {
      permitted: false,
      riskLevel: 'moderate',
      requiresUserConfirmation: false,
      reason: 'Schema validation rejected tool call.',
    };

    addPipelineExecutionLog({
      id: `log_${Date.now()}`,
      timestamp: Date.now(),
      userPrompt,
      rawAIOutput: rawString,
      extractedToolCall: extractedCall,
      validationResult,
      permissionResult: permBlocked,
      engineResult: null,
      overallStatus: 'validation_failed',
      latencyMs: totalTimeMs,
    });

    return {
      pipelineStages: {
        groqRaw: rawString,
        extractedToolCall: extractedCall,
        validation: validationResult,
        permission: permBlocked,
        execution: null,
      },
      success: false,
      statusMessage: `Validation Error: ${validationResult.errors.map((e) => e.message).join(', ')}`,
      totalTimeMs,
    };
  }

  // STAGE 4: Permission & Risk Check
  const permissionResult = checkToolPermission(
    validationResult.toolName,
    validationResult.sanitizedParameters,
    policy
  );

  if (!permissionResult.permitted) {
    const totalTimeMs = performance.now() - startTime;
    addPipelineExecutionLog({
      id: `log_${Date.now()}`,
      timestamp: Date.now(),
      userPrompt,
      rawAIOutput: rawString,
      extractedToolCall: extractedCall,
      validationResult,
      permissionResult,
      engineResult: null,
      overallStatus: 'permission_denied',
      latencyMs: totalTimeMs,
    });

    return {
      pipelineStages: {
        groqRaw: rawString,
        extractedToolCall: extractedCall,
        validation: validationResult,
        permission: permissionResult,
        execution: null,
      },
      success: false,
      statusMessage: `Permission Blocked: ${permissionResult.reason}`,
      totalTimeMs,
    };
  }

  // STAGE 5: Dispatch to Editing Engine
  const engineResult = executeValidatedToolCall(
    validationResult.toolName,
    validationResult.sanitizedParameters,
    context
  );

  const totalTimeMs = performance.now() - startTime;

  addPipelineExecutionLog({
    id: `log_${Date.now()}`,
    timestamp: Date.now(),
    userPrompt,
    rawAIOutput: rawString,
    extractedToolCall: extractedCall,
    validationResult,
    permissionResult,
    engineResult,
    overallStatus: engineResult.success ? 'success' : 'engine_error',
    latencyMs: totalTimeMs,
  });

  return {
    pipelineStages: {
      groqRaw: rawString,
      extractedToolCall: extractedCall,
      validation: validationResult,
      permission: permissionResult,
      execution: engineResult,
    },
    success: engineResult.success,
    statusMessage: engineResult.message,
    totalTimeMs,
  };
}

// ----------------------------------------------------------------------------
// 7. GROQ SYSTEM SPECIFICATION BUILDER (FORCED TOOL-CALLING PROMPT)
// ----------------------------------------------------------------------------

export function generateGroqToolCallingSystemPrompt(): string {
  const toolsJson = Object.values(REGISTERED_TOOLS).map((t) => ({
    name: t.name,
    description: t.description,
    parameters: t.parameters,
  }));

  return `You are Lumina AI Photographic Color Scientist and Engine Dispatcher.
CRITICAL INSTRUCTION: You MUST NEVER respond with plain conversational text (e.g. "Increase brightness").
You MUST strictly respond with a single machine-readable JSON object matching the following structure:
{
  "tool": "<tool_name>",
  "parameters": {
    "<parameter_name>": <value>
  },
  "reasoning": "<short 1-sentence photographic justification>"
}

Available Photographic Tools & Specifications:
${JSON.stringify(toolsJson, null, 2)}

Strict Validation Constraints:
1. "tool" must be an exact match from the registered tools list.
2. Numeric values must adhere strictly to valid range limits.
3. Output ONLY valid parseable JSON. Do not include markdown or explanations outside the JSON object.`;
}
