/**
 * Lumina Studio Pro — Projects Management View
 * Strict 3-Color Hierarchy: #050505 (Black), #7A0F18 (Dark Red), #E6E3DE (Greyish White).
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  FolderOpen,
  Plus,
  Trash2,
  Copy,
  Edit3,
  Search,
  ArrowRight,
  Upload,
  Download,
  HardDrive,
  ArrowUpDown,
  Grid,
  List,
  Check,
  X,
  FileImage,
} from 'lucide-react';
import { Project } from '../../types/editor';
import {
  getAllLuminaProjects,
  deleteLuminaProject,
  saveLuminaProject,
} from '../../storage/indexedDbManager';
import {
  exportPortableLuminaFile,
  importPortableLuminaFile,
} from '../../storage/portableProject';
import { StorageQuotaModal } from '../storage/StorageQuotaModal';

interface ProjectsViewProps {
  currentProject: Project;
  onOpenProject: (project: Project) => void;
  onNewProject: () => void;
  showToast?: (type: 'success' | 'error' | 'info', title: string, msg?: string) => void;
}

type SortOption = 'updated_desc' | 'updated_asc' | 'name_asc' | 'created_desc';

export const ProjectsView: React.FC<ProjectsViewProps> = ({
  currentProject,
  onOpenProject,
  onNewProject,
  showToast,
}) => {
  const [projectsList, setProjectsList] = useState<Project[]>([currentProject]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('updated_desc');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNameValue, setEditNameValue] = useState('');
  const [isStorageModalOpen, setIsStorageModalOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadProjects = async () => {
    try {
      const saved = await getAllLuminaProjects();
      if (saved && saved.length > 0) {
        const exists = saved.some((p) => p.id === currentProject.id);
        setProjectsList(exists ? saved : [currentProject, ...saved]);
      } else {
        setProjectsList([currentProject]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadProjects();
  }, [currentProject]);

  const handleDeleteProject = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (id === currentProject.id) {
      showToast?.(
        'error',
        'Cannot Delete Active Project',
        'Switch to another project before deleting.'
      );
      return;
    }
    await deleteLuminaProject(id);
    setProjectsList((prev) => prev.filter((p) => p.id !== id));
    showToast?.('info', 'Project Deleted', 'Project removed from local storage.');
  };

  const handleDuplicateProject = async (proj: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    const dupe: Project = {
      ...proj,
      id: `proj_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: `${proj.name} (Copy)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await saveLuminaProject(dupe);
    setProjectsList((prev) => [dupe, ...prev]);
    showToast?.('success', 'Project Duplicated', `Created "${dupe.name}".`);
  };

  const handleStartRename = (proj: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(proj.id);
    setEditNameValue(proj.name);
  };

  const handleSaveRename = async (proj: Project, e: React.MouseEvent | React.FormEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!editNameValue.trim()) {
      setEditingId(null);
      return;
    }
    const updated = {
      ...proj,
      name: editNameValue.trim(),
      updatedAt: Date.now(),
    };
    await saveLuminaProject(updated);
    setProjectsList((prev) => prev.map((p) => (p.id === proj.id ? updated : p)));
    setEditingId(null);
    showToast?.('success', 'Project Renamed', `Updated to "${updated.name}".`);
  };

  const handleExportProject = async (proj: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      showToast?.('info', 'Exporting Package', `Generating .lumina for "${proj.name}"...`);
      await exportPortableLuminaFile(proj);
      showToast?.('success', 'Export Complete', `Saved ${proj.name}.lumina`);
    } catch (err) {
      console.error(err);
      showToast?.('error', 'Export Failed', 'Could not export project package.');
    }
  };

  const handleImportFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsImporting(true);
    try {
      const imported = await importPortableLuminaFile(file);
      await saveLuminaProject(imported);
      setProjectsList((prev) => [imported, ...prev]);
      showToast?.('success', 'Package Imported', `Imported "${imported.name}".`);
      onOpenProject(imported);
    } catch (err: any) {
      console.error(err);
      showToast?.('error', 'Import Failed', err?.message || 'Invalid .lumina project package.');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Filter and sort
  const filteredProjects = useMemo(() => {
    let list = projectsList.filter((p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (selectedTag === 'raw') {
      list = list.filter((p) => p.image?.rawMetadata?.isRaw);
    } else if (selectedTag === 'edited') {
      list = list.filter((p) => p.updatedAt && p.updatedAt > p.createdAt);
    }

    return list.sort((a, b) => {
      if (sortBy === 'updated_desc') return (b.updatedAt || 0) - (a.updatedAt || 0);
      if (sortBy === 'updated_asc') return (a.updatedAt || 0) - (b.updatedAt || 0);
      if (sortBy === 'created_desc') return (b.createdAt || 0) - (a.createdAt || 0);
      if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
      return 0;
    });
  }, [projectsList, searchQuery, selectedTag, sortBy]);

  return (
    <div className="flex-1 overflow-y-auto bg-[#050505] text-[#E6E3DE] p-6 sm:p-10 space-y-8 select-none font-sans">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[rgba(230,227,222,0.08)] pb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#E6E3DE] flex items-center gap-2.5">
            <FolderOpen className="w-6 h-6 text-[#7A0F18]" />
            <span>Projects & Archives</span>
          </h1>
          <p className="text-xs text-[rgba(230,227,222,0.70)] mt-1">
            Local browser workspace database with lossless portable package (.lumina) export/import.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Storage quota button */}
          <button
            onClick={() => setIsStorageModalOpen(true)}
            className="p-2 rounded-lg text-[rgba(230,227,222,0.70)] hover:text-[#E6E3DE] bg-[#050505] hover:bg-[rgba(230,227,222,0.06)] border border-[rgba(230,227,222,0.12)] hover:border-[#7A0F18] transition-colors"
            title="Inspect IndexedDB Storage Quota"
          >
            <HardDrive className="w-4 h-4" />
          </button>

          {/* Import Portable Package */}
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className="px-3 py-2 rounded-lg bg-[#050505] hover:bg-[rgba(230,227,222,0.06)] border border-[rgba(230,227,222,0.12)] hover:border-[#7A0F18] text-[#E6E3DE] text-xs font-medium flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            <Upload className="w-4 h-4 text-[#7A0F18]" />
            <span>{isImporting ? 'Importing...' : 'Import .lumina'}</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".lumina,.json"
            onChange={handleImportFileSelected}
            className="hidden"
          />

          <button
            onClick={onNewProject}
            className="px-4 py-2 rounded-lg bg-[#7A0F18] hover:bg-[#8F141E] text-[#E6E3DE] text-xs font-semibold flex items-center gap-2 transition-colors active:scale-98 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>+ New Project</span>
          </button>
        </div>
      </div>

      {/* Control Bar: Search, Filters, Sort, View Toggle */}
      <div className="p-3 rounded-xl bg-[#050505] border border-[rgba(230,227,222,0.12)] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[rgba(230,227,222,0.45)]" />
            <input
              type="text"
              placeholder="Search projects by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-[#050505] border border-[rgba(230,227,222,0.12)] focus:border-[#7A0F18] text-xs text-[#E6E3DE] placeholder-[rgba(230,227,222,0.45)] focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setSelectedTag('all')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                selectedTag === 'all'
                  ? 'bg-[#7A0F18] text-[#E6E3DE] border border-[#7A0F18]'
                  : 'text-[rgba(230,227,222,0.70)] hover:text-[#E6E3DE]'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setSelectedTag('raw')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                selectedTag === 'raw'
                  ? 'bg-[#7A0F18] text-[#E6E3DE] border border-[#7A0F18]'
                  : 'text-[rgba(230,227,222,0.70)] hover:text-[#E6E3DE]'
              }`}
            >
              RAW
            </button>
            <button
              onClick={() => setSelectedTag('edited')}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                selectedTag === 'edited'
                  ? 'bg-[#7A0F18] text-[#E6E3DE] border border-[#7A0F18]'
                  : 'text-[rgba(230,227,222,0.70)] hover:text-[#E6E3DE]'
              }`}
            >
              Edited
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end md:self-auto">
          <div className="flex items-center gap-1 text-xs text-[rgba(230,227,222,0.70)]">
            <ArrowUpDown className="w-3.5 h-3.5 text-[rgba(230,227,222,0.45)]" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-[#050505] border border-[rgba(230,227,222,0.12)] rounded px-2 py-1 text-xs text-[#E6E3DE] focus:outline-none"
            >
              <option value="updated_desc">Recently Modified</option>
              <option value="updated_asc">Oldest Modified</option>
              <option value="created_desc">Recently Created</option>
              <option value="name_asc">Name (A-Z)</option>
            </select>
          </div>

          <div className="flex items-center border border-[rgba(230,227,222,0.12)] rounded-lg bg-[#050505] p-0.5">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded ${
                viewMode === 'grid' ? 'bg-[#7A0F18] text-[#E6E3DE]' : 'text-[rgba(230,227,222,0.45)] hover:text-[#E6E3DE]'
              }`}
              title="Grid View"
            >
              <Grid className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded ${
                viewMode === 'list' ? 'bg-[#7A0F18] text-[#E6E3DE]' : 'text-[rgba(230,227,222,0.45)] hover:text-[#E6E3DE]'
              }`}
              title="List View"
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Projects Grid or List View */}
      {filteredProjects.length === 0 ? (
        <div className="p-12 rounded-2xl bg-[#050505] border border-[rgba(230,227,222,0.12)] text-center space-y-3">
          <FolderOpen className="w-8 h-8 text-[rgba(230,227,222,0.45)] mx-auto" />
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-[#E6E3DE]">No matching projects found</h3>
            <p className="text-xs text-[rgba(230,227,222,0.70)]">
              Try adjusting your search query or create a new project.
            </p>
          </div>
          <button
            onClick={onNewProject}
            className="px-4 py-2 rounded-lg bg-[#7A0F18] hover:bg-[#8F141E] text-[#E6E3DE] text-xs font-semibold inline-flex items-center gap-2"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create New Project</span>
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProjects.map((proj) => {
            const isActive = proj.id === currentProject.id;
            const isEditing = editingId === proj.id;

            return (
              <div
                key={proj.id}
                onClick={() => onOpenProject(proj)}
                className={`group p-3.5 rounded-xl bg-[#050505] border transition-colors cursor-pointer flex flex-col justify-between space-y-3 ${
                  isActive
                    ? 'border-[#7A0F18] ring-1 ring-[#7A0F18]/50'
                    : 'border-[rgba(230,227,222,0.12)] hover:border-[#7A0F18]'
                }`}
              >
                {/* Thumbnail Tile */}
                <div className="w-full aspect-4/3 rounded-lg bg-[#050505] border border-[rgba(230,227,222,0.08)] overflow-hidden relative">
                  {proj.image?.originalUrl ? (
                    <img
                      src={proj.image.originalUrl}
                      alt={proj.name}
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-200"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[rgba(230,227,222,0.45)]">
                      <FileImage className="w-8 h-8" />
                    </div>
                  )}

                  {isActive && (
                    <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-[8px] font-mono font-bold bg-[#7A0F18] text-[#E6E3DE] uppercase">
                      ACTIVE
                    </span>
                  )}

                  {proj.image?.rawMetadata?.isRaw && (
                    <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded text-[8px] font-mono font-bold bg-[#050505]/90 text-[#E6E3DE] border border-[rgba(230,227,222,0.20)]">
                      RAW
                    </span>
                  )}
                </div>

                {/* Project Name & Actions */}
                <div className="space-y-1">
                  {isEditing ? (
                    <form onSubmit={(e) => handleSaveRename(proj, e)} className="flex items-center gap-1">
                      <input
                        type="text"
                        value={editNameValue}
                        onChange={(e) => setEditNameValue(e.target.value)}
                        autoFocus
                        className="flex-1 bg-[#050505] border border-[#7A0F18] rounded px-2 py-0.5 text-xs text-[#E6E3DE] focus:outline-none"
                      />
                      <button
                        type="submit"
                        className="p-1 text-[#E6E3DE] hover:text-[#E6E3DE]"
                      >
                        <Check className="w-3.5 h-3.5 text-[#7A0F18]" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingId(null);
                        }}
                        className="p-1 text-[rgba(230,227,222,0.45)] hover:text-[#E6E3DE]"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </form>
                  ) : (
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-semibold text-[#E6E3DE] truncate flex-1 group-hover:text-[#E6E3DE]">
                        {proj.name}
                      </h3>
                      <button
                        onClick={(e) => handleStartRename(proj, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 text-[rgba(230,227,222,0.45)] hover:text-[#E6E3DE] transition-opacity"
                        title="Rename Project"
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                    </div>
                  )}

                  <div className="flex items-center justify-between text-[10px] text-[rgba(230,227,222,0.45)] font-mono">
                    <span>
                      {proj.image?.width && proj.image?.height
                        ? `${proj.image.width}×${proj.image.height}`
                        : 'Edited'}
                    </span>
                    <span>
                      {new Date(proj.updatedAt || Date.now()).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>

                {/* Bottom Action Strip */}
                <div className="pt-2 border-t border-[rgba(230,227,222,0.08)] flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => handleDuplicateProject(proj, e)}
                      className="p-1.5 rounded hover:bg-[rgba(230,227,222,0.06)] text-[rgba(230,227,222,0.45)] hover:text-[#E6E3DE] transition-colors"
                      title="Duplicate Project"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleExportProject(proj, e)}
                      className="p-1.5 rounded hover:bg-[rgba(230,227,222,0.06)] text-[rgba(230,227,222,0.45)] hover:text-[#E6E3DE] transition-colors"
                      title="Export .lumina package"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    {!isActive && (
                      <button
                        onClick={(e) => handleDeleteProject(proj.id, e)}
                        className="p-1.5 rounded hover:bg-[rgba(230,227,222,0.06)] text-[rgba(230,227,222,0.45)] hover:text-[#7A0F18] transition-colors"
                        title="Delete Project"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <span className="text-[10px] font-medium text-[rgba(230,227,222,0.70)] group-hover:text-[#E6E3DE] flex items-center gap-1">
                    <span>Open</span>
                    <ArrowRight className="w-3 h-3 text-[#7A0F18] group-hover:translate-x-0.5 transition-transform" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* List View */
        <div className="rounded-xl bg-[#050505] border border-[rgba(230,227,222,0.12)] overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[rgba(230,227,222,0.08)] text-[rgba(230,227,222,0.45)] font-mono text-[10px] uppercase bg-[#050505]">
                <th className="py-2.5 px-4">Project</th>
                <th className="py-2.5 px-4">Resolution</th>
                <th className="py-2.5 px-4">Format</th>
                <th className="py-2.5 px-4">Last Modified</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[rgba(230,227,222,0.06)]">
              {filteredProjects.map((proj) => {
                const isActive = proj.id === currentProject.id;
                return (
                  <tr
                    key={proj.id}
                    onClick={() => onOpenProject(proj)}
                    className="hover:bg-[rgba(230,227,222,0.04)] cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 flex items-center gap-3">
                      <div className="w-9 h-9 rounded bg-[#050505] border border-[rgba(230,227,222,0.12)] overflow-hidden shrink-0">
                        {proj.image?.originalUrl ? (
                          <img
                            src={proj.image.originalUrl}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[rgba(230,227,222,0.45)]">
                            <FileImage className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-medium text-[#E6E3DE] flex items-center gap-2">
                          <span>{proj.name}</span>
                          {isActive && (
                            <span className="text-[8px] font-mono px-1 py-0.2 rounded bg-[#7A0F18] text-[#E6E3DE] font-bold">
                              ACTIVE
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-[rgba(230,227,222,0.70)] font-mono text-[11px]">
                      {proj.image?.width && proj.image?.height
                        ? `${proj.image.width}×${proj.image.height}`
                        : '—'}
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-[#050505] text-[rgba(230,227,222,0.70)] border border-[rgba(230,227,222,0.12)]">
                        {proj.image?.rawMetadata?.isRaw ? 'RAW' : proj.image?.format?.toUpperCase() || 'JPEG'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-[rgba(230,227,222,0.45)] font-mono text-[11px]">
                      {new Date(proj.updatedAt || Date.now()).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => handleDuplicateProject(proj, e)}
                          className="p-1 text-[rgba(230,227,222,0.45)] hover:text-[#E6E3DE]"
                          title="Duplicate"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleExportProject(proj, e)}
                          className="p-1 text-[rgba(230,227,222,0.45)] hover:text-[#E6E3DE]"
                          title="Export Package"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        {!isActive && (
                          <button
                            onClick={(e) => handleDeleteProject(proj.id, e)}
                            className="p-1 text-[rgba(230,227,222,0.45)] hover:text-[#7A0F18]"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Storage Quota Modal */}
      {isStorageModalOpen && (
        <StorageQuotaModal
          isOpen={isStorageModalOpen}
          onClose={() => setIsStorageModalOpen(false)}
        />
      )}
    </div>
  );
};
