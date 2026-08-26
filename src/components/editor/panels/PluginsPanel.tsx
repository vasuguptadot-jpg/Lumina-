import React, { useState, useEffect } from 'react';
import {
  Package,
  Sparkles,
  Zap,
  Film,
  SunMedium,
  Paintbrush,
  Type,
  Layout,
  Code,
  ExternalLink,
  Plus,
  Play,
  Sliders,
  CheckCircle2,
  Compass,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';
import { LuminaPlugin, PluginCategory } from '../../../types/plugin';
import { Project } from '../../../types/editor';
import { User } from 'firebase/auth';
import {
  loadAllPlugins,
  togglePluginStatus,
  updatePluginParams,
} from '../../../services/pluginService';
import { executeScriptPlugin } from '../../../engine/pluginEngine';

interface PluginsPanelProps {
  project: Project;
  currentUser: User | null;
  onOpenPluginModal: () => void;
  onOpenUnsplashModal: () => void;
  onApplyProjectSettings: (settings: Record<string, any>) => void;
  showToast: (type: 'success' | 'error' | 'info', title: string, msg?: string) => void;
}

export const PluginsPanel: React.FC<PluginsPanelProps> = ({
  project,
  currentUser,
  onOpenPluginModal,
  onOpenUnsplashModal,
  onApplyProjectSettings,
  showToast,
}) => {
  const [plugins, setPlugins] = useState<LuminaPlugin[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedPluginId, setExpandedPluginId] = useState<string | null>(null);

  useEffect(() => {
    loadPlugins();
  }, []);

  const loadPlugins = async () => {
    const list = await loadAllPlugins();
    setPlugins(list);
  };

  const handleToggle = (plugin: LuminaPlugin) => {
    const next = !plugin.isEnabled;
    togglePluginStatus(plugin.id, next);
    setPlugins((prev) =>
      prev.map((p) => (p.id === plugin.id ? { ...p, isEnabled: next } : p))
    );
    showToast(
      'info',
      next ? 'Plugin Activated' : 'Plugin Deactivated',
      `"${plugin.name}" is now ${next ? 'enabled' : 'disabled'}.`
    );
  };

  const handleUpdateParam = (pluginId: string, paramId: string, value: any) => {
    const updated = { [paramId]: value };
    updatePluginParams(pluginId, updated);
    setPlugins((prev) =>
      prev.map((p) => {
        if (p.id === pluginId) {
          return {
            ...p,
            currentParams: { ...p.currentParams, ...updated },
          };
        }
        return p;
      })
    );
  };

  const handleRunScript = (plugin: LuminaPlugin) => {
    const res = executeScriptPlugin(plugin, project);
    if (res.modifiedSettings) {
      onApplyProjectSettings(res.modifiedSettings);
    }
    showToast(
      res.success ? 'success' : 'error',
      res.success ? 'Script Executed' : 'Script Failed',
      res.message
    );
  };

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'filter', label: 'Filters' },
    { id: 'lut', label: '3D LUTs' },
    { id: 'ai-model', label: 'AI Models' },
    { id: 'brush', label: 'Brushes' },
    { id: 'script', label: 'Scripts' },
    { id: 'template', label: 'Templates' },
    { id: 'integration', label: 'Integrations' },
  ];

  const filteredPlugins = plugins.filter(
    (p) => selectedCategory === 'all' || p.category === selectedCategory
  );

  return (
    <div className="p-4 space-y-4 text-xs text-slate-200">
      {/* Overview Banner & Quick Platform Access */}
      <div className="bg-gradient-to-br from-indigo-950/80 to-purple-950/80 border border-indigo-500/30 rounded-2xl p-3.5 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-indigo-400" />
            <span className="font-bold text-white uppercase tracking-wider text-[11px]">
              Plugin Studio
            </span>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono font-bold text-[10px]">
            {plugins.filter((p) => p.isEnabled).length} ACTIVE
          </span>
        </div>
        <p className="text-slate-400 text-[11px] leading-relaxed">
          Extend Lumina with custom shaders, 3D LUT profiles, AI models, brushes, templates, and batch macros.
        </p>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            onClick={onOpenPluginModal}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-xs shadow-md shadow-indigo-500/20 transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Marketplace & IDE</span>
          </button>

          <button
            onClick={onOpenUnsplashModal}
            className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-sky-400 font-bold text-xs transition-colors"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Unsplash Stock</span>
          </button>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedCategory(c.id)}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-bold whitespace-nowrap transition-colors ${
              selectedCategory === c.id
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Plugins List */}
      <div className="space-y-2.5">
        {filteredPlugins.map((plugin) => {
          const isExpanded = expandedPluginId === plugin.id;
          return (
            <div
              key={plugin.id}
              className={`rounded-2xl border transition-all ${
                plugin.isEnabled
                  ? 'bg-slate-900/90 border-indigo-500/40 shadow-sm'
                  : 'bg-slate-950/60 border-slate-800/80 opacity-75'
              }`}
            >
              <div className="p-3 flex items-start justify-between gap-2">
                <div className="flex items-start gap-2.5 min-w-0">
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs shrink-0 mt-0.5 ${
                      plugin.isEnabled
                        ? 'bg-indigo-950 text-indigo-400 border border-indigo-500/40'
                        : 'bg-slate-900 text-slate-500 border border-slate-800'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-bold text-white text-xs truncate">{plugin.name}</h4>
                    </div>
                    <span className="text-[10px] text-slate-400 block font-mono">
                      {plugin.category.toUpperCase()} • v{plugin.version}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {plugin.parameters && plugin.parameters.length > 0 && (
                    <button
                      onClick={() => setExpandedPluginId(isExpanded ? null : plugin.id)}
                      className={`p-1.5 rounded-xl border transition-colors ${
                        isExpanded
                          ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                      title="Adjust Parameters"
                    >
                      <Sliders className="w-3.5 h-3.5" />
                    </button>
                  )}

                  {plugin.category === 'script' && (
                    <button
                      onClick={() => handleRunScript(plugin)}
                      className="px-2 py-1 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-[11px] flex items-center gap-1 shadow-md shadow-purple-600/20"
                    >
                      <Play className="w-3 h-3 fill-white" />
                      <span>Run</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleToggle(plugin)}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all ${
                      plugin.isEnabled
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {plugin.isEnabled ? 'ON' : 'OFF'}
                  </button>
                </div>
              </div>

              {/* Collapsible Parameter Controls */}
              {isExpanded && plugin.parameters && plugin.parameters.length > 0 && (
                <div className="px-3 pb-3 pt-1 border-t border-slate-800/80 space-y-2.5 bg-slate-950/40 rounded-b-2xl">
                  {plugin.parameters.map((param) => {
                    const val = plugin.currentParams[param.id] ?? param.defaultValue;
                    return (
                      <div key={param.id} className="space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">{param.label}</span>
                          <span className="font-mono text-slate-300 text-[10px]">
                            {String(val)} {param.unit || ''}
                          </span>
                        </div>

                        {param.type === 'slider' && (
                          <input
                            type="range"
                            min={param.min ?? 0}
                            max={param.max ?? 100}
                            step={param.step ?? 1}
                            value={val}
                            onChange={(e) =>
                              handleUpdateParam(plugin.id, param.id, parseFloat(e.target.value))
                            }
                            className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                          />
                        )}

                        {param.type === 'color' && (
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={val}
                              onChange={(e) =>
                                handleUpdateParam(plugin.id, param.id, e.target.value)
                              }
                              className="w-6 h-6 rounded-md cursor-pointer bg-transparent border-0"
                            />
                            <span className="font-mono text-[10px] text-slate-300 uppercase">
                              {val}
                            </span>
                          </div>
                        )}

                        {param.type === 'toggle' && (
                          <button
                            onClick={() => handleUpdateParam(plugin.id, param.id, !val)}
                            className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold ${
                              val ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {val ? 'Active' : 'Disabled'}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
