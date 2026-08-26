import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  increment,
  writeBatch,
} from 'firebase/firestore';
import {
  signInWithPopup,
  signInWithRedirect,
  signOut,
  onAuthStateChanged,
  User,
} from 'firebase/auth';
import { db, auth, googleProvider } from './firebase';
import {
  CloudUser,
  CloudProjectRecord,
  CloudVersionSnapshot,
  CloudPresetRecord,
  CloudRenderJob,
  CloudSyncTelemetry,
} from '../types/cloud';
import { Project, FilterPreset, EditHistorySnapshot } from '../types/editor';

// Device fingerprint generator for cross-device telemetry
export const getDeviceId = (): string => {
  let devId = localStorage.getItem('lumina_device_id');
  if (!devId) {
    devId = `dev_${Math.random().toString(36).slice(2, 9)}_${Date.now().toString(36)}`;
    localStorage.setItem('lumina_device_id', devId);
  }
  return devId;
};

export const getDeviceType = (): 'desktop' | 'mobile' | 'tablet' => {
  const ua = navigator.userAgent.toLowerCase();
  if (/mobile|android|iphone|ipod/i.test(ua)) return 'mobile';
  if (/ipad|tablet/i.test(ua)) return 'tablet';
  return 'desktop';
};

/* ----------------------------------------------------------------------------
 * 1. AUTHENTICATION & USER PROFILE
 * ---------------------------------------------------------------------------- */

export const subscribeToAuth = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

export const signInWithGoogle = async (): Promise<User> => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    await syncUserProfile(result.user);
    return result.user;
  } catch (error: any) {
    console.warn('Popup sign in failed, falling back to redirect:', error);
    try {
      await signInWithRedirect(auth, googleProvider);
      throw new Error('Redirecting to Google Sign-In...');
    } catch (e: any) {
      throw new Error(error.message || 'Google Sign-In failed');
    }
  }
};

export const logOutCloud = async (): Promise<void> => {
  await signOut(auth);
};

export const syncUserProfile = async (user: User): Promise<CloudUser> => {
  const userRef = doc(db, 'users', user.uid);
  const snap = await getDoc(userRef);

  if (snap.exists()) {
    const data = snap.data() as CloudUser;
    await setDoc(userRef, { lastActive: Date.now() }, { merge: true });
    return data;
  }

  const newProfile: CloudUser = {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName || 'Lumina Creator',
    photoURL: user.photoURL,
    tier: 'Pro Studio',
    storageUsedBytes: 15420000, // 15.4 MB initial
    storageQuotaBytes: 10737418240, // 10 GB
    createdAt: Date.now(),
    lastActive: Date.now(),
  };

  await setDoc(userRef, newProfile);
  return newProfile;
};

/* ----------------------------------------------------------------------------
 * 2. CLOUD PROJECT BACKUP & LIVE CROSS-DEVICE EDIT SYNC
 * ---------------------------------------------------------------------------- */

export const saveProjectToCloud = async (
  project: Project,
  user: User,
  isPublic = false
): Promise<string> => {
  const deviceId = getDeviceId();
  const projRef = doc(db, 'projects', project.id);
  const snap = await getDoc(projRef);
  const currentRevision = snap.exists() ? ((snap.data()?.revision || 0) + 1) : 1;

  // Clean data for Firestore serialization
  const cleanProject: Project = {
    ...project,
    cloudSyncStatus: 'synced',
    cloudRevision: currentRevision,
  };

  const record: CloudProjectRecord = {
    id: project.id,
    ownerId: user.uid,
    ownerEmail: user.email || undefined,
    name: project.name,
    createdAt: project.createdAt || Date.now(),
    updatedAt: Date.now(),
    revision: currentRevision,
    isPublic,
    shareCode: project.id.slice(0, 8),
    collaborators: [user.uid],
    thumbnailUrl: project.thumbnailUrl || project.image.originalUrl,
    projectData: cleanProject,
    deviceOrigin: `${getDeviceType().toUpperCase()} • ${navigator.userAgent.includes('Chrome') ? 'Chrome' : 'Browser'}`,
  };

  await setDoc(projRef, record, { merge: true });

  // Automatically save version snapshot if revision is meaningful
  if (currentRevision % 2 === 1) {
    await saveVersionSnapshot(project, user, `Cloud Auto-Sync Rev ${currentRevision}`);
  }

  return project.id;
};

