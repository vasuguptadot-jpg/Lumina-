import React, { useState, useEffect, useRef } from 'react';
import {
  Smartphone,
  Laptop,
  Tablet,
  Globe,
  Square,
  Sparkles,
  Sliders,
  Eye,
  Shield,
  Layers,
  Rotate3d,
  Palette,
  Maximize2,
  Download,
  Copy,
  Check,
  Plus,
  Trash2,
  Battery,
  Wifi,
  Signal,
  Clock,
  Sun,
  Moon,
  ChevronDown,
  ChevronRight,
  Zap,
} from 'lucide-react';
import { Project } from '../../../types/editor';
import {
  ScreenshotStudioState,
  DEFAULT_SCREENSHOT_STUDIO_STATE,
  DeviceFrameType,
  StatusBarStyle,
  RedactionType,
  PerspectivePreset,
  BackdropType,
  ShadowPreset,
} from '../../../types/screenshot';
import {
  BACKDROP_GRADIENTS,
  renderMasterScreenshotStudio,
} from '../../../engine/screenshotEngine';
import confetti from 'canvas-confetti';

interface ScreenshotStudioPanelProps {
  project: Project;
  onUpdateImage: (newImageUrl: string, width?: number, height?: number) => void;
  showToast: (type: 'success' | 'error' | 'info', title: string, msg?: string) => void;
}

