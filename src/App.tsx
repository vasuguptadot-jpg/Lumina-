import React, { useState, useEffect, useCallback } from 'react';
import { Project, EditHistorySnapshot, ImageFile, FilterPreset } from './types/editor';
import { DEFAULT_PROJECT_STATE } from './engine/defaultSettings';
import { SAMPLE_IMAGES, createSampleImageFile } from './engine/sampleImages';
import { ProSidebarNav } from './components/navigation/ProSidebarNav';
import { MobileBottomNav } from './components/common/MobileBottomNav';
import { Editor } from './components/Editor';
import { BatchProcessor } from './components/batch/BatchProcessor';
import { SampleGallery } from './components/gallery/SampleGallery';
import { PhotoLibrary } from './components/library/PhotoLibrary';
import { HomeDashboard } from './components/home/HomeDashboard';
import { PresetsShowcaseView } from './components/presets/PresetsShowcaseView';
import { AIStudioMasterView } from './components/aistudio/AIStudioMasterView';
import { DesignStudioView } from './components/design/DesignStudioView';
import { ProjectsView } from './components/projects/ProjectsView';
import { CollageStudioView } from './components/collage/CollageStudioView';
import { AssetsLibraryView } from './components/assets/AssetsLibraryView';
import { ExportWorkspaceView } from './components/export/ExportWorkspaceView';
import { CloudWorkspaceView } from './components/cloud/CloudWorkspaceView';
import { SystemWorkspaceView } from './components/system/SystemWorkspaceView';
import { UniversalSettingsView } from './components/settings/UniversalSettingsView';
import { DesktopMenuBar } from './components/navigation/DesktopMenuBar';
import { useAdaptiveLayout } from './services/adaptiveLayout';
import { inputManager } from './services/inputManager';
import { GlobalCommandPalette } from './components/search/GlobalCommandPalette';
import { FeatureExplorerModal } from './components/discovery/FeatureExplorerModal';
import { AICreativeDirectorModal } from './components/ai/AICreativeDirectorModal';
import { ToolEducationModal } from './components/common/ToolEducationModal';
import { ExportModal } from './components/export/ExportModal';
import { SocialMediaExportModal } from './components/social/SocialMediaExportModal';
import { CloudHubModal } from './components/cloud/CloudHubModal';
import { ShortcutModal } from './components/common/ShortcutModal';
import { CameraStudioModal } from './components/camera/CameraStudioModal';
import { CollaborationModal } from './components/collaboration/CollaborationModal';
import { ClientReviewMode } from './components/collaboration/ClientReviewMode';
import { VersionComparisonModal } from './components/collaboration/VersionComparisonModal';
import { PluginPlatformModal } from './components/plugins/PluginPlatformModal';
import { AutomationStudioModal } from './components/automation/AutomationStudioModal';
import { DeveloperPlatformModal } from './components/developer/DeveloperPlatformModal';
import { SecurityPrivacyModal } from './components/security/SecurityPrivacyModal';
import { VaultLockOverlay } from './components/security/VaultLockOverlay';
import { PerformanceMonitorModal } from './components/performance/PerformanceMonitorModal';
import { GroqSettingsModal } from './components/groq/GroqSettingsModal';
import { WorkflowStageBar } from './components/workspace/WorkflowStageBar';
import { WorkspaceCustomizerModal } from './components/workspace/WorkspaceCustomizerModal';
import { UnsplashBrowserModal } from './components/common/UnsplashBrowserModal';
import { CapturedPhotoResult } from './types/camera';
import { WorkflowStageId, WorkspaceConfig } from './types/workflow';
import { MainNavTab, UserSkillMode, ToolDefinition } from './types/navigation';
import { MASTER_TOOLS_LIST } from './engine/toolRegistry';
import { FILTER_PRESETS } from './engine/presets';
import {
  loadWorkspaceConfig,
  saveWorkspaceConfig,
} from './engine/workspaceEngine';
import { ToastContainer, ToastMessage } from './components/common/Toast';
import {
  getAllProjectsFromDB,
  saveProjectToDB,
  autosaveEngine,
  tabConflictManager,
  checkForRecoverableProjects,
} from './storage/db';
import { RecoverySnapshotRecord, TabSyncMessage } from './types/projectSchema';
import { CrashRecoveryModal } from './components/storage/CrashRecoveryModal';
import { VersionSnapshotsModal } from './components/storage/VersionSnapshotsModal';
import { StorageQuotaModal } from './components/storage/StorageQuotaModal';
import { TabConflictBanner } from './components/storage/TabConflictBanner';
import {
  subscribeToAuth,
  subscribeToLiveProjectSync,
  fetchSharedProjectByCode,
} from './services/cloudSyncService';
import { cloudSyncEngine } from './services/cloudSyncEngine';
import { CloudConflictModal } from './components/cloud/CloudConflictModal';
import { ProjectConflictReport } from './types/cloudSync';
import { User } from 'firebase/auth';
import { mobileNative } from './services/mobileNativeService';

