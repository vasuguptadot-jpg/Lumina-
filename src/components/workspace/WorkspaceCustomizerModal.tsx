import React, { useState } from 'react';
import {
  X,
  Layout,
  Layers,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  RotateCcw,
  Save,
  CheckCircle2,
  Sliders,
  Sparkles,
  Command,
  Monitor,
  Columns,
  Grid,
  Zap,
  Check,
} from 'lucide-react';
import {
  WorkspaceConfig,
  WorkspacePresetId,
  WorkflowStageId,
  CustomWorkspacePreset,
} from '../../types/workflow';
import {
  WORKFLOW_STAGES,
  WORKSPACE_PRESETS,
  ALL_STAGES_ORDER,
  DEFAULT_WORKSPACE_CONFIG,
  saveWorkspaceConfig,
} from '../../engine/workspaceEngine';

interface WorkspaceCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: WorkspaceConfig;
  onUpdateConfig: (newConfig: WorkspaceConfig) => void;
  showToast: (type: 'success' | 'error' | 'info', title: string, msg?: string) => void;
}

export const WorkspaceCustomizerModal: React.FC<WorkspaceCustomizerModalProps> = ({
  isOpen,
  onClose,
  config,
  onUpdateConfig,
  showToast,
}) => {
  const [localConfig, setLocalConfig] = useState<WorkspaceConfig>(config);
  const [customPresetName, setCustomPresetName] = useState('');
  const [isSavingPreset, setIsSavingPreset] = useState(false);

  if (!isOpen) return null;

  const handleSelectPreset = (presetId: WorkspacePresetId) => {
    const preset = WORKSPACE_PRESETS[presetId];
    if (!preset) return;

    const updated: WorkspaceConfig = {
      ...localConfig,
      activePresetId: presetId,
      visibleStages: [...preset.stages],
      stageOrder: [...preset.stages],
      activeStage: preset.stages[0] || 'develop',
    };

    setLocalConfig(updated);
    onUpdateConfig(updated);
    saveWorkspaceConfig(updated);
    showToast('success', 'Workspace Preset Loaded', `Switched to "${preset.name}"`);
  };

  const handleToggleStageVisibility = (stageId: WorkflowStageId) => {
    let updatedVisible = [...localConfig.visibleStages];
    if (updatedVisible.includes(stageId)) {
      if (updatedVisible.length <= 1) {
        showToast('error', 'Action Restricted', 'At least one workflow stage must remain visible.');
        return;
      }
      updatedVisible = updatedVisible.filter((id) => id !== stageId);
    } else {
      updatedVisible.push(stageId);
    }

    const updated: WorkspaceConfig = {
      ...localConfig,
      visibleStages: updatedVisible,
      activePresetId: 'custom',
    };

    setLocalConfig(updated);
    onUpdateConfig(updated);
    saveWorkspaceConfig(updated);
  };

  const handleMoveStage = (index: number, direction: 'up' | 'down') => {
    const newOrder = [...localConfig.stageOrder];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= newOrder.length) return;

    const temp = newOrder[index];
    newOrder[index] = newOrder[targetIndex];
    newOrder[targetIndex] = temp;

    const updated: WorkspaceConfig = {
      ...localConfig,
      stageOrder: newOrder,
      activePresetId: 'custom',
    };

    setLocalConfig(updated);
    onUpdateConfig(updated);
    saveWorkspaceConfig(updated);
  };

  const handleResetToDefaults = () => {
    const reset = { ...DEFAULT_WORKSPACE_CONFIG };
    setLocalConfig(reset);
    onUpdateConfig(reset);
    saveWorkspaceConfig(reset);
    showToast('info', 'Workspace Reset', 'Restored 9-Stage Master Suite defaults.');
  };

  const handleSaveCustomPreset = () => {
    if (!customPresetName.trim()) {
      showToast('error', 'Missing Name', 'Please enter a name for your custom workspace layout.');
      return;
    }

    const newPreset: CustomWorkspacePreset = {
      id: `custom_${Date.now()}`,
      name: customPresetName.trim(),
      description: `Custom layout with ${localConfig.visibleStages.length} active stages`,
      visibleStages: [...localConfig.visibleStages],
      stageOrder: [...localConfig.stageOrder],
      createdAt: Date.now(),
    };

    const updated: WorkspaceConfig = {
      ...localConfig,
      activePresetId: 'custom',
      customPresets: [...localConfig.customPresets, newPreset],
    };

    setLocalConfig(updated);
    onUpdateConfig(updated);
    saveWorkspaceConfig(updated);
    setCustomPresetName('');
    setIsSavingPreset(false);
    showToast('success', 'Custom Workspace Saved', `Preset "${newPreset.name}" is now stored.`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xl flex items-center justify-center p-4 select-none animate-fadeIn">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="h-16 px-6 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-amber-400 p-[1.5px]">
              <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
                <Layout className="w-5 h-5 text-amber-400" />
              </div>
            </div>
            <div>
              <h2 className="text-base font-black text-white">Customize Workspace & Workflow</h2>
              <p className="text-xs text-slate-400">
                Configure your editing sequence: Library → Develop → Select → Mask → Retouch → Layers → AI → Design → Export
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleResetToDefaults}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 1. Quick Workspace Presets */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Standard Professional Workspace Presets</span>
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {(Object.keys(WORKSPACE_PRESETS) as WorkspacePresetId[]).map((pId) => {
                const preset = WORKSPACE_PRESETS[pId];
                const isSelected = localConfig.activePresetId === pId;

                return (
                  <button
                    key={pId}
                    onClick={() => handleSelectPreset(pId)}
                    className={`p-4 rounded-2xl border text-left space-y-2 transition-all ${
                      isSelected
                        ? 'bg-slate-950 border-amber-500 ring-2 ring-amber-500/30'
                        : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{preset.name}</span>
                      {isSelected && (
                        <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center">
                          <Check className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">
                      {preset.description}
                    </p>
                    <div className="flex items-center gap-1 pt-1 overflow-x-auto scrollbar-none">
                      {preset.stages.map((stg) => (
                        <span
                          key={stg}
                          className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 uppercase"
                        >
                          {WORKFLOW_STAGES[stg]?.shortLabel || stg}
                        </span>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Stage Order & Visibility Configurator */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-indigo-400" />
              <span>Pipeline Stages Order & Active Visibility</span>
            </h3>

            <div className="bg-slate-950 rounded-2xl border border-slate-800 divide-y divide-slate-900">
              {localConfig.stageOrder.map((stageId, idx) => {
                const stage = WORKFLOW_STAGES[stageId];
                if (!stage) return null;
                const isVisible = localConfig.visibleStages.includes(stageId);

                return (
                  <div
                    key={stageId}
                    className="p-3 px-4 flex items-center justify-between hover:bg-slate-900/40 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      {/* Step Number Badge */}
                      <span className="w-6 h-6 rounded-lg bg-slate-900 border border-slate-800 text-xs font-mono font-bold text-slate-400 flex items-center justify-center">
                        {idx + 1}
                      </span>

                      {/* Visibility Toggle Button */}
                      <button
                        onClick={() => handleToggleStageVisibility(stageId)}
                        className={`p-1.5 rounded-lg border transition-colors ${
                          isVisible
                            ? 'bg-emerald-950/80 border-emerald-500/40 text-emerald-400'
                            : 'bg-slate-900 border-slate-800 text-slate-600 hover:text-slate-400'
                        }`}
                        title={isVisible ? 'Hide from stage bar' : 'Show in stage bar'}
                      >
                        {isVisible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                      </button>

                      {/* Stage Name & Details */}
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold ${isVisible ? 'text-white' : 'text-slate-500'}`}>
                            {stage.name}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500 font-bold">
                            (Key: {stage.shortcut})
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">{stage.description}</p>
                      </div>
                    </div>

                    {/* Move Up / Down Reorder Buttons */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleMoveStage(idx, 'up')}
                        disabled={idx === 0}
                        className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-slate-900 text-slate-300 border border-slate-800 transition-colors"
                        title="Move Earlier in Workflow"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleMoveStage(idx, 'down')}
                        disabled={idx === localConfig.stageOrder.length - 1}
                        className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-30 disabled:hover:bg-slate-900 text-slate-300 border border-slate-800 transition-colors"
                        title="Move Later in Workflow"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 3. Panel & Dock Layout Preferences */}
          <div className="space-y-3 pt-2">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Columns className="w-3.5 h-3.5 text-cyan-400" />
              <span>Workspace UI & Panel Layout Preferences</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-center justify-between p-4 bg-slate-950 rounded-2xl border border-slate-800 cursor-pointer">
                <div>
                  <div className="text-xs font-bold text-white">Dedicated Keyboard Shortcuts (1-9)</div>
                  <div className="text-[11px] text-slate-400">Keys 1 through 9 jump directly to workflow stages.</div>
                </div>
                <input
                  type="checkbox"
                  checked={localConfig.keyboardShortcutsEnabled}
                  onChange={(e) => {
                    const upd = { ...localConfig, keyboardShortcutsEnabled: e.target.checked };
                    setLocalConfig(upd);
                    onUpdateConfig(upd);
                    saveWorkspaceConfig(upd);
                  }}
                  className="w-5 h-5 accent-indigo-500 cursor-pointer"
                />
              </label>

              <label className="flex items-center justify-between p-4 bg-slate-950 rounded-2xl border border-slate-800 cursor-pointer">
                <div>
                  <div className="text-xs font-bold text-white">Compact Stage Header Bar</div>
                  <div className="text-[11px] text-slate-400">Slimmer top bar for maximum canvas vertical space.</div>
                </div>
                <input
                  type="checkbox"
                  checked={localConfig.compactStageBar}
                  onChange={(e) => {
                    const upd = { ...localConfig, compactStageBar: e.target.checked };
                    setLocalConfig(upd);
                    onUpdateConfig(upd);
                    saveWorkspaceConfig(upd);
                  }}
                  className="w-5 h-5 accent-indigo-500 cursor-pointer"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="h-16 px-6 bg-slate-950 border-t border-slate-800 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-400">
            Current sequence: <span className="text-amber-400 font-bold">{localConfig.visibleStages.length}</span> of 9 stages enabled
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/30"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};
