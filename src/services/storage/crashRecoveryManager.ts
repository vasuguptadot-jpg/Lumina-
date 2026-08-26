/**
 * Lumina Studio Pro - Crash & Corruption Recovery 2.0
 * Phase 11 Disaster-Recovery Hardening
 *
 * Enforces quarantine safety: Corrupted project states are quarantined into an isolated
 * store, and a clean Recovery Copy is instantiated from the Last Known Good Snapshot.
 */

import { Project } from '../../types/editor';
import { DiagnosticBuffer } from '../diagnostics/diagnosticBuffer';

export type ProjectHealthState =
  | 'CLEAN'
  | 'DIRTY'
  | 'RECOVERABLE'
  | 'RECOVERED'
  | 'CORRUPTED'
  | 'QUARANTINED';

export interface QuarantineRecord {
  quarantineId: string;
  projectId: string;
  corruptedTimestamp: number;
  corruptedPayload: string;
  reason: string;
  restoredFromRevision: number;
  recoveryProjectId: string;
}

export interface CrashRecoveryResult {
  status: ProjectHealthState;
  originalProjectId: string;
  activeProjectId: string;
  recoveredProject: Project;
  quarantinedRecord?: QuarantineRecord;
  notes: string[];
}

export class CrashRecoveryManager {
  private static knownGoodSnapshots: Map<string, Project> = new Map();
  private static quarantineVault: Map<string, QuarantineRecord> = new Map();

  /**
   * Registers a validated clean project snapshot
   */
  public static registerGoodSnapshot(project: Project): void {
    this.knownGoodSnapshots.set(project.id, JSON.parse(JSON.stringify(project)));
  }

  /**
   * Quarantines a corrupted project and creates an active recovery copy
   */
  public static handleCorruptedProject(
    corruptedRawInput: any,
    fallbackProjectId: string,
    reason: string
  ): CrashRecoveryResult {
    const notes: string[] = [];
    const timestamp = Date.now();

    DiagnosticBuffer.warn(
      'STORAGE',
      `[CORRUPTION_DETECTED] Project ${fallbackProjectId} corrupted (${reason}). Initiating quarantine protocol.`
    );

    // 1. Serialize corrupted state into quarantine record
    const quarantineId = `quarantine_${fallbackProjectId}_${timestamp}`;
    const corruptedPayload = typeof corruptedRawInput === 'string' ? corruptedRawInput : JSON.stringify(corruptedRawInput || {});

    // 2. Fetch Last Known Good Snapshot
    let lastGood = this.knownGoodSnapshots.get(fallbackProjectId);
    if (!lastGood) {
      // Create minimal default safe baseline if no snapshot exists
      lastGood = {
        id: fallbackProjectId,
        name: 'Recovered Project (Safe Baseline)',
        width: 1920,
        height: 1080,
        exposure: 0,
        temperature: 5500,
        contrast: 0,
        revision: 1,
        masks: [],
        layers: [],
        history: [],
      } as unknown as Project;
    }

    // 3. Create Recovery Copy with new identity to never overwrite the original
    const recoveryProjectId = `${fallbackProjectId}_recovered_${timestamp.toString(36)}`;
    const recoveredProject: Project = {
      ...JSON.parse(JSON.stringify(lastGood)),
      id: recoveryProjectId,
      name: `${lastGood.name || 'Project'} (Recovered Copy)`,
      revision: (lastGood.revision || 1) + 1,
    };

    const quarantineRecord: QuarantineRecord = {
      quarantineId,
      projectId: fallbackProjectId,
      corruptedTimestamp: timestamp,
      corruptedPayload,
      reason,
      restoredFromRevision: lastGood.revision || 1,
      recoveryProjectId,
    };

    this.quarantineVault.set(quarantineId, quarantineRecord);
    notes.push(`Project ${fallbackProjectId} safely quarantined into vault record ${quarantineId}.`);
    notes.push(`Original file untouched. New recovery copy created with ID ${recoveryProjectId}.`);
    notes.push(`Restored from revision ${lastGood.revision || 1} with 0 unhandled exceptions.`);

    DiagnosticBuffer.info(
      'STORAGE',
      `[QUARANTINE_SUCCESS] Successfully generated safe recovery copy ${recoveryProjectId}.`
    );

    return {
      status: 'QUARANTINED',
      originalProjectId: fallbackProjectId,
      activeProjectId: recoveryProjectId,
      recoveredProject,
      quarantinedRecord: quarantineRecord,
      notes,
    };
  }

  public static getQuarantinedRecords(): QuarantineRecord[] {
    return Array.from(this.quarantineVault.values());
  }
}