export function App() {
  const [project, setProject] = useState<Project>(() => {
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
      cloudSyncStatus: 'synced',
      cloudRevision: 1,
    };
  });

  const [activeTab, setActiveTab] = useState<MainNavTab>('home');
  const [skillMode, setSkillMode] = useState<UserSkillMode>('pro');
  const [favoriteToolIds, setFavoriteToolIds] = useState<string[]>([
    'tool_crop',
    'tool_exposure',
    'tool_hsl_mixer',
    'tool_ai_object_removal',
    'tool_ai_background_studio',
    'tool_skin_smoothing',
  ]);
  const [requestedEditorTool, setRequestedEditorTool] = useState<string | undefined>(undefined);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const layoutState = useAdaptiveLayout();

  // Modals & Popups State
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isFeatureExplorerOpen, setIsFeatureExplorerOpen] = useState(false);
  const [isAICreativeDirectorOpen, setIsAICreativeDirectorOpen] = useState(false);
  const [educationTool, setEducationTool] = useState<ToolDefinition | null>(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isSocialExportModalOpen, setIsSocialExportModalOpen] = useState(false);
  const [isCloudModalOpen, setIsCloudModalOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isCameraModalOpen, setIsCameraModalOpen] = useState(false);
  const [isCollaborationModalOpen, setIsCollaborationModalOpen] = useState(false);
  const [isClientReviewModeOpen, setIsClientReviewModeOpen] = useState(false);
  const [isVersionComparisonOpen, setIsVersionComparisonOpen] = useState(false);
  const [isPluginModalOpen, setIsPluginModalOpen] = useState(false);
  const [isAutomationModalOpen, setIsAutomationModalOpen] = useState(false);
  const [isDeveloperModalOpen, setIsDeveloperModalOpen] = useState(false);
  const [isSecurityModalOpen, setIsSecurityModalOpen] = useState(false);
  const [isVaultLocked, setIsVaultLocked] = useState(false);
  const [isPerformanceModalOpen, setIsPerformanceModalOpen] = useState(false);
  const [isGroqModalOpen, setIsGroqModalOpen] = useState(false);
  const [isWorkspaceCustomizerOpen, setIsWorkspaceCustomizerOpen] = useState(false);
  const [workspaceConfig, setWorkspaceConfig] = useState<WorkspaceConfig>(loadWorkspaceConfig);
  const [isUnsplashModalOpen, setIsUnsplashModalOpen] = useState(false);
  const [isCommentModeActive, setIsCommentModeActive] = useState(false);
  const [isVersionSnapshotsOpen, setIsVersionSnapshotsOpen] = useState(false);
  const [isStorageQuotaOpen, setIsStorageQuotaOpen] = useState(false);
  const [recoverableItems, setRecoverableItems] = useState<
    Array<{ snapshot: RecoverySnapshotRecord; existingProject: Project | null }>
  >([]);
  const [activeConflict, setActiveConflict] = useState<TabSyncMessage | null>(null);
  const [activeConflictReport, setActiveConflictReport] = useState<ProjectConflictReport | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [recentProjectsList, setRecentProjectsList] = useState<Project[]>([]);

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

  // Initialize active project in autosave engine & cloudSyncEngine
  useEffect(() => {
    autosaveEngine.setActiveProject(project);
    tabConflictManager.setLocalRevision(project.id, project.cloudRevision || 1);
    cloudSyncEngine.bindProject(project);
  }, [project.id]);

  // Check for crash recovery snapshots on startup
  useEffect(() => {
    checkForRecoverableProjects()
      .then((items) => {
        if (items.length > 0) {
          setRecoverableItems(items);
        }
      })
      .catch((err) => console.warn('Failed to check recovery snapshots:', err));
  }, []);

  // Multi-tab sync conflict listener
  useEffect(() => {
    const unsub = tabConflictManager.subscribe((msg) => {
      if (msg.projectId === project.id && msg.revision > (project.cloudRevision || 1)) {
        setActiveConflict(msg);
      }
    });
    return () => unsub();
  }, [project.id, project.cloudRevision]);

  // Subscribe to autosave error events
  useEffect(() => {
    const unsub = autosaveEngine.subscribeError((err) => {
      showToast('error', 'Autosave Failed', 'Storage quota or write lock error occurred.');
    });
    return () => unsub();
  }, [showToast]);

  // Safe project update wrapper that triggers debounced autosave
  const handleUpdateProject = useCallback((updated: Project | ((prev: Project) => Project)) => {
    setProject((prev) => {
      const next = typeof updated === 'function' ? updated(prev) : updated;
      autosaveEngine.markDirty(next);
      return next;
    });
  }, []);

  // Workflow Stage Switcher Handler
  const handleSelectStage = useCallback((stageId: WorkflowStageId) => {
    setWorkspaceConfig((prev) => {
      const updated = { ...prev, activeStage: stageId };
      saveWorkspaceConfig(updated);
      return updated;
    });

    if (stageId === 'library') {
      setActiveTab('library');
    } else if (stageId === 'export') {
      setIsExportModalOpen(true);
    } else {
      setActiveTab('editor');
    }
  }, []);

  // 1. Firebase Authentication Listener
  useEffect(() => {
    const unsub = subscribeToAuth((user) => {
      setCurrentUser(user);
    });
    return () => unsub();
  }, []);

  // 2. Deep-linking / URL Share Code Loader
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const shareCode = params.get('share');
    if (shareCode) {
      fetchSharedProjectByCode(shareCode).then((sharedProj) => {
        if (sharedProj) {
          setProject(sharedProj);
          setActiveTab('editor');
          showToast('success', 'Shared Project Loaded', `Imported "${sharedProj.name}" from Cloud link`);
        }
      });
    }
  }, [showToast]);

  // 3. Real-Time Cross-Device Sync Listener
  useEffect(() => {
    if (!project.id || !currentUser) return;

    const unsub = subscribeToLiveProjectSync(project.id, (remoteProj, revision, originDevice) => {
      if (revision > (project.cloudRevision || 0)) {
        setProject((prev) => ({
          ...prev,
          ...remoteProj,
          cloudRevision: revision,
          cloudSyncStatus: 'synced',
        }));
        showToast('info', 'Cloud Sync', `Updated to Rev #${revision} from ${originDevice || 'linked device'}`);
      }
    });

    return () => unsub();
  }, [project.id, currentUser, showToast]);

  // 4. Load projects from IndexedDB
  useEffect(() => {
    getAllProjectsFromDB().then((list) => {
      if (list && list.length > 0) {
        setRecentProjectsList(list);
      }
    });
  }, []);

  // 5. Mobile Native Platform Lifecycle & Hardware Back Button Handler
  useEffect(() => {
    mobileNative.initialize();

    const unreg = mobileNative.registerBackButtonHandler(() => {
      // Check if any modal is open and close the active modal first
      if (isExportModalOpen) { setIsExportModalOpen(false); return true; }
      if (isSocialExportModalOpen) { setIsSocialExportModalOpen(false); return true; }
      if (isCloudModalOpen) { setIsCloudModalOpen(false); return true; }
      if (isAICreativeDirectorOpen) { setIsAICreativeDirectorOpen(false); return true; }
      if (isFeatureExplorerOpen) { setIsFeatureExplorerOpen(false); return true; }
      if (isShortcutsOpen) { setIsShortcutsOpen(false); return true; }
      if (isCameraModalOpen) { setIsCameraModalOpen(false); return true; }
      if (isCollaborationModalOpen) { setIsCollaborationModalOpen(false); return true; }
      if (isVersionComparisonOpen) { setIsVersionComparisonOpen(false); return true; }
      if (isPluginModalOpen) { setIsPluginModalOpen(false); return true; }
      if (isAutomationModalOpen) { setIsAutomationModalOpen(false); return true; }
      if (isDeveloperModalOpen) { setIsDeveloperModalOpen(false); return true; }
      if (isSecurityModalOpen) { setIsSecurityModalOpen(false); return true; }
      if (isPerformanceModalOpen) { setIsPerformanceModalOpen(false); return true; }
      if (isGroqModalOpen) { setIsGroqModalOpen(false); return true; }
      if (isWorkspaceCustomizerOpen) { setIsWorkspaceCustomizerOpen(false); return true; }
      if (isUnsplashModalOpen) { setIsUnsplashModalOpen(false); return true; }
      if (isSearchOpen) { setIsSearchOpen(false); return true; }
      if (isVersionSnapshotsOpen) { setIsVersionSnapshotsOpen(false); return true; }
      if (isStorageQuotaOpen) { setIsStorageQuotaOpen(false); return true; }
      if (educationTool !== null) { setEducationTool(null); return true; }

      // If active tab is not 'home', go to 'home'
      if (activeTab !== 'home') {
        setActiveTab('home');
        return true;
      }

      return false; // Delegate to system minimize
    });

    const handleAppPause = () => {
      autosaveEngine.saveNow().catch(() => {});
    };

    window.addEventListener('lumina-app-pause', handleAppPause);

    return () => {
      unreg();
      window.removeEventListener('lumina-app-pause', handleAppPause);
    };
  }, [
    isExportModalOpen,
    isSocialExportModalOpen,
    isCloudModalOpen,
    isAICreativeDirectorOpen,
    isFeatureExplorerOpen,
    isShortcutsOpen,
    isCameraModalOpen,
    isCollaborationModalOpen,
    isVersionComparisonOpen,
    isPluginModalOpen,
    isAutomationModalOpen,
    isDeveloperModalOpen,
    isSecurityModalOpen,
    isPerformanceModalOpen,
    isGroqModalOpen,
    isWorkspaceCustomizerOpen,
    isUnsplashModalOpen,
    isSearchOpen,
    isVersionSnapshotsOpen,
    isStorageQuotaOpen,
    educationTool,
    activeTab,
  ]);

  // Undo / Redo logic
  const canUndo = (project.historyIndex ?? 0) > 0;
  const canRedo =
    project.history !== undefined &&
    project.historyIndex !== undefined &&
    project.historyIndex < project.history.length - 1;

  const handleUndo = useCallback(() => {
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
  }, [canUndo, project, showToast]);

  const handleRedo = useCallback(() => {
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
  }, [canRedo, project, showToast]);

  // Universal InputManager Shortcuts Integration
  useEffect(() => {
    const unreg = inputManager.registerBatch([
      {
        id: 'save_project',
        name: 'Save Project',
        category: 'File',
        defaultMac: 'Cmd+S',
        defaultWin: 'Ctrl+S',
        description: 'Save current project snapshot to local IndexedDB',
        action: () => {
          autosaveEngine.saveNow().then(() => {
            showToast('success', 'Project Saved', `Saved "${project.name}" safely to IndexedDB.`);
          });
        },
      },
      {
        id: 'export_image',
        name: 'Export Image',
        category: 'File',
        defaultMac: 'Cmd+E',
        defaultWin: 'Ctrl+E',
        description: 'Open master export modal',
        action: () => setIsExportModalOpen(true),
      },
      {
        id: 'undo_edit',
        name: 'Undo Edit',
        category: 'Edit',
        defaultMac: 'Cmd+Z',
        defaultWin: 'Ctrl+Z',
        description: 'Revert previous history snapshot',
        action: handleUndo,
      },
      {
        id: 'redo_edit',
        name: 'Redo Edit',
        category: 'Edit',
        defaultMac: 'Cmd+Shift+Z',
        defaultWin: 'Ctrl+Shift+Z',
        description: 'Restore undone history snapshot',
        action: handleRedo,
      },
      {
        id: 'command_palette',
        name: 'Command Palette',
        category: 'View',
        defaultMac: 'Cmd+K',
        defaultWin: 'Ctrl+K',
        description: 'Search tools, presets, and actions',
        action: () => setIsSearchOpen((prev) => !prev),
      },
      {
        id: 'shortcuts_help',
        name: 'Shortcuts Guide',
        category: 'Navigation',
        defaultMac: '?',
        defaultWin: '?',
        description: 'Open shortcuts guide dialog',
        action: () => setIsShortcutsOpen(true),
      },
      {
        id: 'diagnostics',
        name: 'Hardware Monitor',
        category: 'View',
        defaultMac: 'Cmd+P',
        defaultWin: 'Ctrl+P',
        description: 'View GPU and hardware diagnostics',
        action: () => setIsPerformanceModalOpen(true),
      },
    ]);
    return unreg;
  }, [project, handleUndo, handleRedo, showToast]);

  // Launch tool handler from Search or Feature Explorer
  const handleLaunchTool = (tool: ToolDefinition) => {
    if (tool.targetAction === 'open_export') {
      setIsExportModalOpen(true);
      return;
    }
    if (tool.targetAction === 'open_social_export') {
      setIsSocialExportModalOpen(true);
      return;
    }

    if (tool.targetTab) {
      setRequestedEditorTool(tool.targetTab);
      setActiveTab('editor');
      showToast('info', `Activated ${tool.name}`, `Opened in Editor studio panel.`);
    }
  };

  const handleApplyPresetById = (presetId: string, intensity: number = 100) => {
    const found = FILTER_PRESETS.find((p) => p.id === presetId);
    if (!found) return;

    setProject((prev) => ({
      ...prev,
      activePresetId: found.id,
      presetStrength: intensity,
      currentSettings: {
        ...prev.currentSettings,
        ...(found.settings || {}),
      },
      hsl: found.hsl ? { ...prev.hsl, ...found.hsl } : prev.hsl,
      toneCurves: found.toneCurves ? { ...prev.toneCurves, ...found.toneCurves } : prev.toneCurves,
      updatedAt: Date.now(),
    }));
    showToast('success', 'Preset Applied', `"${found.name}" active on canvas.`);
  };

  const handlePhotoCaptured = (captured: CapturedPhotoResult) => {
    const isRaw = captured.format === 'dng' || captured.format === 'raw';
    const newImage: ImageFile = {
      id: `img_cap_${Date.now()}`,
      name: `LUMINA_${isRaw ? 'RAW' : 'PHOTO'}_${new Date().toISOString().slice(0, 19).replace(/[-:T]/g, '')}.${captured.format}`,
      originalUrl: captured.imageUrl,
      width: captured.width,
      height: captured.height,
      format: captured.format,
      size: captured.sizeBytes,
      createdAt: Date.now(),
      rawMetadata: {
        isRaw,
        cameraMake: captured.metadata.cameraMake,
        cameraModel: captured.metadata.cameraModel,
        lens: captured.metadata.lens,
        iso: captured.metadata.iso,
        shutterSpeed: captured.metadata.shutterSpeed,
        aperture: captured.metadata.aperture,
        focalLength: captured.metadata.focalLength,
        wbKelvin: captured.metadata.whiteBalanceKelvin,
        exposureBias: captured.metadata.exposureBias,
        colorSpace: captured.metadata.colorSpace,
        bitDepth: captured.metadata.bitDepth,
        bayerPattern: captured.metadata.bayerPattern,
        dateShot: new Date().toLocaleDateString(),
        timeShot: new Date().toLocaleTimeString(),
      },
    };

    const newProject: Project = {
      ...DEFAULT_PROJECT_STATE,
      id: `proj_cap_${Date.now()}`,
      name: newImage.name,
      image: newImage,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      history: [
        {
          id: 'step_0',
          timestamp: Date.now(),
          label: isRaw ? 'RAW Sensor Capture' : 'Camera Photo Capture',
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
      cloudSyncStatus: 'synced',
      cloudRevision: 1,
    };

    setProject(newProject);
    saveProjectToDB(newProject).catch(() => {});
    setActiveTab('editor');
    showToast('success', 'RAW Capture Developed', `Opened in Lumina Studio Editor`);
  };

  const handleToggleFavorite = (toolId: string) => {
    setFavoriteToolIds((prev) =>
      prev.includes(toolId) ? prev.filter((id) => id !== toolId) : [...prev, toolId]
    );
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#000000] text-white overflow-hidden font-sans select-none pb-12 lg:pb-0">
      {/* 0. TOP DESKTOP MENU BAR (When on Desktop or Tablet) */}
      {layoutState.mode !== 'MOBILE' && (
        <DesktopMenuBar
          activeTab={activeTab}
          onSelectTab={(tab) => {
            if (tab === 'photo') {
              setActiveTab('editor');
            } else {
              setActiveTab(tab);
            }
          }}
          project={project}
          onNewProject={() => {
            const sample = SAMPLE_IMAGES[Math.floor(Math.random() * SAMPLE_IMAGES.length)];
            const imgFile = createSampleImageFile(sample);
            const newP: Project = {
              ...DEFAULT_PROJECT_STATE,
              id: `proj_${Date.now()}`,
              name: sample.name,
              image: imgFile,
            };
            setProject(newP);
            setActiveTab('editor');
            showToast('success', 'New Canvas Created', 'Ready for editing.');
          }}
          onOpenRaw={() => setIsCameraModalOpen(true)}
          onSaveProject={() => {
            autosaveEngine.saveNow().then(() => {
              showToast('success', 'Project Saved', `Saved "${project.name}" safely to IndexedDB.`);
            });
          }}
          onExportProject={() => setIsExportModalOpen(true)}
          onUndo={handleUndo}
          onRedo={handleRedo}
          canUndo={canUndo}
          canRedo={canRedo}
          onOpenSearch={() => setIsSearchOpen(true)}
          onOpenAICreativeDirector={() => setIsAICreativeDirectorOpen(true)}
          onOpenFeatureExplorer={() => setIsFeatureExplorerOpen(true)}
          onOpenDiagnostics={() => setIsPerformanceModalOpen(true)}
          onOpenSettings={() => setActiveTab('settings')}
          onOpenShortcuts={() => setIsShortcutsOpen(true)}
          onToggleFullscreen={() => {
            if (!document.fullscreenElement) {
              document.documentElement.requestFullscreen().catch(() => {});
            } else {
              document.exitFullscreen().catch(() => {});
            }
          }}
          onAutoEnhance={() => {
            setProject((prev) => ({
              ...prev,
              currentSettings: {
                ...prev.currentSettings,
                exposure: 0.15,
                contrast: 12,
                highlights: -15,
                shadows: 20,
                vibrance: 14,
                clarity: 10,
              },
              updatedAt: Date.now(),
            }));
            showToast('success', 'Auto Enhanced', 'Intelligent dynamic range balance applied.');
          }}
          onResetAdjustments={() => {
            setProject((prev) => ({
              ...prev,
              currentSettings: { ...DEFAULT_PROJECT_STATE.currentSettings },
              toneCurves: { ...DEFAULT_PROJECT_STATE.toneCurves },
              hsl: { ...DEFAULT_PROJECT_STATE.hsl },
              updatedAt: Date.now(),
            }));
            showToast('info', 'Adjustments Reset', 'Canvas parameters restored to defaults.');
          }}
          onOpenCloudHub={() => setIsCloudModalOpen(true)}
          onOpenCollaboration={() => setIsCollaborationModalOpen(true)}
        />
      )}

      {/* MAIN CONTAINER WITH SIDEBAR */}
      <div className="flex-1 flex overflow-hidden">
        {/* 1. PERSISTENT DESKTOP PRO SIDEBAR NAVIGATION */}
        <ProSidebarNav
          activeTab={activeTab}
          onSelectTab={(tab) => {
            if (tab === 'photo') {
              setActiveTab('editor');
            } else {
              setActiveTab(tab);
            }
          }}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed((prev) => !prev)}
          onOpenSearch={() => setIsSearchOpen(true)}
          onNewProject={() => {
            const sample = SAMPLE_IMAGES[Math.floor(Math.random() * SAMPLE_IMAGES.length)];
            const imgFile = createSampleImageFile(sample);
            const newP: Project = {
              ...DEFAULT_PROJECT_STATE,
              id: `proj_${Date.now()}`,
              name: sample.name,
              image: imgFile,
            };
            setProject(newP);
            setActiveTab('editor');
            showToast('success', 'New Canvas Created', 'Ready for editing.');
          }}
          onImportRaw={() => setIsCameraModalOpen(true)}
        />

        {/* 2. MAIN APPLICATION CONTENT AREA */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#000000]">
          {/* OPTIONAL WORKFLOW STAGE BAR (Shown when in editor mode) */}
          {activeTab === 'editor' && (
            <WorkflowStageBar
              config={workspaceConfig}
              onSelectStage={handleSelectStage}
              onOpenCustomizer={() => setIsWorkspaceCustomizerOpen(true)}
            />
          )}

          {/* WORKSPACE VIEWPORTS */}
          <main className="flex-1 flex overflow-hidden relative">
          {activeTab === 'home' && (
            <HomeDashboard
              onNavigateTab={(tab) => setActiveTab(tab)}
              onOpenProject={(proj) => {
                setProject(proj);
                setActiveTab('editor');
                showToast('success', 'Project Resumed', `Opened "${proj.name}".`);
              }}
              onNewEdit={() => {
                const sample = SAMPLE_IMAGES[Math.floor(Math.random() * SAMPLE_IMAGES.length)];
                const imgFile = createSampleImageFile(sample);
                const newP: Project = {
                  ...DEFAULT_PROJECT_STATE,
                  id: `proj_${Date.now()}`,
                  name: sample.name,
                  image: imgFile,
                };
                setProject(newP);
                setActiveTab('editor');
                showToast('success', 'New Canvas Created', 'Ready for editing.');
              }}
              onImportRaw={() => setIsCameraModalOpen(true)}
              onOpenAIStudio={() => setActiveTab('aistudio')}
              onOpenDesignStudio={() => setActiveTab('design')}
              onOpenCollage={() => setActiveTab('collage')}
              onOpenPresets={() => setActiveTab('presets')}
              onOpenBatch={() => setActiveTab('assets')}
              onOpenCameraStudio={() => setIsCameraModalOpen(true)}
              onOpenFeatureExplorer={() => setIsFeatureExplorerOpen(true)}
              onOpenAICreativeDirector={() => setIsAICreativeDirectorOpen(true)}
              onApplyPreset={(id) => handleApplyPresetById(id)}
              onLaunchToolById={(toolId) => {
                const t = MASTER_TOOLS_LIST.find((x) => x.id === toolId);
                if (t) handleLaunchTool(t);
              }}
              recentProjects={recentProjectsList}
              currentProject={project}
            />
          )}

          {activeTab === 'projects' && (
            <ProjectsView
              currentProject={project}
              onOpenProject={(proj) => {
                setProject(proj);
                setActiveTab('editor');
                showToast('success', 'Project Opened', `Resumed editing "${proj.name}".`);
              }}
              onNewProject={() => {
                const sample = SAMPLE_IMAGES[0];
                const imgFile = createSampleImageFile(sample);
                const newP: Project = {
                  ...DEFAULT_PROJECT_STATE,
                  id: `proj_${Date.now()}`,
                  name: 'New Master Project',
                  image: imgFile,
                };
                setProject(newP);
                setActiveTab('editor');
                showToast('success', 'New Project Created', 'Blank canvas ready.');
              }}
              showToast={showToast}
            />
          )}

          {(activeTab === 'editor' || activeTab === 'photo') && (
            <Editor
              project={project}
              onUpdateProject={handleUpdateProject}
              onOpenSampleGallery={() => setActiveTab('home')}
              showToast={showToast}
              onOpenExportModal={() => setIsExportModalOpen(true)}
              currentUser={currentUser}
              activeStage={workspaceConfig.activeStage}
              requestedToolTab={requestedEditorTool}
              skillMode={skillMode}
              onOpenToolEducation={(toolId) => {
                const t = MASTER_TOOLS_LIST.find((x) => x.id === toolId || x.targetTab === toolId);
                if (t) setEducationTool(t);
              }}
              onOpenCollaborationModal={() => setIsCollaborationModalOpen(true)}
              onOpenVersionComparison={() => setIsVersionComparisonOpen(true)}
              onOpenClientReview={() => setIsClientReviewModeOpen(true)}
              onOpenPluginModal={() => setIsPluginModalOpen(true)}
              onOpenAutomationStudio={() => setIsAutomationModalOpen(true)}
              onOpenDeveloperPlatform={() => setIsDeveloperModalOpen(true)}
              onOpenSecurityGovernance={() => setIsSecurityModalOpen(true)}
              onOpenPerformanceModal={() => setIsPerformanceModalOpen(true)}
              onOpenUnsplashModal={() => setIsUnsplashModalOpen(true)}
              isCommentModeActive={isCommentModeActive}
              onToggleCommentMode={() => setIsCommentModeActive((prev) => !prev)}
            />
          )}

          {activeTab === 'design' && (
            <DesignStudioView
              project={project}
              onOpenEditorWithTool={(toolId) => {
                const t = MASTER_TOOLS_LIST.find((x) => x.id === toolId);
                if (t) handleLaunchTool(t);
              }}
              onOpenCollage={() => setActiveTab('collage')}
              showToast={showToast}
            />
          )}

          {activeTab === 'collage' && (
            <CollageStudioView
              project={project}
              onApplyCollage={(resultDataUrl, name) => {
                const img = new Image();
                img.src = resultDataUrl;
                img.onload = () => {
                  setProject((prev) => ({
                    ...prev,
                    name: name,
                    image: {
                      ...prev.image,
                      name: `${name}.png`,
                      originalUrl: resultDataUrl,
                      width: img.naturalWidth || 2000,
                      height: img.naturalHeight || 2000,
                    },
                  }));
                  setActiveTab('editor');
                };
              }}
              onOpenEditor={() => setActiveTab('editor')}
              showToast={showToast}
            />
          )}

          {(activeTab === 'aistudio' || activeTab === 'ai') && (
            <AIStudioMasterView
              project={project}
              onOpenEditorWithTool={(toolId) => {
                const t = MASTER_TOOLS_LIST.find((x) => x.id === toolId);
                if (t) handleLaunchTool(t);
              }}
              onOpenAICreativeDirector={() => setIsAICreativeDirectorOpen(true)}
              onOpenGroqSettings={() => setIsGroqModalOpen(true)}
              showToast={showToast}
            />
          )}

          {(activeTab === 'library' || activeTab === 'assets') && (
            <AssetsLibraryView
              currentProject={project}
              onOpenProjectWithImage={(imageUrl, name, isRaw) => {
                const img = new Image();
                img.src = imageUrl;
                img.onload = () => {
                  const newProj: Project = {
                    ...DEFAULT_PROJECT_STATE,
                    id: `proj_${Date.now()}`,
                    name: name,
                    image: {
                      id: `img_${Date.now()}`,
                      name: name,
                      originalUrl: imageUrl,
                      width: img.naturalWidth || 3840,
                      height: img.naturalHeight || 2160,
                      size: 15000000,
                      format: isRaw ? 'dng' : 'jpeg',
                      createdAt: Date.now(),
                      rawMetadata: isRaw
                        ? {
                            isRaw: true,
                            cameraMake: 'Sony',
                            cameraModel: 'Alpha 7R V',
                            iso: 100,
                            shutterSpeed: '1/250s',
                            aperture: 'f/2.8',
                            focalLength: '35mm',
                            colorSpace: 'Display P3',
                            bayerPattern: 'RGGB',
                            bitDepth: 14,
                            decoderEngine: 'Adaptive Homogeneity-Directed (AHD)',
                          }
                        : undefined,
                    },
                  };
                  setProject(newProj);
                  setActiveTab('editor');
                };
              }}
              showToast={showToast}
            />
          )}

          {activeTab === 'presets' && (
            <PresetsShowcaseView
              onApplyPreset={(id, intensity) => handleApplyPresetById(id, intensity)}
              onOpenEditor={() => setActiveTab('editor')}
              showToast={showToast}
            />
          )}

          {activeTab === 'export' && (
            <ExportWorkspaceView
              project={project}
              onExportMaster={() => setIsExportModalOpen(true)}
              showToast={showToast}
            />
          )}

          {(activeTab === 'cloud' || activeTab === 'collaboration') && (
            <CloudWorkspaceView
              project={project}
              onOpenCollaborationModal={() => setIsCollaborationModalOpen(true)}
              showToast={showToast}
            />
          )}

          {activeTab === 'system' && (
            <SystemWorkspaceView showToast={showToast} />
          )}

          {activeTab === 'settings' && (
            <UniversalSettingsView
              onClose={() => setActiveTab('editor')}
              showToast={showToast}
            />
          )}
        </main>
      </div>
      </div>

      {/* 4. GLOBAL COMMAND PALETTE (Ctrl+K) */}
      <GlobalCommandPalette
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onLaunchTool={handleLaunchTool}
        onApplyPreset={(presetId) => handleApplyPresetById(presetId)}
        onOpenProject={(proj) => {
          setProject(proj);
          setActiveTab('editor');
        }}
        onOpenExport={() => setIsExportModalOpen(true)}
        onOpenSocialExport={() => setIsSocialExportModalOpen(true)}
        onOpenCloud={() => setIsCloudModalOpen(true)}
        onOpenGroqSettings={() => setIsGroqModalOpen(true)}
        recentProjects={recentProjectsList}
      />

      {/* 5. ALL TOOLS / FEATURE EXPLORER MODAL (Shift+T) */}
      <FeatureExplorerModal
        isOpen={isFeatureExplorerOpen}
        onClose={() => setIsFeatureExplorerOpen(false)}
        skillMode={skillMode}
        onToggleSkillMode={() => setSkillMode((prev) => (prev === 'pro' ? 'beginner' : 'pro'))}
        favorites={favoriteToolIds}
        onToggleFavorite={handleToggleFavorite}
        onLaunchTool={handleLaunchTool}
        onOpenEducation={(tool) => setEducationTool(tool)}
      />

      {/* 6. AI CREATIVE DIRECTOR MODAL (Ctrl+Space) */}
      <AICreativeDirectorModal
        isOpen={isAICreativeDirectorOpen}
        onClose={() => setIsAICreativeDirectorOpen(false)}
        project={project}
        onApplyPlan={() => {
          showToast('success', 'AI Plan Applied', 'Autonomous non-destructive layers compiled.');
        }}
        showToast={showToast}
      />

      {/* 7. TOOL EDUCATION & MASTERY GUIDE MODAL */}
      <ToolEducationModal
        tool={educationTool}
        isOpen={Boolean(educationTool)}
        onClose={() => setEducationTool(null)}
        onLaunchTool={(tool) => {
          handleLaunchTool(tool);
          setEducationTool(null);
        }}
      />

      {/* 8. EXPORT & UTILITY MODALS */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        project={project}
        showToast={showToast}
      />

      <SocialMediaExportModal
        isOpen={isSocialExportModalOpen}
        onClose={() => setIsSocialExportModalOpen(false)}
        project={project}
        showToast={showToast}
      />

      <CloudHubModal
        isOpen={isCloudModalOpen}
        onClose={() => setIsCloudModalOpen(false)}
        currentUser={currentUser}
        currentProject={project}
        onLoadProject={(loaded) => {
          setProject(loaded);
          setActiveTab('editor');
          showToast('success', 'Project Loaded', `Opened "${loaded.name}"`);
        }}
        onApplySnapshot={(snap) => {
          setProject((prev) => ({
            ...prev,
            currentSettings: { ...snap.settings },
            toneCurves: { ...snap.toneCurves },
            hsl: { ...snap.hsl },
            crop: { ...snap.crop },
          }));
        }}
        onImportPreset={(preset) => handleApplyPresetById(preset.id)}
        showToast={showToast}
      />

      <CameraStudioModal
        isOpen={isCameraModalOpen}
        onClose={() => setIsCameraModalOpen(false)}
        onPhotoCaptured={handlePhotoCaptured}
        showToast={showToast}
      />

      <CollaborationModal
        isOpen={isCollaborationModalOpen}
        onClose={() => setIsCollaborationModalOpen(false)}
        project={project}
        currentUser={currentUser}
        onOpenVersionComparison={() => setIsVersionComparisonOpen(true)}
        onOpenClientReview={() => setIsClientReviewModeOpen(true)}
        showToast={showToast}
      />

      <ClientReviewMode
        isOpen={isClientReviewModeOpen}
        onClose={() => setIsClientReviewModeOpen(false)}
        project={project}
        currentUser={currentUser}
        showToast={showToast}
      />

      <VersionComparisonModal
        isOpen={isVersionComparisonOpen}
        onClose={() => setIsVersionComparisonOpen(false)}
        project={project}
        onRestoreSnapshot={() => {}}
        showToast={showToast}
      />

      <PluginPlatformModal
        isOpen={isPluginModalOpen}
        onClose={() => setIsPluginModalOpen(false)}
        project={project}
        currentUser={currentUser}
        onApplyProjectSettings={(newSettings) => {
          setProject((prev) => ({
            ...prev,
            currentSettings: { ...prev.currentSettings, ...newSettings },
          }));
        }}
        onOpenUnsplashModal={() => {
          setIsPluginModalOpen(false);
          setIsUnsplashModalOpen(true);
        }}
        showToast={showToast}
      />

      <AutomationStudioModal
        isOpen={isAutomationModalOpen}
        onClose={() => setIsAutomationModalOpen(false)}
        project={project}
        onApplyToCanvas={(canvas, workflowName) => {
          const dataUrl = canvas.toDataURL('image/png');
          setProject((prev) => ({
            ...prev,
            image: {
              ...prev.image,
              originalUrl: dataUrl,
              width: canvas.width,
              height: canvas.height,
            },
          }));
          showToast('success', 'Automation Rendered', `Applied "${workflowName}"`);
        }}
        showToast={showToast}
      />

      <DeveloperPlatformModal
        isOpen={isDeveloperModalOpen}
        onClose={() => setIsDeveloperModalOpen(false)}
        project={project}
        currentUser={currentUser}
        showToast={showToast}
      />

      <SecurityPrivacyModal
        isOpen={isSecurityModalOpen}
        onClose={() => setIsSecurityModalOpen(false)}
        project={project}
        onUpdateProject={setProject}
        showToast={showToast}
      />

      <VaultLockOverlay
        isLocked={isVaultLocked}
        onUnlock={() => setIsVaultLocked(false)}
        showToast={showToast}
      />

      <PerformanceMonitorModal
        isOpen={isPerformanceModalOpen}
        onClose={() => setIsPerformanceModalOpen(false)}
        project={project}
        showToast={showToast}
      />

      <GroqSettingsModal
        isOpen={isGroqModalOpen}
        onClose={() => setIsGroqModalOpen(false)}
        showToast={showToast}
      />

      <UnsplashBrowserModal
        isOpen={isUnsplashModalOpen}
        onClose={() => setIsUnsplashModalOpen(false)}
        onSelectPhoto={(imageDataUrl, title) => {
          const img = new Image();
          img.src = imageDataUrl;
          img.onload = () => {
            setProject((prev) => ({
              ...prev,
              name: title,
              image: {
                ...prev.image,
                name: `${title}.jpg`,
                originalUrl: imageDataUrl,
                width: img.naturalWidth || 2000,
                height: img.naturalHeight || 1333,
              },
            }));
          };
        }}
        showToast={showToast}
      />

      <WorkspaceCustomizerModal
        isOpen={isWorkspaceCustomizerOpen}
        onClose={() => setIsWorkspaceCustomizerOpen(false)}
        config={workspaceConfig}
        onUpdateConfig={setWorkspaceConfig}
        showToast={showToast}
      />

      <ShortcutModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      {/* PHASE 4: PERSISTENCE & CRASH RECOVERY MODALS */}
      {recoverableItems.length > 0 && (
        <CrashRecoveryModal
          recoverableItems={recoverableItems}
          onRecover={(restored) => {
            setProject(restored);
            setRecoverableItems([]);
            setActiveTab('editor');
            showToast('success', 'Recovery Complete', `Restored "${restored.name}"`);
          }}
          onDismiss={() => setRecoverableItems([])}
        />
      )}

      {activeConflict && (
        <TabConflictBanner
          conflict={activeConflict}
          onReload={() => {
            getAllProjectsFromDB().then((list) => {
              const fresh = list.find((p) => p.id === activeConflict.projectId);
              if (fresh) {
                setProject(fresh);
                autosaveEngine.setActiveProject(fresh);
                setActiveConflict(null);
                showToast('success', 'Project Reloaded', 'Synchronized with external tab.');
              }
            });
          }}
          onFork={() => {
            const forked: Project = {
              ...project,
              id: `proj_${Date.now()}_fork`,
              name: `${project.name} (Forked Copy)`,
              updatedAt: Date.now(),
            };
            setProject(forked);
            autosaveEngine.setActiveProject(forked);
            setActiveConflict(null);
            showToast('info', 'Project Forked', 'Saved editing session as a new project.');
          }}
          onDismiss={() => setActiveConflict(null)}
        />
      )}

      {isVersionSnapshotsOpen && (
        <VersionSnapshotsModal
          project={project}
          onUpdateProject={handleUpdateProject}
          onClose={() => setIsVersionSnapshotsOpen(false)}
          showToast={showToast}
        />
      )}

      {isStorageQuotaOpen && (
        <StorageQuotaModal
          onClose={() => setIsStorageQuotaOpen(false)}
          showToast={showToast}
        />
      )}

      {/* PHASE 6: CLOUD CONFLICT RESOLUTION MODAL */}
      <CloudConflictModal
        isOpen={!!activeConflictReport}
        conflictReport={activeConflictReport}
        onClose={() => setActiveConflictReport(null)}
        onResolved={(resolvedProject) => {
          setProject(resolvedProject);
          setActiveConflictReport(null);
        }}
        showToast={showToast}
      />

      {/* Phase 13B: Mobile Optimized Bottom Navigation */}
      <MobileBottomNav
        activeTab={activeTab}
        onSelectTab={(tab) => {
          if (tab === 'cloud') {
            setIsCloudModalOpen(true);
          } else {
            setActiveTab(tab);
          }
        }}
        onOpenFeatureExplorer={() => setIsFeatureExplorerOpen(true)}
        onNewEdit={() => {
          const sample = SAMPLE_IMAGES[Math.floor(Math.random() * SAMPLE_IMAGES.length)];
          const imgFile = createSampleImageFile(sample);
          const newP: Project = {
            ...DEFAULT_PROJECT_STATE,
            id: `proj_${Date.now()}`,
            name: sample.name,
            image: imgFile,
          };
          setProject(newP);
          setActiveTab('editor');
          showToast('success', 'New Canvas Created', 'Ready for editing.');
        }}
      />

      {/* Toast Notification Container */}
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}

export default App;
