/**
 * Lumina Studio Pro - 3-Way Semantic Merge Engine & Conflict Detector
 * Performs deterministic property-level diffing between Base, Local, and Remote states.
 */

import {
  AdjustmentSettings,
  ToneCurves,
  HSLSettings,
  CropSettings,
  Project,
} from '../types/editor';
import {
  CloudProjectDocument,
  ProjectConflictReport,
  ConflictedPropertyDiff,
  AutoMergedPropertyDiff,
  ConflictResolutionChoice,
} from '../types/cloudSync';

export class ConflictResolver {
  /**
   * Generates a 3-way semantic diff between Base, Local, and Cloud states
   */
  public generateConflictReport(
    base: Project,
    local: Project,
    remote: CloudProjectDocument
  ): ProjectConflictReport {
    const conflicted: ConflictedPropertyDiff[] = [];
    const autoMerged: AutoMergedPropertyDiff[] = [];

    const baseSettings = base.currentSettings;
    const localSettings = local.currentSettings;
    const remoteSettings = remote.projectState.settings;

    // Diff Scalar Adjustment Settings
    for (const key of Object.keys(localSettings) as Array<keyof AdjustmentSettings>) {
      const bVal = baseSettings ? baseSettings[key] : undefined;
      const lVal = localSettings[key];
      const rVal = remoteSettings ? remoteSettings[key] : undefined;

      const localChanged = JSON.stringify(bVal) !== JSON.stringify(lVal);
      const remoteChanged = JSON.stringify(bVal) !== JSON.stringify(rVal);

      if (localChanged && remoteChanged) {
        if (JSON.stringify(lVal) !== JSON.stringify(rVal)) {
          conflicted.push({
            propertyPath: `currentSettings.${String(key)}`,
            propertyLabel: this.formatLabel(String(key)),
            baseValue: bVal,
            localValue: lVal,
            remoteValue: rVal,
          });
        }
      } else if (localChanged && !remoteChanged) {
        autoMerged.push({
          propertyPath: `currentSettings.${String(key)}`,
          propertyLabel: this.formatLabel(String(key)),
          mergedValue: lVal,
          source: 'LOCAL',
        });
      } else if (!localChanged && remoteChanged) {
        autoMerged.push({
          propertyPath: `currentSettings.${String(key)}`,
          propertyLabel: this.formatLabel(String(key)),
          mergedValue: rVal,
          source: 'REMOTE',
        });
      }
    }

    // Diff Tone Curves
    const baseCurves = JSON.stringify(base.toneCurves);
    const localCurves = JSON.stringify(local.toneCurves);
    const remoteCurves = JSON.stringify(remote.projectState.toneCurves);

    if (baseCurves !== localCurves && baseCurves !== remoteCurves) {
      if (localCurves !== remoteCurves) {
        conflicted.push({
          propertyPath: 'toneCurves',
          propertyLabel: 'Tone Curves',
          baseValue: base.toneCurves,
          localValue: local.toneCurves,
          remoteValue: remote.projectState.toneCurves,
        });
      }
    } else if (baseCurves !== localCurves) {
      autoMerged.push({
        propertyPath: 'toneCurves',
        propertyLabel: 'Tone Curves',
        mergedValue: local.toneCurves,
        source: 'LOCAL',
      });
    } else if (baseCurves !== remoteCurves) {
      autoMerged.push({
        propertyPath: 'toneCurves',
        propertyLabel: 'Tone Curves',
        mergedValue: remote.projectState.toneCurves,
        source: 'REMOTE',
      });
    }

    // Diff HSL
    const baseHsl = JSON.stringify(base.hsl);
    const localHsl = JSON.stringify(local.hsl);
    const remoteHsl = JSON.stringify(remote.projectState.hsl);

    if (baseHsl !== localHsl && baseHsl !== remoteHsl) {
      if (localHsl !== remoteHsl) {
        conflicted.push({
          propertyPath: 'hsl',
          propertyLabel: 'Color HSL Channels',
          baseValue: base.hsl,
          localValue: local.hsl,
          remoteValue: remote.projectState.hsl,
        });
      }
    } else if (baseHsl !== localHsl) {
      autoMerged.push({
        propertyPath: 'hsl',
        propertyLabel: 'Color HSL Channels',
        mergedValue: local.hsl,
        source: 'LOCAL',
      });
    } else if (baseHsl !== remoteHsl) {
      autoMerged.push({
        propertyPath: 'hsl',
        propertyLabel: 'Color HSL Channels',
        mergedValue: remote.projectState.hsl,
        source: 'REMOTE',
      });
    }

    return {
      projectId: local.id,
      projectName: local.name,
      localVersion: local.cloudRevision || 1,
      cloudVersion: remote.version || 1,
      conflictedProperties: conflicted,
      autoMergedProperties: autoMerged,
      baseProject: base,
      localProject: local,
      cloudDocument: remote,
    };
  }