export const ScreenshotStudioPanel: React.FC<ScreenshotStudioPanelProps> = ({
  project,
  onUpdateImage,
  showToast,
}) => {
  const [state, setState] = useState<ScreenshotStudioState>(DEFAULT_SCREENSHOT_STUDIO_STATE);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [activeSection, setActiveSection] = useState<'device' | 'status' | 'redact' | 'perspective' | 'backdrop' | 'shadow' | 'corners'>('device');
  const [copied, setCopied] = useState(false);

  // Re-render live preview whenever state changes
  useEffect(() => {
    let isCancelled = false;

    const generatePreview = async () => {
      if (!project.image.originalUrl) return;
      setIsRendering(true);
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = project.image.originalUrl;
        await new Promise((res, rej) => {
          img.onload = () => res(img);
          img.onerror = rej;
        });

        const result = await renderMasterScreenshotStudio(img, state);
        if (!isCancelled) {
          setPreviewUrl(result.blobUrl);
        }
      } catch (err) {
        console.error('Screenshot studio render error:', err);
      } finally {
        if (!isCancelled) {
          setIsRendering(false);
        }
      }
    };

    const timer = setTimeout(generatePreview, 80);
    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [project.image.originalUrl, state]);

  // Handlers
  const handleSetFrame = (frame: DeviceFrameType) => {
    setState((prev) => ({ ...prev, deviceFrame: frame }));
  };

  const handleSetStatusStyle = (style: StatusBarStyle) => {
    setState((prev) => ({
      ...prev,
      statusBar: { ...prev.statusBar, style },
    }));
  };

  const handleAddRedaction = (type: RedactionType = 'blur') => {
    const newBox = {
      id: `redact_${Date.now()}`,
      x: 0.1,
      y: 0.08,
      width: 0.8,
      height: 0.06,
      type,
      label: `Redaction #${state.redactions.length + 1}`,
    };
    setState((prev) => ({
      ...prev,
      redactions: [...prev.redactions, newBox],
    }));
    showToast('info', 'Redaction Added', 'Adjust coordinates or blur style in panel.');
  };

  const handleRemoveRedaction = (id: string) => {
    setState((prev) => ({
      ...prev,
      redactions: prev.redactions.filter((r) => r.id !== id),
    }));
  };

  const handleSetPerspectivePreset = (preset: PerspectivePreset) => {
    if (preset === 'flat') {
      setState((prev) => ({
        ...prev,
        perspective: { ...prev.perspective, preset, rotateX: 0, rotateY: 0, rotateZ: 0 },
      }));
    } else if (preset === 'floating-hero') {
      setState((prev) => ({
        ...prev,
        perspective: { ...prev.perspective, preset, rotateX: 8, rotateY: -12, rotateZ: 4 },
      }));
    } else if (preset === 'isometric-right') {
      setState((prev) => ({
        ...prev,
        perspective: { ...prev.perspective, preset, rotateX: 18, rotateY: -24, rotateZ: 10 },
      }));
    } else if (preset === 'isometric-left') {
      setState((prev) => ({
        ...prev,
        perspective: { ...prev.perspective, preset, rotateX: 18, rotateY: 24, rotateZ: -10 },
      }));
    } else if (preset === 'dramatic-pitch') {
      setState((prev) => ({
        ...prev,
        perspective: { ...prev.perspective, preset, rotateX: 28, rotateY: 0, rotateZ: 0 },
      }));
    }
  };

  const handleSetShadowPreset = (preset: ShadowPreset) => {
    if (preset === 'apple-floating') {
      setState((prev) => ({
        ...prev,
        shadow: { ...prev.shadow, preset, blur: 50, offsetY: 30, opacity: 65, spread: 10 },
      }));
    } else if (preset === 'subtle-studio') {
      setState((prev) => ({
        ...prev,
        shadow: { ...prev.shadow, preset, blur: 25, offsetY: 12, opacity: 35, spread: 4 },
      }));
    } else if (preset === 'deep-3d') {
      setState((prev) => ({
        ...prev,
        shadow: { ...prev.shadow, preset, blur: 80, offsetY: 45, opacity: 75, spread: 18 },
      }));
    } else if (preset === 'cyber-glow') {
      setState((prev) => ({
        ...prev,
        shadow: { ...prev.shadow, preset, blur: 60, offsetY: 10, opacity: 80, spread: 14, color: '#6366f1' },
      }));
    } else if (preset === 'none') {
      setState((prev) => ({
        ...prev,
        shadow: { ...prev.shadow, preset, blur: 0, offsetY: 0, opacity: 0 },
      }));
    }
  };

  const handleApplyToEditor = async () => {
    if (!previewUrl) return;
    try {
      const img = new Image();
      img.src = previewUrl;
      await new Promise((res) => (img.onload = res));
      onUpdateImage(previewUrl, img.naturalWidth, img.naturalHeight);
      try {
        confetti({ particleCount: 60, spread: 50 });
      } catch (e) {}
      showToast('success', 'Applied to Studio Canvas', 'Screenshot frame and backdrop rendered.');
    } catch (err: any) {
      showToast('error', 'Apply Failed', err.message);
    }
  };

  const handleDownload = () => {
    if (!previewUrl) return;
    const a = document.createElement('a');
    a.href = previewUrl;
    a.download = `Screenshot_Studio_${Date.now()}.png`;
    a.click();
    showToast('success', 'Screenshot Exported', 'Saved as high-resolution PNG.');
  };

  const handleCopyClipboard = async () => {
    if (!previewUrl) return;
    try {
      const resp = await fetch(previewUrl);
      const blob = await resp.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      showToast('success', 'Copied to Clipboard', 'Ready to paste into Figma, Slack, or Docs.');
    } catch (err) {
      showToast('info', 'Copy Note', 'Right click preview image and select Copy Image.');
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 overflow-y-auto divide-y divide-slate-800/80 select-none text-slate-200">
      {/* Studio Header Banner */}
      <div className="p-4 bg-gradient-to-r from-indigo-950/60 via-purple-950/40 to-slate-950 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-indigo-500 to-pink-500 text-white shadow-lg shadow-indigo-500/20">
              <Smartphone className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-white">Screenshot Studio</h3>
                <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  PRO
                </span>
              </div>
              <p className="text-xs text-slate-400">Device frames, clean status bar, 3D tilt & backdrops</p>
            </div>
          </div>
        </div>

        {/* Live Preview Thumbnail Box */}
        <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 aspect-[16/10] flex items-center justify-center p-2 group shadow-xl">
          {previewUrl ? (
            <div
              className="w-full h-full flex items-center justify-center transition-transform duration-300 group-hover:scale-105"
              style={{
                perspective: `${state.perspective.perspective}px`,
              }}
            >
              <img
                src={previewUrl}
                alt="Screenshot Preview"
                className="max-w-full max-h-full object-contain rounded-lg shadow-2xl transition-transform duration-300"
                style={{
                  transform: state.perspective.enabled
                    ? `rotateX(${state.perspective.rotateX}deg) rotateY(${state.perspective.rotateY}deg) rotateZ(${state.perspective.rotateZ}deg) scale(${state.perspective.scale})`
                    : 'none',
                }}
              />
            </div>
          ) : (
            <div className="text-xs text-slate-500 flex items-center gap-2">
              <Zap className="w-4 h-4 animate-pulse text-indigo-400" />
              <span>Rendering studio frame...</span>
            </div>
          )}

          {isRendering && (
            <div className="absolute top-2 right-2 px-2 py-1 rounded bg-black/60 backdrop-blur-md text-[10px] font-semibold text-indigo-300 border border-white/10 flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
              <span>Rendering...</span>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={handleApplyToEditor}
            className="py-2 px-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold shadow-md shadow-indigo-600/30 flex items-center justify-center gap-1.5 transition-all active:scale-95"
            title="Apply mockup as main studio canvas"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Apply</span>
          </button>

          <button
            onClick={handleDownload}
            className="py-2 px-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>PNG</span>
          </button>

          <button
            onClick={handleCopyClipboard}
            className="py-2 px-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-indigo-400" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="p-2 grid grid-cols-4 gap-1 bg-slate-950/90 text-[11px] font-semibold">
        {[
          { id: 'device', label: 'Device', icon: Smartphone },
          { id: 'status', label: 'Status Bar', icon: Battery },
          { id: 'redact', label: 'Redact', icon: Shield },
          { id: 'perspective', label: '3D Tilt', icon: Rotate3d },
          { id: 'backdrop', label: 'Backdrop', icon: Palette },
          { id: 'shadow', label: 'Shadow', icon: Maximize2 },
          { id: 'corners', label: 'Corners', icon: Square },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSection === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id as any)}
              className={`p-2 rounded-xl flex flex-col items-center gap-1 transition-all ${
                isActive
                  ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/40 shadow-sm'
                  : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 1. DEVICE FRAMES SECTION */}
      {activeSection === 'device' && (
        <div className="p-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-200 flex items-center gap-2">
              <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
              <span>Realistic Device Mockup</span>
            </h4>
            <span className="text-[10px] text-slate-500">Vector Frames</span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            {[
              { id: 'iphone-16-pro', label: 'iPhone 16 Pro', desc: 'Natural Titanium + Dynamic Island', icon: Smartphone },
              { id: 'iphone-16-gold', label: 'iPhone 16 Gold', desc: 'Desert Titanium Gold', icon: Smartphone },
              { id: 'ipad-pro', label: 'iPad Pro M4', desc: 'Ultra-thin bezel display', icon: Tablet },
              { id: 'macbook-pro', label: 'MacBook Pro 16"', desc: 'Space Gray + Camera notch', icon: Laptop },
              { id: 'browser-safari-dark', label: 'Safari Dark', desc: 'macOS Dark window & dots', icon: Globe },
              { id: 'browser-safari-light', label: 'Safari Light', desc: 'macOS Light window & URL', icon: Globe },
              { id: 'minimal-card', label: 'Minimal Card', desc: 'Frameless floating elevation', icon: Square },
              { id: 'none', label: 'None (Raw)', desc: 'Pure screenshot buffer', icon: Square },
            ].map((f) => {
              const isSelected = state.deviceFrame === f.id;
              const Icon = f.icon;
              return (
                <button
                  key={f.id}
                  onClick={() => handleSetFrame(f.id as DeviceFrameType)}
                  className={`p-3 rounded-2xl border text-left flex flex-col gap-1 transition-all ${
                    isSelected
                      ? 'bg-indigo-600/20 border-indigo-500/80 shadow-md shadow-indigo-600/20 text-white'
                      : 'bg-slate-900/60 border-slate-800/80 text-slate-400 hover:bg-slate-900 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-indigo-400' : 'text-slate-400'}`} />
                    {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />}
                  </div>
                  <div className="font-bold text-xs mt-1 text-slate-200">{f.label}</div>
                  <div className="text-[10px] text-slate-500 leading-tight">{f.desc}</div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. CLEAN STATUS BAR SECTION */}
      {activeSection === 'status' && (
        <div className="p-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-200 flex items-center gap-2">
              <Battery className="w-3.5 h-3.5 text-emerald-400" />
              <span>Clean Status Bar</span>
            </h4>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={state.statusBar.enabled}
                onChange={(e) =>
                  setState((prev) => ({
                    ...prev,
                    statusBar: { ...prev.statusBar, enabled: e.target.checked },
                  }))
                }
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          <p className="text-xs text-slate-400">
            Automatically replace cluttered carrier labels, low battery icons, and notification icons with a pristine Apple/Android status bar.
          </p>

          {state.statusBar.enabled && (
            <div className="flex flex-col gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800/80">
              {/* Theme Style */}
              <div>
                <label className="text-xs font-semibold text-slate-300 mb-1.5 block">Theme Style</label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'ios-dark', label: 'iOS Dark (White)', icon: Moon },
                    { id: 'ios-light', label: 'iOS Light (Black)', icon: Sun },
                    { id: 'android-dark', label: 'Android Dark', icon: Moon },
                    { id: 'android-light', label: 'Android Light', icon: Sun },
                  ].map((s) => (
                    <button
                      key={s.id}
                      onClick={() => handleSetStatusStyle(s.id as StatusBarStyle)}
                      className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-between border transition-all ${
                        state.statusBar.style === s.id
                          ? 'bg-indigo-600/30 border-indigo-500 text-indigo-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span>{s.label}</span>
                      <s.icon className="w-3.5 h-3.5 opacity-60" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Time & Battery Inputs */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-1 block">Time</label>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <input
                      type="text"
                      value={state.statusBar.time}
                      onChange={(e) =>
                        setState((prev) => ({
                          ...prev,
                          statusBar: { ...prev.statusBar, time: e.target.value },
                        }))
                      }
                      className="w-full bg-transparent text-xs text-white outline-none font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 mb-1 block">Battery (%)</label>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800">
                    <Battery className="w-3.5 h-3.5 text-emerald-400" />
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={state.statusBar.batteryPercent}
                      onChange={(e) =>
                        setState((prev) => ({
                          ...prev,
                          statusBar: { ...prev.statusBar, batteryPercent: Number(e.target.value) },
                        }))
                      }
                      className="w-full bg-transparent text-xs text-white outline-none font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Toggles */}
              <div className="grid grid-cols-3 gap-2 pt-1">
                <button
                  onClick={() =>
                    setState((prev) => ({
                      ...prev,
                      statusBar: { ...prev.statusBar, showWifi: !prev.statusBar.showWifi },
                    }))
                  }
                  className={`py-1.5 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                    state.statusBar.showWifi
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                      : 'bg-slate-950 border-slate-800 text-slate-500'
                  }`}
                >
                  <Wifi className="w-3.5 h-3.5" />
                  <span>WiFi</span>
                </button>

                <button
                  onClick={() =>
                    setState((prev) => ({
                      ...prev,
                      statusBar: { ...prev.statusBar, showCellular: !prev.statusBar.showCellular },
                    }))
                  }
                  className={`py-1.5 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                    state.statusBar.showCellular
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                      : 'bg-slate-950 border-slate-800 text-slate-500'
                  }`}
                >
                  <Signal className="w-3.5 h-3.5" />
                  <span>5G Bars</span>
                </button>

                <button
                  onClick={() =>
                    setState((prev) => ({
                      ...prev,
                      statusBar: { ...prev.statusBar, showDynamicIsland: !prev.statusBar.showDynamicIsland },
                    }))
                  }
                  className={`py-1.5 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border transition-all ${
                    state.statusBar.showDynamicIsland
                      ? 'bg-purple-950/40 border-purple-500/40 text-purple-300'
                      : 'bg-slate-950 border-slate-800 text-slate-500'
                  }`}
                >
                  <div className="w-2.5 h-1.5 rounded-full bg-current" />
                  <span>Island</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 3. NOTIFICATION REMOVAL & REDACTIONS */}
      {activeSection === 'redact' && (
        <div className="p-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-200 flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-pink-400" />
              <span>Remove Notifications & Redact</span>
            </h4>
            <button
              onClick={() => handleAddRedaction('blur')}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-pink-600 hover:bg-pink-500 text-white text-xs font-semibold shadow-sm transition-all"
            >
              <Plus className="w-3 h-3" />
              <span>Add Box</span>
            </button>
          </div>

          <p className="text-xs text-slate-400">
            Censor personal messages, sensitive credentials, or unwanted notification popups with smart blur, mosaic pixelation, or blackout boxes.
          </p>

          {state.redactions.length === 0 ? (
            <div className="p-6 rounded-2xl bg-slate-900/40 border border-slate-800 flex flex-col items-center justify-center text-center gap-2">
              <Shield className="w-8 h-8 text-slate-600" />
              <div className="text-xs font-semibold text-slate-300">No Redactions Applied</div>
              <button
                onClick={() => handleAddRedaction('blur')}
                className="mt-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs text-indigo-300 font-semibold border border-slate-700"
              >
                + Add Blur Mask
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {state.redactions.map((box, index) => (
                <div
                  key={box.id}
                  className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col gap-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200">Redaction #{index + 1}</span>
                    <button
                      onClick={() => handleRemoveRedaction(box.id)}
                      className="p-1 rounded text-slate-500 hover:text-rose-400 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Redaction Type Pill Selector */}
                  <div className="grid grid-cols-4 gap-1 text-[11px]">
                    {[
                      { id: 'blur', label: 'Blur' },
                      { id: 'pixelate', label: 'Mosaic' },
                      { id: 'blackout', label: 'Blackout' },
                      { id: 'seamless-fill', label: 'Fill' },
                    ].map((t) => (
                      <button
                        key={t.id}
                        onClick={() =>
                          setState((prev) => ({
                            ...prev,
                            redactions: prev.redactions.map((r) =>
                              r.id === box.id ? { ...r, type: t.id as RedactionType } : r
                            ),
                          }))
                        }
                        className={`py-1 rounded-lg font-medium border text-center transition-all ${
                          box.type === t.id
                            ? 'bg-pink-600 text-white border-pink-500 font-bold'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>

                  {/* Vertical Position Slider */}
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>Vertical Position (Y)</span>
                    <span>{Math.round(box.y * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={Math.round(box.y * 100)}
                    onChange={(e) =>
                      setState((prev) => ({
                        ...prev,
                        redactions: prev.redactions.map((r) =>
                          r.id === box.id ? { ...r, y: Number(e.target.value) / 100 } : r
                        ),
                      }))
                    }
                    className="w-full accent-pink-500"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 4. 3D PERSPECTIVE & TILT */}
      {activeSection === 'perspective' && (
        <div className="p-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-200 flex items-center gap-2">
              <Rotate3d className="w-3.5 h-3.5 text-cyan-400" />
              <span>3D Perspective & Showcase Tilt</span>
            </h4>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={state.perspective.enabled}
                onChange={(e) =>
                  setState((prev) => ({
                    ...prev,
                    perspective: { ...prev.perspective, enabled: e.target.checked },
                  }))
                }
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'flat', label: 'Flat (Frontal)' },
              { id: 'floating-hero', label: 'Floating Hero 3D' },
              { id: 'isometric-right', label: 'Isometric Right' },
              { id: 'isometric-left', label: 'Isometric Left' },
              { id: 'dramatic-pitch', label: 'Top Pitch 28°' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => handleSetPerspectivePreset(p.id as PerspectivePreset)}
                className={`p-2.5 rounded-xl text-xs font-semibold border transition-all ${
                  state.perspective.preset === p.id
                    ? 'bg-cyan-950/40 border-cyan-500/60 text-cyan-300 shadow-sm'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {state.perspective.enabled && (
            <div className="flex flex-col gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800/80">
              {/* Pitch X */}
              <div>
                <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
                  <span>Pitch (Rotate X)</span>
                  <span className="font-mono text-cyan-400">{state.perspective.rotateX}°</span>
                </div>
                <input
                  type="range"
                  min={-45}
                  max={45}
                  value={state.perspective.rotateX}
                  onChange={(e) =>
                    setState((prev) => ({
                      ...prev,
                      perspective: { ...prev.perspective, rotateX: Number(e.target.value), preset: 'custom' },
                    }))
                  }
                  className="w-full accent-cyan-500"
                />
              </div>

              {/* Yaw Y */}
              <div>
                <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
                  <span>Yaw (Rotate Y)</span>
                  <span className="font-mono text-cyan-400">{state.perspective.rotateY}°</span>
                </div>
                <input
                  type="range"
                  min={-45}
                  max={45}
                  value={state.perspective.rotateY}
                  onChange={(e) =>
                    setState((prev) => ({
                      ...prev,
                      perspective: { ...prev.perspective, rotateY: Number(e.target.value), preset: 'custom' },
                    }))
                  }
                  className="w-full accent-cyan-500"
                />
              </div>

              {/* Roll Z */}
              <div>
                <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
                  <span>Roll (Rotate Z)</span>
                  <span className="font-mono text-cyan-400">{state.perspective.rotateZ}°</span>
                </div>
                <input
                  type="range"
                  min={-30}
                  max={30}
                  value={state.perspective.rotateZ}
                  onChange={(e) =>
                    setState((prev) => ({
                      ...prev,
                      perspective: { ...prev.perspective, rotateZ: Number(e.target.value), preset: 'custom' },
                    }))
                  }
                  className="w-full accent-cyan-500"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. BACKGROUND GENERATION */}
      {activeSection === 'backdrop' && (
        <div className="p-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-200 flex items-center gap-2">
              <Palette className="w-3.5 h-3.5 text-purple-400" />
              <span>Backdrop & Gradients</span>
            </h4>
          </div>

          {/* Preset Gradients */}
          <div>
            <label className="text-xs font-semibold text-slate-300 mb-2 block">Studio Gradient Presets</label>
            <div className="grid grid-cols-3 gap-2">
              {BACKDROP_GRADIENTS.map((g) => {
                const isSelected = state.backdrop.gradientPreset === g.id && state.backdrop.type === 'mesh-gradient';
                return (
                  <button
                    key={g.id}
                    onClick={() =>
                      setState((prev) => ({
                        ...prev,
                        backdrop: { ...prev.backdrop, type: 'mesh-gradient', gradientPreset: g.id },
                      }))
                    }
                    className={`h-12 rounded-xl relative overflow-hidden border transition-all ${
                      isSelected ? 'ring-2 ring-indigo-500 border-white' : 'border-slate-800 hover:scale-105'
                    }`}
                    style={{
                      background: `linear-gradient(${g.angle}deg, ${g.colors.join(', ')})`,
                    }}
                  >
                    <span className="absolute bottom-1 left-1.5 text-[9px] font-bold text-white drop-shadow-md">
                      {g.name}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Blurred Wallpaper Mode */}
          <button
            onClick={() =>
              setState((prev) => ({
                ...prev,
                backdrop: { ...prev.backdrop, type: 'blurred-wallpaper' },
              }))
            }
            className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
              state.backdrop.type === 'blurred-wallpaper'
                ? 'bg-purple-950/40 border-purple-500 text-purple-300'
                : 'bg-slate-900/60 border-slate-800 text-slate-400'
            }`}
          >
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span className="text-xs font-bold">Blurred Screenshot Wallpaper</span>
            </div>
            <span className="text-[10px] uppercase font-bold text-purple-400">Glass</span>
          </button>

          {/* Canvas Aspect Ratio */}
          <div>
            <label className="text-xs font-semibold text-slate-300 mb-1.5 block">Canvas Aspect Ratio</label>
            <div className="grid grid-cols-3 gap-1.5 text-xs">
              {[
                { id: '16:9', label: '16:9 (Landscape)' },
                { id: '4:3', label: '4:3 (Dribbble)' },
                { id: '1:1', label: '1:1 (Square)' },
                { id: 'twitter-post', label: 'Twitter (1200×675)' },
                { id: 'auto', label: 'Auto Fit' },
              ].map((ar) => (
                <button
                  key={ar.id}
                  onClick={() =>
                    setState((prev) => ({
                      ...prev,
                      backdrop: { ...prev.backdrop, aspectRatio: ar.id as any },
                    }))
                  }
                  className={`py-1.5 px-2 rounded-xl font-medium border text-center transition-all ${
                    state.backdrop.aspectRatio === ar.id
                      ? 'bg-indigo-600 border-indigo-500 text-white font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {ar.label}
                </button>
              ))}
            </div>
          </div>

          {/* Padding */}
          <div className="flex flex-col gap-2 bg-slate-900/60 p-3 rounded-2xl border border-slate-800/80">
            <div className="flex items-center justify-between text-xs text-slate-300">
              <span>Backdrop Padding</span>
              <span className="font-mono text-purple-400">{state.backdrop.paddingX} px</span>
            </div>
            <input
              type="range"
              min={20}
              max={180}
              value={state.backdrop.paddingX}
              onChange={(e) =>
                setState((prev) => ({
                  ...prev,
                  backdrop: {
                    ...prev.backdrop,
                    paddingX: Number(e.target.value),
                    paddingY: Math.round(Number(e.target.value) * 0.9),
                  },
                }))
              }
              className="w-full accent-purple-500"
            />
          </div>
        </div>
      )}

      {/* 6. SHADOW STUDIO */}
      {activeSection === 'shadow' && (
        <div className="p-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-200 flex items-center gap-2">
              <Maximize2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Multi-Layer Elevation Shadow</span>
            </h4>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={state.shadow.enabled}
                onChange={(e) =>
                  setState((prev) => ({
                    ...prev,
                    shadow: { ...prev.shadow, enabled: e.target.checked },
                  }))
                }
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'apple-floating', label: 'Apple Floating Glass' },
              { id: 'subtle-studio', label: 'Subtle Studio' },
              { id: 'deep-3d', label: 'Deep 3D Stage' },
              { id: 'cyber-glow', label: 'Cyber Indigo Glow' },
              { id: 'none', label: 'No Shadow' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => handleSetShadowPreset(p.id as ShadowPreset)}
                className={`p-2.5 rounded-xl text-xs font-semibold border transition-all ${
                  state.shadow.preset === p.id
                    ? 'bg-amber-950/40 border-amber-500/60 text-amber-300 shadow-sm'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {state.shadow.enabled && (
            <div className="flex flex-col gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800/80">
              {/* Blur */}
              <div>
                <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
                  <span>Shadow Softness / Blur</span>
                  <span className="font-mono text-amber-400">{state.shadow.blur} px</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={120}
                  value={state.shadow.blur}
                  onChange={(e) =>
                    setState((prev) => ({
                      ...prev,
                      shadow: { ...prev.shadow, blur: Number(e.target.value) },
                    }))
                  }
                  className="w-full accent-amber-500"
                />
              </div>

              {/* Elevation Offset Y */}
              <div>
                <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
                  <span>Elevation Depth (Offset Y)</span>
                  <span className="font-mono text-amber-400">{state.shadow.offsetY} px</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={80}
                  value={state.shadow.offsetY}
                  onChange={(e) =>
                    setState((prev) => ({
                      ...prev,
                      shadow: { ...prev.shadow, offsetY: Number(e.target.value) },
                    }))
                  }
                  className="w-full accent-amber-500"
                />
              </div>

              {/* Opacity */}
              <div>
                <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
                  <span>Shadow Opacity</span>
                  <span className="font-mono text-amber-400">{state.shadow.opacity}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={state.shadow.opacity}
                  onChange={(e) =>
                    setState((prev) => ({
                      ...prev,
                      shadow: { ...prev.shadow, opacity: Number(e.target.value) },
                    }))
                  }
                  className="w-full accent-amber-500"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* 7. ROUNDED CORNERS & GLASS INSET */}
      {activeSection === 'corners' && (
        <div className="p-4 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-200 flex items-center gap-2">
              <Square className="w-3.5 h-3.5 text-teal-400" />
              <span>Corners & Inset Glass Border</span>
            </h4>
          </div>

          <div className="flex flex-col gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800/80">
            {/* Corner Radius */}
            <div>
              <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
                <span>Corner Squircle Radius</span>
                <span className="font-mono text-teal-400">{state.corners.cornerRadius} px</span>
              </div>
              <input
                type="range"
                min={0}
                max={64}
                value={state.corners.cornerRadius}
                onChange={(e) =>
                  setState((prev) => ({
                    ...prev,
                    corners: { ...prev.corners, cornerRadius: Number(e.target.value) },
                  }))
                }
                className="w-full accent-teal-500"
              />
            </div>

            {/* Inset Border Width */}
            <div>
              <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
                <span>Specular Inset Border Width</span>
                <span className="font-mono text-teal-400">{state.corners.borderWidth} px</span>
              </div>
              <input
                type="range"
                min={0}
                max={8}
                value={state.corners.borderWidth}
                onChange={(e) =>
                  setState((prev) => ({
                    ...prev,
                    corners: { ...prev.corners, borderWidth: Number(e.target.value) },
                  }))
                }
                className="w-full accent-teal-500"
              />
            </div>

            {/* Border Opacity */}
            <div>
              <div className="flex items-center justify-between text-xs text-slate-300 mb-1">
                <span>Glass Reflection Opacity</span>
                <span className="font-mono text-teal-400">{state.corners.borderOpacity}%</span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={state.corners.borderOpacity}
                onChange={(e) =>
                  setState((prev) => ({
                    ...prev,
                    corners: { ...prev.corners, borderOpacity: Number(e.target.value) },
                  }))
                }
                className="w-full accent-teal-500"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