export const loadProjectFromCloud = async (projectId: string): Promise<CloudProjectRecord | null> => {
  const projRef = doc(db, 'projects', projectId);
  const snap = await getDoc(projRef);
  if (!snap.exists()) return null;
  return snap.data() as CloudProjectRecord;
};

export const deleteProjectFromCloud = async (projectId: string): Promise<void> => {
  const projRef = doc(db, 'projects', projectId);
  await deleteDoc(projRef);
};

export const subscribeToUserProjects = (
  userId: string,
  callback: (projects: CloudProjectRecord[]) => void
) => {
  const q = query(
    collection(db, 'projects'),
    where('ownerId', '==', userId),
    orderBy('updatedAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const list: CloudProjectRecord[] = [];
    snapshot.forEach((d) => list.push(d.data() as CloudProjectRecord));
    callback(list);
  }, (err) => {
    console.warn('Projects snapshot listener error:', err.message);
  });
};

export const subscribeToLiveProjectSync = (
  projectId: string,
  onRemoteUpdate: (remoteProj: Project, revision: number, originDevice?: string) => void
) => {
  const projRef = doc(db, 'projects', projectId);
  return onSnapshot(projRef, (snap) => {
    if (snap.exists()) {
      const data = snap.data() as CloudProjectRecord;
      onRemoteUpdate(data.projectData, data.revision, data.deviceOrigin);
    }
  });
};

/* ----------------------------------------------------------------------------
 * 3. VERSION HISTORY & REVISION RECOVERY
 * ---------------------------------------------------------------------------- */

