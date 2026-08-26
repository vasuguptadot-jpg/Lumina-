import {
  AdjustmentSettings,
  ToneCurves,
  HSLSettings,
  SelectiveMask,
  CropSettings,
  Project,
} from './editor';

export type VerificationCheckType =
  | 'OBJECT_REMOVAL_VERIFICATION'   // Did the requested object disappear?
  | 'SUBJECT_PRESERVATION'         // Was the subject preserved?
  | 'FACE_IDENTITY_INTEGRITY'       // Did the face change unexpectedly?
  | 'VISUAL_ARTIFACT_DETECTION'     // Are there visual artifacts / hallucinations?
  | 'EDGE_REALISM_AND_HALOS'        // Are edges realistic & halo-free?
  | 'LIGHTING_CONSISTENCY'          // Is lighting consistent across composite?
  | 'SHADOW_CONSISTENCY'            // Are shadows & contact occlusion consistent?
  | 'PROTECTED_REGION_INTEGRITY'    // Did the AI modify protected/locked regions?
  | 'RESOLUTION_AND_RASTER_GRID';   // Did image resolution/aspect ratio change?

export type VerificationStatus = 'passed' | 'warning' | 'failed' | 'repaired';

export interface VerificationCheckResult {
  id: string;
  type: VerificationCheckType;
  title: string;
  question: string;
  status: 'passed' | 'warning' | 'failed';
  score: number; // 0 - 100
  threshold: number; // minimum score to pass (e.g. 95)
  measuredMetric: string;
  deltaTolerance: string;
  summary: string;
  diagnostics: string[];
  severity: 'low' | 'minor' | 'moderate' | 'critical';
  remedyActionSuggested?: string;
}

export interface VerificationIssue {
  id: string;
  checkType: VerificationCheckType;
  title: string;
  description: string;
  severity: 'low' | 'minor' | 'moderate' | 'critical';
  affectedRegion: string;
  proposedFix: string;
}

export interface AutoRepairStep {
  id: string;
  stepNumber: number;
  targetIssue: string;
  actionType:
    | 'RESTORE_FACE_MASK'
    | 'SUPPRESS_EDGE_HALO'
    | 'CLAMP_LIGHTING_VECTOR'
    | 'RECONSTRUCT_CONTACT_SHADOW'
    | 'INPAINT_RESIDUAL_OBJECT'
    | 'REVERT_PROTECTED_POLYGON'
    | 'RESTORE_RASTER_GRID'
    | 'COLOR_HARMONIZE';
  title: string;
  description: string;
  parametersModified: string[];
  appliedAdjustments?: Partial<AdjustmentSettings>;
  appliedMasks?: SelectiveMask[];
  status: 'pending' | 'repairing' | 'completed' | 'verified';
  deltaAfterRepair?: string;
}

export interface AutoRepairPlan {
  id: string;
  verificationReportId: string;
  triggerReason: string;
  severity: 'minor' | 'moderate' | 'critical';
  steps: AutoRepairStep[];
  explanation: string;
  createdAt: number;
  completedAt?: number;
  success: boolean;
  finalScore: number;
}

export interface AIVerificationReport {
  id: string;
  planId?: string;
  prompt: string;
  timestamp: number;
  overallStatus: VerificationStatus;
  overallScore: number; // 0 - 100
  passRate: number; // e.g. 88% or 100%
  latencyMs: number;
  verifierEngine: string;
  checks: VerificationCheckResult[];
  issuesDetected: VerificationIssue[];
  repairPlan: AutoRepairPlan | null;
  reVerificationReport?: AIVerificationReport | null;
  historyTimeline: {
    stage: 'PLAN' | 'EXECUTE' | 'RESULT' | 'VERIFY' | 'REPAIR_PLAN' | 'RE_EDIT' | 'VERIFY_AGAIN' | 'CERTIFIED';
    timestamp: number;
    description: string;
    status: 'success' | 'warning' | 'failure';
  }[];
}

export interface VerificationAuditPreset {
  id: string;
  title: string;
  description: string;
  category: string;
  simulatedFailureType?: 'NONE' | 'FACE_DRIFT' | 'EDGE_HALO' | 'LIGHTING_MISMATCH' | 'OBJECT_RESIDUAL' | 'PROTECTED_VIOLATION';
}
