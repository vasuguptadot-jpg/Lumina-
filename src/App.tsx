import React, { useState, useEffect, useCallback } from 'react';
import { Project, EditHistorySnapshot } from './types/editor';
import { DEFAULT_PROJECT_STATE } from './engine/defaultSettings';
import { SAMPLE_IMAGES, createSampleImageFile } from './engine/sampleImages';
import { Navbar } from './components/common/Navbar';
import { Editor } from './components/Editor';
import { BatchProcessor } from './components/batch/BatchProcessor';
import { SampleGallery } from './components/gallery/SampleGallery';
import { ExportModal } from './components/export/ExportModal';
import { CloudProjectsModal } from './components/cloud/CloudProjectsModal';
import { ShortcutModal } from './components/common/ShortcutModal';
import { ToastContainer, ToastMessage } from './components/common/Toast';
import { getAllProjectsFromDB, saveProjectToDB } from './storage/db';
import { requestAiAutoEnhance } from './services/aiService';

export function App() {
  const [project, setProject] = useState<Project>(() => {
    // Initial sample project on first boot
    const sample = SAMPLE_IMAGES[0];
    const imgFile = createSampleImageFile(sample);
    return {
      ...DEFAULT_PROJECT_STATE,
      id: `proj_init_${Date.now()}`,
      name: sample.name,
      image: imgFile,
      history: [
        {
          id: 'step_0',
          timestamp: Date.now(),
          label: 'Initial Import',
          settings: { ...DEFAULT_PROJECT_STATE.currentSettings },
          toneCurves: { ...DEFAULT_PROJECT_STATE.toneCurves },
          hsl: { ...DEFAULT_PROJECT_STATE.hsl },
          crop: { ...DEFAULT_PROJECT_STATE.crop },
          activePresetId: null,
          presetStrength: 100,
          watermark: { ...DEFAULT_PROJECT_STATE.watermark },
          border: { ...DEFAULT_PROJECT_STATE.border },
          masks: [],
        },
      ],
      historyIndex: 0,
    };
  });

  const [activeTab, setActiveTab] = useState<'editor' | 'batch' | 'projects' | 'samples'>('editor');
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isCloudModalOpen, setIsCloudModalOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isAutoEnhancing, setIsAutoEnhancing] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Toast dispatch helper
  const showToast = useCallback(
    (type: 'success' | 'error' | 'info', title: string, message?: string) => {
      const id = `toast_${Date.now()}_${Math.random()}`;
      setToasts((prev) => [...prev, { id, type, title, message }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 4000);
    },
    []
  );

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Load last saved project from IndexedDB if available on start
  useEffect(() => {
    getAllProjectsFromDB().then((list) => {
      if (list && list.length > 0) {
        setProject(list[0]);
      }
    });
  }, []);

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT' || (e.target as HTMLElement)?.tagName === 'TEXTAREA') {
        return;
      }

      // Undo: Ctrl+Z or Cmd+Z
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        handleUndo();
      }
      // Redo: Ctrl+Y or Ctrl+Shift+Z
      else if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) {
        e.preventDefault();
        handleRedo();
      }
      // Export: Ctrl+E
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'e') {
        e.preventDefault();
        setIsExportModalOpen(true);
      }
      // Cloud sync modal: Ctrl+S
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        setIsCloudModalOpen(true);
      }
      // Shortcuts Help: ?
      else if (e.key === '?' || (e.key === '/' && e.shiftKey)) {
        e.preventDefault();
        setIsShortcutsOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // Undo / Redo logic
  const canUndo = (project.historyIndex ?? 0) > 0;
  const canRedo =
    project.history !== undefined &&
    project.historyIndex !== undefined &&
    project.historyIndex < project.history.length - 1;

  const handleUndo = () => {
    if (!canUndo || !project.history) return;
    const newIdx = project.historyIndex! - 1;
    const snap = project.history[newIdx];
    setProject({
      ...project,
      currentSettings: { ...snap.settings },
      toneCurves: { ...snap.toneCurves },
      hsl: { ...snap.hsl },
      crop: { ...snap.crop },
      activePresetId: snap.activePresetId,
      presetStrength: snap.presetStrength ?? 100,
      watermark: snap.watermark ? { ...snap.watermark } : project.watermark,
      border: snap.border ? { ...snap.border } : project.border,
      masks: snap.masks ? [...snap.masks] : project.masks,
      layers: snap.layers ? [...snap.layers] : project.layers,
      typography: snap.typography ? [...snap.typography] : project.typography,
      designElements: snap.designElements ? [...snap.designElements] : project.designElements,
      retouchStrokes: snap.retouchStrokes ? [...snap.retouchStrokes] : project.retouchStrokes,
      drawingStrokes: snap.drawingStrokes ? [...snap.drawingStrokes] : project.drawingStrokes,
      collage: snap.collage ? { ...snap.collage } : project.collage,
      historyIndex: newIdx,
      updatedAt: Date.now(),
    });
    showToast('info', 'Undo', snap.label || 'Step reverted');
  };

  const handleRedo = () => {
    if (!canRedo || !project.history) return;
    const newIdx = project.historyIndex! + 1;
    const snap = project.history[newIdx];
    setProject({
      ...project,
      currentSettings: { ...snap.settings },
      toneCurves: { ...snap.toneCurves },
      hsl: { ...snap.hsl },
      crop: { ...snap.crop },
      activePresetId: snap.activePresetId,
      presetStrength: snap.presetStrength ?? 100,
      watermark: snap.watermark ? { ...snap.watermark } : project.watermark,
      border: snap.border ? { ...snap.border } : project.border,
      masks: snap.masks ? [...snap.masks] : project.masks,
      layers: snap.layers ? [...snap.layers] : project.layers,
      typography: snap.typography ? [...snap.typography] : project.typography,
      designElements: snap.designElements ? [...snap.designElements] : project.designElements,
      retouchStrokes: snap.retouchStrokes ? [...snap.retouchStrokes] : project.retouchStrokes,
      drawingStrokes: snap.drawingStrokes ? [...snap.drawingStrokes] : project.drawingStrokes,
      collage: snap.collage ? { ...snap.collage } : project.collage,
      historyIndex: newIdx,
      updatedAt: Date.now(),
    });
    showToast('info', 'Redo', snap.label || 'Step restored');
  };

  const handleReset = () => {
    const resetSettings = { ...DEFAULT_PROJECT_STATE.currentSettings };
    const resetCurves = { ...DEFAULT_PROJECT_STATE.toneCurves };
    const resetHsl = { ...DEFAULT_PROJECT_STATE.hsl };

    const updated: Project = {
      ...project,
      currentSettings: resetSettings,
      toneCurves: resetCurves,
      hsl: resetHsl,
      activePresetId: null,
      presetStrength: 100,
      updatedAt: Date.now(),
    };

    setProject(updated);
    saveProjectToDB(updated);
    showToast('info', 'Reset All', 'All adjustments cleared');
  };

  // AI Auto Enhance from Navbar
  const handleAutoEnhance = async () => {
    const canvas = document.querySelector('canvas') as HTMLCanvasElement | null;
    if (!canvas) return;

    setIsAutoEnhancing(true);
    showToast('info', 'AI Auto-Tune', 'Gemini is calculating optimal color science & balance...');

    try {
      const base64 = canvas.toDataURL('image/jpeg', 0.9);
      const res = await requestAiAutoEnhance(base64);

      if (res.success && res.data) {
        const d = res.data;
        const updated: Project = {
          ...project,
          currentSettings: {
            ...project.currentSettings,
            exposure: d.exposure ?? project.currentSettings.exposure,
            brightness: d.brightness ?? project.currentSettings.brightness,
            contrast: d.contrast ?? project.currentSettings.contrast,
            highlights: d.highlights ?? project.currentSettings.highlights,
            shadows: d.shadows ?? project.currentSettings.shadows,
            whites: d.whites ?? project.currentSettings.whites,
            blacks: d.blacks ?? project.currentSettings.blacks,
            temperature: d.temperature ?? project.currentSettings.temperature,
            tint: d.tint ?? project.currentSettings.tint,
            saturation: d.saturation ?? project.currentSettings.saturation,
            vibrance: d.vibrance ?? project.currentSettings.vibrance,
            clarity: d.clarity ?? project.currentSettings.clarity,
            sharpness: d.sharpness ?? project.currentSettings.sharpness,
            vignette: d.vignette ?? project.currentSettings.vignette,
          },
          updatedAt: Date.now(),
        };

        setProject(updated);
        saveProjectToDB(updated);
        showToast('success', 'AI Auto-Tune Applied', d.analysis || 'Balanced exposure, highlights, and contrast.');
      } else {
        showToast('error', 'AI Auto-Tune Failed', res.error || 'Could not analyze photo.');
      }
    } catch (err: any) {
      showToast('error', 'AI Error', err.message);
    } finally {
      setIsAutoEnhancing(false);
    }
  };

  const handleProjectNameChange = (name: string) => {
    setProject((prev) => ({
      ...prev,
      name,
      updatedAt: Date.now(),
    }));
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Top Application Navbar */}
      <Navbar
        project={project}
        activeTab={activeTab}
        onSelectTab={(tab) => {
          if (tab === 'projects') {
            setIsCloudModalOpen(true);
          } else {
            setActiveTab(tab);
          }
        }}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={handleUndo}
        onRedo={handleRedo}
        onReset={handleReset}
        onOpenExport={() => setIsExportModalOpen(true)}
        onOpenCloudModal={() => setIsCloudModalOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        onAutoEnhance={handleAutoEnhance}
        isAutoEnhancing={isAutoEnhancing}
        onProjectNameChange={handleProjectNameChange}
      />

      {/* Main Workspace Body */}
      <main className="flex-1 flex overflow-hidden relative">
        {activeTab === 'editor' && (
          <Editor
            project={project}
            onUpdateProject={setProject}
            onOpenSampleGallery={() => setActiveTab('samples')}
            showToast={showToast}
          />
        )}

        {activeTab === 'batch' && (
          <BatchProcessor
            currentProject={project}
            showToast={showToast}
          />
        )}

        {activeTab === 'samples' && (
          <SampleGallery
            onLoadSample={(sampleProject) => {
              setProject(sampleProject);
              setActiveTab('editor');
              showToast('success', 'Sample Loaded', `Opened "${sampleProject.name}"`);
            }}
          />
        )}
      </main>

      {/* High-Resolution Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        project={project}
        showToast={showToast}
      />

      {/* Cloud Workspace & Sync Modal */}
      <CloudProjectsModal
        isOpen={isCloudModalOpen}
        onClose={() => setIsCloudModalOpen(false)}
        currentProject={project}
        onLoadProject={(loaded) => {
          setProject(loaded);
          setActiveTab('editor');
          showToast('success', 'Project Loaded', `Opened "${loaded.name}"`);
        }}
        showToast={showToast}
      />

      {/* Keyboard Shortcuts Modal */}
      <ShortcutModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

export default App;