export const saveVersionSnapshot = async (
  project: Project,
  user: User,
  label: string
): Promise<string> => {
  const versionId = `ver_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const verRef = doc(db, 'projects', project.id, 'versions', versionId);

  const currentSnapshot: EditHistorySnapshot = project.history[project.historyIndex] || {
    id: `snap_${Date.now()}`,
    timestamp: Date.now(),
    label,
    settings: project.currentSettings,
    crop: project.crop,
    toneCurves: project.toneCurves,
    hsl: project.hsl,
    activePresetId: project.activePresetId,
    presetStrength: project.presetStrength,
    watermark: project.watermark,
    border: project.border,
    masks: project.masks,
    layers: project.layers,
    typography: project.typography,
    designElements: project.designElements,
    retouchStrokes: project.retouchStrokes,
    colorManagement: project.colorManagement,
  };

  const record: CloudVersionSnapshot = {
    id: versionId,
    projectId: project.id,
    versionNumber: project.history.length,
    label,
    authorId: user.uid,
    authorName: user.displayName || 'Creator',
    timestamp: Date.now(),
    thumbnailUrl: project.thumbnailUrl || project.image.originalUrl,
    snapshot: currentSnapshot,
  };

  await setDoc(verRef, record);
  return versionId;
};

export const listProjectVersions = async (projectId: string): Promise<CloudVersionSnapshot[]> => {
  const versCol = collection(db, 'projects', projectId, 'versions');
  const q = query(versCol, orderBy('timestamp', 'desc'));
  const snap = await getDocs(q);
  const list: CloudVersionSnapshot[] = [];
  snap.forEach((d) => list.push(d.data() as CloudVersionSnapshot));
  return list;
};

/* ----------------------------------------------------------------------------
 * 4. PRESET SYNCHRONIZATION & COMMUNITY MARKETPLACE
 * ---------------------------------------------------------------------------- */

export const syncPresetToCloud = async (
  preset: FilterPreset,
  user: User,
  isPublic = true
): Promise<string> => {
  const presetRef = doc(db, 'presets', preset.id);
  const record: CloudPresetRecord = {
    id: preset.id,
    ownerId: user.uid,
    ownerName: user.displayName || 'Lumina Artist',
    preset,
    isPublic,
    downloadsCount: preset.downloadsCount || 1,
    likesCount: preset.likesCount || 0,
    tags: preset.tags || ['creative', 'color-grading'],
    createdAt: preset.createdAt || Date.now(),
    updatedAt: Date.now(),
  };

  await setDoc(presetRef, record, { merge: true });
  return preset.id;
};

export const subscribeToCloudPresets = (
  callback: (presets: CloudPresetRecord[]) => void
) => {
  const q = query(
    collection(db, 'presets'),
    where('isPublic', '==', true),
    orderBy('downloadsCount', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const list: CloudPresetRecord[] = [];
    snapshot.forEach((d) => list.push(d.data() as CloudPresetRecord));
    callback(list);
  });
};

/* ----------------------------------------------------------------------------
 * 5. CLOUD RENDERING & HIGH-POWER GPU EXPORT QUEUE
 * ---------------------------------------------------------------------------- */

export const submitCloudRenderJob = async (
  project: Project,
  user: User,
  format: 'png' | 'jpeg' | 'webp' | 'tiff' | 'dng' | 'pdf' | 'psd',
  resolutionScale = 2.0, // e.g. 2x, 4x Master Upscale
  colorSpace: 'sRGB' | 'Display P3' | 'Adobe RGB' | 'ProPhoto RGB' = 'Display P3',
  bitDepth: '8-bit' | '16-bit' | '32-bit Float' = '16-bit'
): Promise<CloudRenderJob> => {
  const jobId = `job_gpu_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  const jobRef = doc(db, 'render_jobs', jobId);

  const targetWidth = Math.round(project.image.width * resolutionScale);
  const targetHeight = Math.round(project.image.height * resolutionScale);

  const newJob: CloudRenderJob = {
    id: jobId,
    projectId: project.id,
    userId: user.uid,
    projectName: project.name,
    outputFormat: format,
    resolution: {
      width: targetWidth,
      height: targetHeight,
      scale: resolutionScale,
    },
    quality: 1.0,
    colorSpace,
    bitDepth,
    status: 'processing',
    progress: 10,
    createdAt: Date.now(),
    renderEngine: 'Cloud-Neural-HDR-GPU',
  };

  await setDoc(jobRef, newJob);

  // Simulate High-Performance GPU Rendering Node Pipeline
  setTimeout(async () => {
    await setDoc(jobRef, { progress: 45 }, { merge: true });
  }, 1000);

  setTimeout(async () => {
    await setDoc(jobRef, { progress: 85 }, { merge: true });
  }, 2200);

  setTimeout(async () => {
    await setDoc(
      jobRef,
      {
        progress: 100,
        status: 'completed',
        completedAt: Date.now(),
        downloadUrl: project.image.originalUrl,
        fileSizeBytes: Math.round(project.image.size * resolutionScale * 1.8),
      },
      { merge: true }
    );
  }, 3500);

  return newJob;
};

export const subscribeToUserRenderJobs = (
  userId: string,
  callback: (jobs: CloudRenderJob[]) => void
) => {
  const q = query(
    collection(db, 'render_jobs'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const list: CloudRenderJob[] = [];
    snapshot.forEach((d) => list.push(d.data() as CloudRenderJob));
    callback(list);
  });
};

/* ----------------------------------------------------------------------------
 * 6. SHAREABLE PROJECT LINKS & COLLABORATIVE VIEW
 * ---------------------------------------------------------------------------- */

export const generateShareableLink = async (
  project: Project,
  user: User
): Promise<{ shareUrl: string; shareCode: string }> => {
  const shareCode = project.id.slice(0, 8);
  const shareRef = doc(db, 'shared_projects', shareCode);

  await setDoc(shareRef, {
    shareCode,
    projectId: project.id,
    ownerId: user.uid,
    ownerName: user.displayName || 'Lumina Creator',
    projectName: project.name,
    projectData: project,
    createdAt: Date.now(),
    viewsCount: increment(1),
  });

  const baseUrl = window.location.origin;
  const shareUrl = `${baseUrl}?share=${shareCode}`;

  return { shareUrl, shareCode };
};

export const fetchSharedProjectByCode = async (shareCode: string): Promise<Project | null> => {
  const shareRef = doc(db, 'shared_projects', shareCode);
  const snap = await getDoc(shareRef);
  if (!snap.exists()) return null;
  return snap.data()?.projectData as Project;
};
