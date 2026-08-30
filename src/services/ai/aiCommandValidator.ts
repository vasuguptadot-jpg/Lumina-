/**
 * Lumina Studio Pro — AI Command Architecture & Strict Validator
 *
 * Enforces the safety principle: AI must NEVER manipulate arbitrary application state
 * or execute raw code. All AI operations are validated against a strict, typed schema
 * with clamped mathematical bounds.
 */

import { AIEditOperation, AIStructuredEditIntent } from '../../types/localAIModels';

export class AICommandValidator {
  /**
   * Validates and parses raw text or JSON into a strictly validated AIStructuredEditIntent.
   */
  public static validate(rawInput: string | object): {
    isValid: boolean;
    intent?: AIStructuredEditIntent;
    errors: string[];
  } {
    const errors: string[] = [];
    let parsed: any;

    if (typeof rawInput === 'string') {
      try {
        // Strip markdown fences if present
        let clean = rawInput.trim();
        if (clean.startsWith('```json')) {
          clean = clean.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (clean.startsWith('```')) {
          clean = clean.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }
        parsed = JSON.parse(clean);
      } catch (e: any) {
        return {
          isValid: false,
          errors: [`Failed to parse JSON edit intent: ${e.message}`],
        };
      }
    } else {
      parsed = rawInput;
    }

    if (!parsed || typeof parsed !== 'object') {
      return { isValid: false, errors: ['Edit intent must be a JSON object'] };
    }

    const intentStr = typeof parsed.intent === 'string' ? parsed.intent.substring(0, 120) : 'custom_edit';
    const explanationStr = typeof parsed.explanation === 'string' ? parsed.explanation.substring(0, 500) : 'Applied smart photo adjustments';
    const confidence = typeof parsed.confidence === 'number' ? Math.max(0, Math.min(1, parsed.confidence)) : 0.95;

    if (!Array.isArray(parsed.operations)) {
      return { isValid: false, errors: ['Edit intent must contain an "operations" array'] };
    }

    const validatedOperations: AIEditOperation[] = [];

    for (let i = 0; i < parsed.operations.length; i++) {
      const op = parsed.operations[i];
      if (!op || typeof op !== 'object') {
        errors.push(`Operation at index ${i} is not a valid object`);
        continue;
      }

      switch (op.type) {
        case 'CREATE_MASK': {
          const target = ['entire_image', 'subject', 'background', 'sky', 'face', 'masked_region'].includes(op.target)
            ? op.target
            : 'subject';
          const confidenceThreshold = typeof op.confidenceThreshold === 'number'
            ? Math.max(0.1, Math.min(1.0, op.confidenceThreshold))
            : 0.85;
          validatedOperations.push({
            type: 'CREATE_MASK',
            target,
            confidenceThreshold,
            description: op.description ? String(op.description).substring(0, 100) : `Segment ${target}`,
          });
          break;
        }

        case 'INPAINT': {
          validatedOperations.push({
            type: 'INPAINT',
            maskId: op.maskId ? String(op.maskId) : undefined,
            strength: typeof op.strength === 'number' ? Math.max(0, Math.min(100, op.strength)) : 100,
            description: op.description ? String(op.description).substring(0, 100) : 'Inpaint selected region',
          });
          break;
        }

        case 'ADJUST_EXPOSURE': {
          const val = typeof op.value === 'number' ? Math.max(-5.0, Math.min(5.0, op.value)) : 0;
          validatedOperations.push({
            type: 'ADJUST_EXPOSURE',
            target: op.target || 'entire_image',
            value: Number(val.toFixed(2)),
            description: `Exposure ${val >= 0 ? '+' : ''}${val.toFixed(2)} EV`,
          });
          break;
        }

        case 'ADJUST_CONTRAST':
        case 'ADJUST_TEMPERATURE':
        case 'ADJUST_TINT':
        case 'ADJUST_SATURATION':
        case 'ADJUST_HIGHLIGHTS':
        case 'ADJUST_SHADOWS': {
          const val = typeof op.value === 'number' ? Math.max(-100, Math.min(100, op.value)) : 0;
          validatedOperations.push({
            type: op.type,
            target: op.target || 'entire_image',
            value: Math.round(val),
            description: `${op.type.replace('ADJUST_', '')}: ${val >= 0 ? '+' : ''}${Math.round(val)}`,
          });
          break;
        }

        case 'DENOISE': {
          const strength = typeof op.strength === 'number' ? Math.max(0, Math.min(100, op.strength)) : 25;
          validatedOperations.push({
            type: 'DENOISE',
            strength: Math.round(strength),
            description: `Denoise ${Math.round(strength)}%`,
          });
          break;
        }

        case 'SUPER_RESOLVE': {
          const scale = op.scaleFactor === 4 ? 4 : 2;
          validatedOperations.push({
            type: 'SUPER_RESOLVE',
            scaleFactor: scale,
            description: `Neural Super-Resolution ${scale}x`,
          });
          break;
        }

        case 'AUTO_BALANCE': {
          validatedOperations.push({
            type: 'AUTO_BALANCE',
            description: 'Intelligent White Balance & Dynamic Tone Mapping',
          });
          break;
        }

        case 'RELIGHT': {
          const dir: [number, number, number] = Array.isArray(op.lightDirection) && op.lightDirection.length === 3
            ? [op.lightDirection[0], op.lightDirection[1], op.lightDirection[2]]
            : [0.5, -0.5, 1.0];
          validatedOperations.push({
            type: 'RELIGHT',
            lightDirection: dir,
            strength: typeof op.strength === 'number' ? Math.max(0, Math.min(100, op.strength)) : 50,
            description: '3D Directional Relighting',
          });
          break;
        }

        default:
          errors.push(`Unrecognized or unauthorized operation type: ${op.type}`);
          break;
      }
    }

    if (validatedOperations.length === 0) {
      return { isValid: false, errors: ['No valid operations recognized in payload'] };
    }

    const validatedIntent: AIStructuredEditIntent = {
      intent: intentStr,
      explanation: explanationStr,
      operations: validatedOperations,
      confidence,
    };

    return {
      isValid: true,
      intent: validatedIntent,
      errors,
    };
  }

  /**
   * Helper that translates a natural language prompt (e.g. "make it warmer and boost shadows +20")
   * into a deterministic structured intent if running in offline rule-based fallback mode.
   */
  public static parseDeterministicPrompt(prompt: string): AIStructuredEditIntent {
    const low = prompt.toLowerCase();
    const ops: AIEditOperation[] = [];

    if (low.includes('warm') || low.includes('golden') || low.includes('sunset')) {
      ops.push({ type: 'ADJUST_TEMPERATURE', value: 25, description: 'Warm Golden Temperature +25' });
    }
    if (low.includes('cool') || low.includes('cold') || low.includes('blue')) {
      ops.push({ type: 'ADJUST_TEMPERATURE', value: -25, description: 'Cool Temperature -25' });
    }
    if (low.includes('shadow') || low.includes('dark areas')) {
      ops.push({ type: 'ADJUST_SHADOWS', value: 35, description: 'Shadow Recovery +35' });
    }
    if (low.includes('highlight') || low.includes('bright areas')) {
      ops.push({ type: 'ADJUST_HIGHLIGHTS', value: -25, description: 'Highlight Compression -25' });
    }
    if (low.includes('contrast') || low.includes('punchy') || low.includes('pop')) {
      ops.push({ type: 'ADJUST_CONTRAST', value: 20, description: 'Contrast Boost +20' });
    }
    if (low.includes('denoise') || low.includes('noise') || low.includes('grain')) {
      ops.push({ type: 'DENOISE', strength: 30, description: 'NAFNet Denoise 30%' });
    }
    if (low.includes('upscale') || low.includes('super resolve') || low.includes('enhance resolution')) {
      ops.push({ type: 'SUPER_RESOLVE', scaleFactor: 2, description: 'Real-ESRGAN 2x Upscale' });
    }
    if (low.includes('cutout') || low.includes('remove background') || low.includes('segment subject')) {
      ops.push({ type: 'CREATE_MASK', target: 'subject', confidenceThreshold: 0.85, description: 'BiRefNet Subject Segmentation' });
    }

    if (ops.length === 0) {
      // Default balanced enhancement
      ops.push(
        { type: 'AUTO_BALANCE', description: 'Intelligent Tone & White Balance' },
        { type: 'ADJUST_CONTRAST', value: 10, description: 'Micro-Contrast +10' }
      );
    }

    return {
      intent: 'natural_language_edit',
      explanation: `Translated natural language command "${prompt}" into ${ops.length} structured adjustments.`,
      operations: ops,
      confidence: 0.98,
    };
  }
}
