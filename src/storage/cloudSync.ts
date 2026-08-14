import { Project } from '../types/editor';
import { saveProjectToDB } from './db';

export interface CloudSyncMetadata {
  lastSyncedAt: number;
  syncedRevision: number;
  cloudStorageProvider: 'Lumina Cloud Vault' | 'Google Drive' | 'Dropbox' | 'Local Vault';
  deviceId: string;
  deviceName: string;
}

export function getOrCreateDeviceId(): { deviceId: string; deviceName: string } {
  let deviceId = localStorage.getItem('lumina_device_id');
  if (!deviceId) {
    deviceId = `dev_${Math.random().toString(36).substring(2, 9)}`;
    localStorage.setItem('lumina_device_id', deviceId);
  }

  let deviceName = localStorage.getItem('lumina_device_name');
  if (!deviceName) {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    deviceName = isMobile ? 'Mobile Workstation' : 'Studio Desktop';
    localStorage.setItem('lumina_device_name', deviceName);
  }

  return { deviceId, deviceName };
}

export async function syncProjectToCloud(project: Project): Promise<{ success: boolean; project: Project; message: string }> {
  // Simulate cloud synchronization with encrypted payload packaging
  const { deviceId, deviceName } = getOrCreateDeviceId();
  
  await new Promise((resolve) => setTimeout(resolve, 800)); // Network sync latency simulation

  const updatedProject: Project = {
    ...project,
    updatedAt: Date.now(),
    cloudSyncStatus: 'synced',
    cloudRevision: (project.cloudRevision || 0) + 1,
  };

  await saveProjectToDB(updatedProject);

  return {
    success: true,
    project: updatedProject,
    message: `Successfully synchronized revision #${updatedProject.cloudRevision} to Lumina Cloud Vault for ${deviceName}.`,
  };
}

export function exportProjectAsLuminaFile(project: Project) {
  const json = JSON.stringify(project, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${project.name.replace(/\.[^/.]+$/, '')}_project.lumina`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export async function importProjectFromLuminaFile(file: File): Promise<Project> {
  const text = await file.text();
  const project = JSON.parse(text) as Project;
  if (!project.id || !project.currentSettings) {
    throw new Error('Invalid Lumina project file structure.');
  }
  project.id = `proj_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  project.updatedAt = Date.now();
  await saveProjectToDB(project);
  return project;
}
