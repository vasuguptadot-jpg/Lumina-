import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Package,
  Sparkles,
  Zap,
  Film,
  SunMedium,
  Paintbrush,
  Compass,
  Type,
  Layout,
  Code,
  ExternalLink,
  Plus,
  Play,
  Upload,
  Download,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Search,
  Sliders,
  Terminal,
  Layers,
  Copy,
  FolderDown,
  Star,
  Check,
} from 'lucide-react';
import { LuminaPlugin, PluginCategory, PluginParameter } from '../../types/plugin';
import { Project } from '../../types/editor';
import { User } from 'firebase/auth';
import {
  loadAllPlugins,
  savePlugin,
  removePlugin,
  togglePluginStatus,
  updatePluginParams,
  exportPluginPackage,
  importPluginPackage,
} from '../../services/pluginService';
import {
  applyFilterPluginToCanvas,
  executeScriptPlugin,
} from '../../engine/pluginEngine';

interface PluginPlatformModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  currentUser: User | null;
  onApplyProjectSettings?: (settings: Record<string, any>) => void;
  onOpenUnsplashModal?: () => void;
  showToast: (type: 'success' | 'error' | 'info', title: string, msg?: string) => void;
}

export const PluginPlatformModal: React.FC<PluginPlatformModalProps> = ({
  isOpen,
  onClose,
  project,
  currentUser,
  onApplyProjectSettings,
  onOpenUnsplashModal,
  showToast,
}) => {
  const [plugins, setPlugins] = useState<LuminaPlugin[]>([]);
  const [activeTab, setActiveTab] = useState<'marketplace' | 'installed' | 'ide' | 'integrations'>('marketplace');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlugin, setSelectedPlugin] = useState<LuminaPlugin | null>(null);

  // Developer IDE Sandbox State
  const [ideName, setIdeName] = useState('My Custom Pixel Shader');
  const [ideCategory, setIdeCategory] = useState<PluginCategory>('filter');
  const [ideDescription, setIdeDescription] = useState('Custom procedural image transformation.');
  const [ideAuthor, setIdeAuthor] = useState(currentUser?.displayName || 'Creator');
  const [ideCode, setIdeCode] = useState(`// Custom Filter Sandbox
// Arguments: ctx, width, height, params, originalImageData, console
(function(ctx, width, height, params, originalImageData, console) {
  const imgData = ctx.getImageData(0, 0, width, height);
  const data = imgData.data;
  const orig = originalImageData.data;
  const factor = (params.intensity || 50) / 100;

  for (let i = 0; i < data.length; i += 4) {
    // Invert Red channel and boost Blue
    data[i] = orig[i] * (1 - factor) + (255 - orig[i]) * factor;
    data[i + 1] = orig[i + 1];
    data[i + 2] = Math.min(255, orig[i + 2] + factor * 50);
  }
  ctx.putImageData(imgData, 0, 0);
  console.log('Custom filter executed successfully!');
})`);
  const [ideParams, setIdeParams] = useState<PluginParameter[]>([
    { id: 'intensity', label: 'Transform Intensity', type: 'slider', defaultValue: 50, min: 0, max: 100, step: 1, unit: '%' },
  ]);
  const [ideConsoleLogs, setIdeConsoleLogs] = useState<string[]>([]);
  const [ideRunning, setIdeRunning] = useState(false);
  const sandboxCanvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      refreshPlugins();
    }
  }, [isOpen]);

  const refreshPlugins = async () => {
    const list = await loadAllPlugins();
    setPlugins(list);
    if (!selectedPlugin && list.length > 0) {
      setSelectedPlugin(list[0]);
    }
  };

  if (!isOpen) return null;

  const categoryTabs: { id: string; label: string; icon: any }[] = [
    { id: 'all', label: 'All Extensions', icon: Package },
    { id: 'filter', label: 'Pixel Filters', icon: Zap },
    { id: 'lut', label: '3D LUTs', icon: Film },
    { id: 'ai-model', label: 'AI Vision', icon: SunMedium },
    { id: 'brush', label: 'Brushes', icon: Paintbrush },
    { id: 'preset', label: 'Presets', icon: Sparkles },
    { id: 'font', label: 'Fonts', icon: Type },
    { id: 'template', label: 'Templates', icon: Layout },
    { id: 'script', label: 'Scripts / Macros', icon: Code },
    { id: 'integration', label: 'Integrations', icon: ExternalLink },
  ];

  const filteredPlugins = plugins.filter((p) => {
    const matchCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchSearch =
      !searchQuery.trim() ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchCategory && matchSearch;
  });

  const installedCount = plugins.filter((p) => p.isInstalled && p.isEnabled).length;

  const handleTogglePlugin = (plugin: LuminaPlugin) => {
    const nextState = !plugin.isEnabled;
    togglePluginStatus(plugin.id, nextState);
    setPlugins((prev) =>
      prev.map((p) => (p.id === plugin.id ? { ...p, isEnabled: nextState } : p))
    );
    showToast(
      'info',
      nextState ? 'Extension Enabled' : 'Extension Disabled',
      `"${plugin.name}" is now ${nextState ? 'active' : 'inactive'}.`
    );
  };

  const handleUpdateParam = (pluginId: string, paramId: string, value: any) => {
    const target = plugins.find((p) => p.id === pluginId);
    if (!target) return;
    const updatedParams = { ...target.currentParams, [paramId]: value };
    updatePluginParams(pluginId, { [paramId]: value });
    setPlugins((prev) =>
      prev.map((p) => (p.id === pluginId ? { ...p, currentParams: updatedParams } : p))
    );
    if (selectedPlugin && selectedPlugin.id === pluginId) {
      setSelectedPlugin({ ...selectedPlugin, currentParams: updatedParams });
    }
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        const imported = await importPluginPackage(text);
        showToast('success', 'Plugin Imported', `Installed "${imported.name}" v${imported.version}`);
        refreshPlugins();
      } catch (err: any) {
        showToast('error', 'Import Failed', err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleExportPlugin = (plugin: LuminaPlugin) => {
    exportPluginPackage(plugin);
    showToast('info', 'Package Exported', `Saved ${plugin.name}.lumina-plugin.json`);
  };

  const handleDeletePlugin = async (plugin: LuminaPlugin) => {
    if (plugin.isBuiltin) {
      showToast('error', 'Cannot Delete', 'Built-in core plugins cannot be deleted.');
      return;
    }
    await removePlugin(plugin.id);
    showToast('info', 'Plugin Removed', `Uninstalled "${plugin.name}"`);
    refreshPlugins();
  };

  // Run Sandbox IDE Test
  const handleRunSandbox = () => {
    setIdeRunning(true);
    setIdeConsoleLogs([]);
    const canvas = sandboxCanvasRef.current;
    if (!canvas) {
      setIdeRunning(false);
      return;
    }

    try {
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Draw baseline pattern / test gradient
      ctx.fillStyle = '#1e293b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      grad.addColorStop(0, '#f43f5e');
      grad.addColorStop(0.5, '#3b82f6');
      grad.addColorStop(1, '#10b981');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height / 2, canvas.width * 0.35, 0, Math.PI * 2);
      ctx.fill();

      const originalImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);

      const paramsMap: Record<string, any> = {};
      ideParams.forEach((p) => {
        paramsMap[p.id] = p.defaultValue;
      });

      const tempPlugin: LuminaPlugin = {
        id: 'sandbox-test',
        name: ideName,
        category: ideCategory,
        version: '1.0.0',
        author: ideAuthor,
        description: ideDescription,
        iconName: 'Code',
        tags: ['custom'],
        isBuiltin: false,
        isInstalled: true,
        isEnabled: true,
        rating: 5.0,
        downloadsCount: 1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        parameters: ideParams,
        currentParams: paramsMap,
        code: ideCode,
      };

      if (ideCategory === 'filter') {
        const res = applyFilterPluginToCanvas(ctx, canvas.width, canvas.height, tempPlugin, originalImageData);
        setIdeConsoleLogs(res.logs || [res.message || 'Complete']);
      } else if (ideCategory === 'script') {
        const res = executeScriptPlugin(tempPlugin, project);
        setIdeConsoleLogs(res.logs || [res.message || 'Script finished']);
        if (res.modifiedSettings && onApplyProjectSettings) {
          onApplyProjectSettings(res.modifiedSettings);
        }
      }
      showToast('success', 'Sandbox Execution Passed', 'Code ran without errors.');
    } catch (err: any) {
      setIdeConsoleLogs((prev) => [...prev, `Sandbox Runtime Error: ${err.message}`]);
      showToast('error', 'Execution Error', err.message);
    } finally {
      setIdeRunning(false);
    }
  };

  const handleSaveIdePlugin = async () => {
    if (!ideName.trim()) {
      showToast('error', 'Validation Error', 'Plugin name is required.');
      return;
    }
    const paramsMap: Record<string, any> = {};
    ideParams.forEach((p) => {
      paramsMap[p.id] = p.defaultValue;
    });

    const newPlugin: LuminaPlugin = {
      id: `plugin-${ideName.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${Date.now().toString(36)}`,
      name: ideName.trim(),
      category: ideCategory,
      version: '1.0.0',
      author: ideAuthor.trim() || 'Community Creator',
      authorId: currentUser?.uid || '',
      authorEmail: currentUser?.email || '',
      description: ideDescription.trim(),
      iconName: ideCategory === 'filter' ? 'Zap' : ideCategory === 'script' ? 'Code' : 'Package',
      tags: [ideCategory, 'custom', 'developer'],
      isBuiltin: false,
      isInstalled: true,
      isEnabled: true,
      rating: 5.0,
      downloadsCount: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      parameters: ideParams,
      currentParams: paramsMap,
      code: ideCode,
    };

    await savePlugin(newPlugin);
    showToast('success', 'Plugin Saved & Registered', `"${newPlugin.name}" is now ready to use!`);
    await refreshPlugins();
    setActiveTab('installed');
    setSelectedPlugin(newPlugin);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-6xl h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/25">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black text-white tracking-wide">
                  Lumina Plugin & Extension Studio
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-mono text-[10px] uppercase font-bold border border-indigo-500/30">
                  DEVELOPER PLATFORM
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Custom WebGL Shaders, 3D LUTs, Vision Models, Brushes, Presets, Fonts, Templates & Macros.
              </p>
            </div>
          </div>

          {/* Navigation Mode Tabs */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-950 p-1 rounded-2xl border border-slate-800">
              <button
                onClick={() => setActiveTab('marketplace')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'marketplace'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Marketplace ({plugins.length})
              </button>
              <button
                onClick={() => setActiveTab('installed')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'installed'
                    ? 'bg-indigo-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Active ({installedCount})
              </button>
              <button
                onClick={() => setActiveTab('ide')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'ide'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Code className="w-3.5 h-3.5" />
                <span>Plugin IDE</span>
              </button>
            </div>

            {/* Import Package Button */}
            <label className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs cursor-pointer border border-slate-700 transition-colors">
              <Upload className="w-3.5 h-3.5" />
              <span>Import</span>
              <input
                type="file"
                accept=".json,.lumina-plugin"
                onChange={handleImportFile}
                className="hidden"
              />
            </label>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        {activeTab === 'marketplace' || activeTab === 'installed' ? (
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Left Sidebar: Categories & Search */}
            <div className="w-full md:w-64 border-r border-slate-800 p-4 space-y-4 bg-slate-950/30 overflow-y-auto shrink-0">
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search extensions..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 outline-none focus:border-indigo-500"
                />
              </div>

              {/* Categories list */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 px-2 block">
                  Categories
                </span>
                {categoryTabs.map((cat) => {
                  const Icon = cat.icon;
                  const count =
                    cat.id === 'all'
                      ? plugins.length
                      : plugins.filter((p) => p.category === cat.id).length;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`w-full flex items-center justify-between px-2.5 py-2 rounded-xl text-xs font-bold transition-colors ${
                        selectedCategory === cat.id
                          ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        <span>{cat.label}</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-500 px-1.5 py-0.5 rounded bg-slate-950">
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Middle Grid: Plugin Cards */}
            <div className="flex-1 p-5 overflow-y-auto border-r border-slate-800">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {filteredPlugins.map((plugin) => {
                  const isSelected = selectedPlugin?.id === plugin.id;
                  return (
                    <div
                      key={plugin.id}
                      onClick={() => setSelectedPlugin(plugin)}
                      className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'bg-slate-800/80 border-indigo-500 shadow-lg shadow-indigo-500/10'
                          : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-xl bg-indigo-950 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0">
                              <Sparkles className="w-4 h-4" />
                            </div>
                            <div>
                              <h3 className="text-xs font-black text-white">{plugin.name}</h3>
                              <span className="text-[10px] text-slate-400 font-mono">
                                v{plugin.version} by {plugin.author}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTogglePlugin(plugin);
                              }}
                              className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all ${
                                plugin.isEnabled
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                                  : 'bg-slate-800 text-slate-400 hover:text-white'
                              }`}
                            >
                              {plugin.isEnabled ? 'Active' : 'Enable'}
                            </button>
                          </div>
                        </div>

                        <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed">
                          {plugin.description}
                        </p>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-1">
                          {plugin.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 font-mono text-[9px]"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Card Footer stats */}
                      <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                        <div className="flex items-center gap-1 text-amber-400">
                          <Star className="w-3 h-3 fill-amber-400" />
                          <span className="font-bold">{plugin.rating}</span>
                          <span className="text-slate-500">({plugin.downloadsCount})</span>
                        </div>

                        {plugin.id === 'integration-unsplash' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onOpenUnsplashModal) onOpenUnsplashModal();
                            }}
                            className="px-2 py-0.5 rounded bg-sky-500/20 text-sky-300 text-[10px] font-bold hover:bg-sky-500/30"
                          >
                            Open Library →
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Pane: Selected Plugin Inspector & Live Parameter Adjuster */}
            {selectedPlugin && (
              <div className="w-full md:w-80 p-5 bg-slate-950/50 overflow-y-auto space-y-5 shrink-0">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 font-mono font-bold text-[10px] uppercase border border-indigo-500/30">
                      {selectedPlugin.category}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleExportPlugin(selectedPlugin)}
                        className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300"
                        title="Export as .lumina-plugin package"
                      >
                        <FolderDown className="w-3.5 h-3.5" />
                      </button>
                      {!selectedPlugin.isBuiltin && (
                        <button
                          onClick={() => handleDeletePlugin(selectedPlugin)}
                          className="p-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-400"
                          title="Delete extension"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <h3 className="text-sm font-black text-white">{selectedPlugin.name}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {selectedPlugin.description}
                  </p>
                </div>

                {/* Parameters configuration */}
                {selectedPlugin.parameters && selectedPlugin.parameters.length > 0 && (
                  <div className="space-y-3 pt-3 border-t border-slate-800">
                    <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1.5">
                      <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Plugin Parameters</span>
                    </span>

                    <div className="space-y-3">
                      {selectedPlugin.parameters.map((param) => {
                        const val =
                          selectedPlugin.currentParams[param.id] ?? param.defaultValue;
                        return (
                          <div key={param.id} className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-slate-400 font-medium">{param.label}</span>
                              <span className="font-mono text-slate-300">
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
                                  handleUpdateParam(
                                    selectedPlugin.id,
                                    param.id,
                                    parseFloat(e.target.value)
                                  )
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
                                    handleUpdateParam(selectedPlugin.id, param.id, e.target.value)
                                  }
                                  className="w-8 h-8 rounded-lg cursor-pointer bg-transparent border-0"
                                />
                                <span className="font-mono text-xs text-slate-300 uppercase">
                                  {val}
                                </span>
                              </div>
                            )}

                            {param.type === 'toggle' && (
                              <button
                                onClick={() =>
                                  handleUpdateParam(selectedPlugin.id, param.id, !val)
                                }
                                className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors ${
                                  val
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-slate-800 text-slate-400'
                                }`}
                              >
                                {val ? 'Enabled' : 'Disabled'}
                              </button>
                            )}

                            {param.type === 'text' && (
                              <input
                                type="text"
                                value={val}
                                onChange={(e) =>
                                  handleUpdateParam(selectedPlugin.id, param.id, e.target.value)
                                }
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1 text-xs text-white outline-none focus:border-indigo-500"
                              />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Category specific actions */}
                {selectedPlugin.category === 'script' && (
                  <button
                    onClick={() => {
                      const res = executeScriptPlugin(selectedPlugin, project);
                      if (res.modifiedSettings && onApplyProjectSettings) {
                        onApplyProjectSettings(res.modifiedSettings);
                      }
                      showToast('success', 'Macro Executed', res.message);
                    }}
                    className="w-full py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span>Run Script Macro</span>
                  </button>
                )}
              </div>
            )}
          </div>
        ) : (
          /* ================================================================= */
          /* PLUGIN DEVELOPER IDE & LIVE SANDBOX                               */
          /* ================================================================= */
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Left Column: Code Editor & Metadata Form */}
            <div className="flex-1 p-5 flex flex-col space-y-4 border-r border-slate-800 overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Plugin Name
                  </label>
                  <input
                    type="text"
                    value={ideName}
                    onChange={(e) => setIdeName(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-purple-500"
                  />
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Category Target
                  </label>
                  <select
                    value={ideCategory}
                    onChange={(e) => setIdeCategory(e.target.value as PluginCategory)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-purple-500"
                  >
                    <option value="filter">Custom Pixel Shader (JS)</option>
                    <option value="script">Automation Script / Macro</option>
                    <option value="brush">Procedural Brush Tip</option>
                    <option value="lut">3D Color Profile</option>
                    <option value="ai-model">AI Vision Prompt</option>
                    <option value="template">Layout Template</option>
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Author Credit
                  </label>
                  <input
                    type="text"
                    value={ideAuthor}
                    onChange={(e) => setIdeAuthor(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-purple-500"
                  />
                </div>
              </div>

              {/* Code Editor */}
              <div className="flex-1 flex flex-col min-h-[300px] bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
                <div className="p-2.5 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
                  <span>main.plugin.js</span>
                  <span className="text-[10px] text-purple-400">ES6 JavaScript Sandbox</span>
                </div>
                <textarea
                  value={ideCode}
                  onChange={(e) => setIdeCode(e.target.value)}
                  className="flex-1 p-3.5 bg-transparent font-mono text-xs text-purple-200 outline-none resize-none leading-relaxed"
                  spellCheck={false}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2">
                <button
                  onClick={handleRunSandbox}
                  disabled={ideRunning}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs flex items-center gap-2 shadow-lg shadow-purple-500/20 active:scale-95 disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5 fill-white" />
                  <span>{ideRunning ? 'Compiling...' : 'Run in Sandbox'}</span>
                </button>

                <button
                  onClick={handleSaveIdePlugin}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-black text-xs flex items-center gap-2 shadow-lg active:scale-95"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Register & Save Plugin</span>
                </button>
              </div>
            </div>

            {/* Right Column: Sandbox Canvas & Execution Console */}
            <div className="w-full md:w-80 p-5 bg-slate-950/50 flex flex-col space-y-4 shrink-0">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <Terminal className="w-4 h-4 text-purple-400" />
                <span>Live Sandbox Preview</span>
              </span>

              {/* Test Canvas */}
              <div className="w-full aspect-square bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden flex items-center justify-center relative shadow-inner">
                <canvas
                  ref={sandboxCanvasRef}
                  width={240}
                  height={240}
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Console Logs Output */}
              <div className="flex-1 bg-slate-950 border border-slate-800 rounded-2xl p-3 flex flex-col min-h-[160px] overflow-hidden">
                <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider block mb-1">
                  Debug Console
                </span>
                <div className="flex-1 overflow-y-auto space-y-1 font-mono text-[11px]">
                  {ideConsoleLogs.length === 0 ? (
                    <span className="text-slate-600">No output. Press 'Run in Sandbox' to test.</span>
                  ) : (
                    ideConsoleLogs.map((log, idx) => (
                      <div key={idx} className="text-purple-300">
                        &gt; {log}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer info */}
        <div className="p-3.5 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <span className="text-slate-500 font-mono text-[11px]">
              Lumina Plugin Engine v3.2 // Safe Sandbox Execution
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-indigo-400 font-bold">
              {installedCount} Active Plugins
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