  /**
   * Applies a selected conflict resolution strategy without data loss
   */
  public resolveConflict(
    local: Project,
    remote: CloudProjectDocument,
    report: ProjectConflictReport,
    choice: ConflictResolutionChoice,
    manualPicks?: Record<string, 'LOCAL' | 'REMOTE'>
  ): { resolvedProject: Project; forkAsNew?: boolean } {
    if (choice === 'KEEP_LOCAL') {
      return {
        resolvedProject: {
          ...local,
          cloudRevision: Math.max(local.cloudRevision || 1, remote.version || 1) + 1,
          cloudSyncStatus: 'synced',
          updatedAt: Date.now(),
        },
      };
    }

    if (choice === 'KEEP_CLOUD') {
      return {
        resolvedProject: {
          ...local,
          name: remote.name,
          currentSettings: { ...remote.projectState.settings },
          toneCurves: { ...remote.projectState.toneCurves },
          hsl: { ...remote.projectState.hsl },
          crop: { ...remote.projectState.crop },
          watermark: { ...remote.projectState.watermark },
          border: { ...remote.projectState.border },
          activePresetId: remote.projectState.activePresetId,
          presetStrength: remote.projectState.presetStrength,
          layers: [...(remote.projectState.layers || [])],
          masks: [...(remote.projectState.masks || [])],
          typography: [...(remote.projectState.typography || [])],
          designElements: [...(remote.projectState.designElements || [])],
          retouchStrokes: [...(remote.projectState.retouchStrokes || [])],
          cloudRevision: remote.version,
          cloudSyncStatus: 'synced',
          updatedAt: remote.updatedAt,
        },
      };
    }

    if (choice === 'CREATE_COPY') {
      const forkedId = `proj_fork_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      return {
        forkAsNew: true,
        resolvedProject: {
          ...local,
          id: forkedId,
          name: `${local.name} (Conflicted Copy)`,
          cloudRevision: 1,
          cloudSyncStatus: 'local-only',
          updatedAt: Date.now(),
        },
      };
    }

    // Default: SEMANTIC_MERGE
    const mergedSettings: AdjustmentSettings = {
      ...local.currentSettings,
    };

    // Apply auto-merged values
    for (const auto of report.autoMergedProperties) {
      if (auto.propertyPath.startsWith('currentSettings.')) {
        const prop = auto.propertyPath.split('.')[1] as keyof AdjustmentSettings;
        (mergedSettings as any)[prop] = auto.mergedValue;
      }
    }

    // Apply manual picks for conflicted values
    for (const conf of report.conflictedProperties) {
      const pick = manualPicks?.[conf.propertyPath] || 'LOCAL';
      if (conf.propertyPath.startsWith('currentSettings.')) {
        const prop = conf.propertyPath.split('.')[1] as keyof AdjustmentSettings;
        (mergedSettings as any)[prop] = pick === 'LOCAL' ? conf.localValue : conf.remoteValue;
      }
    }

    const mergedToneCurves: ToneCurves =
      manualPicks?.['toneCurves'] === 'REMOTE'
        ? remote.projectState.toneCurves
        : local.toneCurves;

    const mergedHsl: HSLSettings =
      manualPicks?.['hsl'] === 'REMOTE'
        ? remote.projectState.hsl
        : local.hsl;

    return {
      resolvedProject: {
        ...local,
        currentSettings: mergedSettings,
        toneCurves: mergedToneCurves,
        hsl: mergedHsl,
        cloudRevision: Math.max(local.cloudRevision || 1, remote.version || 1) + 1,
        cloudSyncStatus: 'synced',
        updatedAt: Date.now(),
      },
    };
  }

  private formatLabel(key: string): string {
    return key
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, (str) => str.toUpperCase());
  }
}

export const conflictResolver = new ConflictResolver();
