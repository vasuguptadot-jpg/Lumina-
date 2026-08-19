import React, { useState } from 'react';
import {
  DuplicateCluster,
  DuplicatePhotoItem,
  DuplicateType,
  PhotoItem,
} from '../../types/library';
import {
  Copy,
  Sparkles,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Zap,
  ZoomIn,
  Search,
  Eye,
  Sliders,
  X,
  Layers,
  ArrowRight,
  ShieldCheck,
  Check,
  RefreshCw,
} from 'lucide-react';

interface DuplicateDetectionViewProps {
  clusters: DuplicateCluster[];
  onUpdateClusters: (clusters: DuplicateCluster[]) => void;
  onDeletePhotos: (photoIds: string[]) => void;
  showToast: (type: 'success' | 'error' | 'info', title: string, message?: string) => void;
}

export const DuplicateDetectionView: React.FC<DuplicateDetectionViewProps> = ({
  clusters,
  onUpdateClusters,
  onDeletePhotos,
  showToast,
}) => {
  const [activeTab, setActiveTab] = useState<'all' | DuplicateType>('all');
  const [comparingCluster, setComparingCluster] = useState<DuplicateCluster | null>(null);
  const [comparingPhotos, setComparingPhotos] = useState<DuplicatePhotoItem[]>([]);
  const [isScanning, setIsScanning] = useState(false);

  // Filter clusters by type
  const filteredClusters = clusters.filter((c) => {
    if (activeTab === 'all') return true;
    return c.type === activeTab;
  });

  // Calculate totals
  const totalClusters = clusters.length;
  const totalPhotosMarkedForDelete = clusters.reduce(
    (acc, c) => acc + c.photos.filter((p) => p.isMarkedForDeletion).length,
    0
  );
  const totalSpaceSavingsBytes = clusters.reduce(
    (acc, c) =>
      acc +
      c.photos
        .filter((p) => p.isMarkedForDeletion)
        .reduce((sum, p) => sum + p.photo.fileSize, 0),
    0
  );

  // Format bytes to MB/GB
  const formatBytes = (bytes: number) => {
    if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(2) + ' GB';
    return (bytes / 1048576).toFixed(1) + ' MB';
  };

  // Toggle Keep/Delete for a specific photo in a cluster
  const handleTogglePhotoStatus = (clusterId: string, photoId: string) => {
    const nextClusters = clusters.map((cluster) => {
      if (cluster.id !== clusterId) return cluster;

      const updatedPhotos = cluster.photos.map((item) => {
        if (item.photo.id === photoId) {
          const nextDelete = !item.isMarkedForDeletion;
          return {
            ...item,
            isMarkedForDeletion: nextDelete,
            isRecommendedKeep: !nextDelete,
          };
        }
        return item;
      });

      const keepCount = updatedPhotos.filter((p) => !p.isMarkedForDeletion).length;
      const deleteCount = updatedPhotos.filter((p) => p.isMarkedForDeletion).length;
      const savings = updatedPhotos
        .filter((p) => p.isMarkedForDeletion)
        .reduce((sum, p) => sum + p.photo.fileSize, 0);

      return {
        ...cluster,
        photos: updatedPhotos,
        currentKeepCount: keepCount,
        currentDeleteCount: deleteCount,
        potentialSpaceSavings: savings,
      };
    });

    onUpdateClusters(nextClusters);
  };

  // Set "Keep Best N" for a cluster
  const handleSetKeepCount = (clusterId: string, keepCount: number) => {
    const nextClusters = clusters.map((cluster) => {
      if (cluster.id !== clusterId) return cluster;

      const updatedPhotos = cluster.photos.map((item, idx) => ({
        ...item,
        isRecommendedKeep: idx < keepCount,
        isMarkedForDeletion: idx >= keepCount,
      }));

      const savings = updatedPhotos
        .filter((p) => p.isMarkedForDeletion)
        .reduce((sum, p) => sum + p.photo.fileSize, 0);

      return {
        ...cluster,
        recommendedKeepCount: keepCount,
        currentKeepCount: keepCount,
        currentDeleteCount: updatedPhotos.length - keepCount,
        potentialSpaceSavings: savings,
        photos: updatedPhotos,
      };
    });

    onUpdateClusters(nextClusters);
    showToast('info', 'Curation Updated', `Set to keep best ${keepCount} photos in "${clusters.find((c) => c.id === clusterId)?.title}"`);
  };

  // Apply Deletion for a Single Cluster
  const handleCleanCluster = (cluster: DuplicateCluster) => {
    const photoIdsToDelete = cluster.photos
      .filter((p) => p.isMarkedForDeletion)
      .map((p) => p.photo.id);

    if (photoIdsToDelete.length === 0) {
      showToast('info', 'No Photos to Delete', 'All photos in this cluster are marked to be kept.');
      return;
    }

    onDeletePhotos(photoIdsToDelete);

    // Remove or update cluster
    const remainingClusters = clusters.filter((c) => c.id !== cluster.id);
    onUpdateClusters(remainingClusters);
    showToast(
      'success',
      'Cluster Cleaned',
      `Kept best ${cluster.currentKeepCount} photos, deleted ${photoIdsToDelete.length} duplicates (${formatBytes(cluster.potentialSpaceSavings)} freed).`
    );
  };

  // Bulk Clean All Flagged Duplicates across entire Library
  const handleBulkCleanAll = () => {
    const allIdsToDelete: string[] = [];
    let freedBytes = 0;

    clusters.forEach((cluster) => {
      cluster.photos.forEach((p) => {
        if (p.isMarkedForDeletion) {
          allIdsToDelete.push(p.photo.id);
          freedBytes += p.photo.fileSize;
        }
      });
    });

    if (allIdsToDelete.length === 0) {
      showToast('info', 'Nothing to Clean', 'No photos are marked for deletion.');
      return;
    }

    onDeletePhotos(allIdsToDelete);
    onUpdateClusters([]);
    showToast(
      'success',
      'Declutter Complete',
      `Successfully kept top AI picks and deleted ${allIdsToDelete.length} redundant duplicate/burst photos (${formatBytes(freedBytes)} saved).`
    );
  };

  // Trigger on-demand scan simulation
  const handleRescan = () => {
    setIsScanning(true);
    showToast('info', 'AI Scanning Library', 'Analyzing perceptual similarity, burst clusters, and sharpness...');
    setTimeout(() => {
      setIsScanning(false);
      showToast('success', 'Scan Complete', `Analyzed photo catalog. Found ${clusters.length} duplicate/burst clusters.`);
    }, 1200);
  };

  // Open Side-by-Side Comparison Loupe
  const handleOpenComparison = (cluster: DuplicateCluster) => {
    setComparingCluster(cluster);
    // Compare the top pick and the second pick (or marked for deletion)
    setComparingPhotos(cluster.photos.slice(0, 3));
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-slate-950 p-6 overflow-y-auto select-none">
      <div className="max-w-7xl mx-auto w-full flex flex-col gap-6">
        {/* TOP HERO BANNER & STATS */}
        <div className="relative rounded-2xl bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 border border-indigo-500/30 p-6 shadow-2xl overflow-hidden">
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-600/30 border border-indigo-500/50 flex items-center justify-center text-indigo-300 shadow-md">
                  <Copy className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl font-bold text-white tracking-tight">AI Duplicate & Burst Cleaner</h2>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-amber-400" />
                      Smart Curation
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    AI analyzes exact duplicates, continuous burst shots, and similar frames — ranking sharpness, eye contact, and facial expressions.
                  </p>
                </div>
              </div>
            </div>

            {/* Space Savings Metrics & Bulk Clean Action */}
            <div className="flex items-center gap-4 flex-wrap">
              <div className="bg-slate-900/90 border border-slate-800 rounded-xl px-4 py-2.5 flex flex-col">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Potential Savings</span>
                <span className="text-lg font-extrabold text-emerald-400 font-mono">
                  {formatBytes(totalSpaceSavingsBytes)}
                </span>
                <span className="text-[11px] text-slate-400 font-medium">
                  {totalPhotosMarkedForDelete} photos flagged for deletion
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleRescan}
                  disabled={isScanning}
                  className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors"
                  title="Rescan catalog for duplicates"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
                  <span>Rescan</span>
                </button>

                <button
                  onClick={handleBulkCleanAll}
                  disabled={totalPhotosMarkedForDelete === 0}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-xs font-bold text-white shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Clean All Flagged ({totalPhotosMarkedForDelete} Photos)</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* FILTER TABS */}
        <div className="flex items-center justify-between gap-4 border-b border-slate-800 pb-3 flex-wrap">
          <div className="flex items-center gap-1.5 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === 'all'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All Clusters ({clusters.length})
            </button>
            <button
              onClick={() => setActiveTab('burst')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === 'burst'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Burst Sequences ({clusters.filter((c) => c.type === 'burst').length})</span>
            </button>
            <button
              onClick={() => setActiveTab('near-duplicate')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === 'near-duplicate'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sliders className="w-3.5 h-3.5 text-purple-400" />
              <span>Near Duplicates ({clusters.filter((c) => c.type === 'near-duplicate').length})</span>
            </button>
            <button
              onClick={() => setActiveTab('exact')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeTab === 'exact'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Copy className="w-3.5 h-3.5 text-cyan-400" />
              <span>Exact Duplicates ({clusters.filter((c) => c.type === 'exact').length})</span>
            </button>
          </div>
        </div>

        {/* CLUSTERS LIST */}
        {filteredClusters.length === 0 ? (
          <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-12 text-center flex flex-col items-center justify-center">
            <ShieldCheck className="w-12 h-12 text-emerald-400 mb-3" />
            <h3 className="text-base font-bold text-white mb-1">Your Library is Clean!</h3>
            <p className="text-xs text-slate-400 max-w-md">
              No duplicate or burst sequences detected in this filter category.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {filteredClusters.map((cluster) => {
              const keepCount = cluster.photos.filter((p) => !p.isMarkedForDeletion).length;
              const deleteCount = cluster.photos.filter((p) => p.isMarkedForDeletion).length;

              return (
                <div
                  key={cluster.id}
                  className="rounded-2xl bg-slate-900 border border-slate-800/80 hover:border-slate-700/80 transition-all overflow-hidden flex flex-col shadow-xl"
                >
                  {/* Cluster Header */}
                  <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border ${
                            cluster.type === 'burst'
                              ? 'bg-amber-950 text-amber-300 border-amber-500/30'
                              : cluster.type === 'near-duplicate'
                              ? 'bg-purple-950 text-purple-300 border-purple-500/30'
                              : 'bg-cyan-950 text-cyan-300 border-cyan-500/30'
                          }`}
                        >
                          {cluster.type === 'burst'
                            ? `Continuous Burst (${cluster.totalCount} Shots)`
                            : cluster.type === 'near-duplicate'
                            ? `Near Duplicate (${cluster.totalCount} Variations)`
                            : `Exact Duplicate (${cluster.totalCount} Files)`}
                        </span>

                        <h3 className="font-bold text-sm text-white">{cluster.title}</h3>
                      </div>

                      <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
                        {cluster.sceneSummary}
                      </p>
                    </div>

                    {/* Quick Curation Dropdown & Actions */}
                    <div className="flex items-center gap-3 shrink-0 flex-wrap">
                      <div className="flex items-center gap-1.5 bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800 text-xs">
                        <span className="text-slate-400 font-semibold">Keep best:</span>
                        <select
                          value={cluster.recommendedKeepCount}
                          onChange={(e) =>
                            handleSetKeepCount(cluster.id, parseInt(e.target.value, 10))
                          }
                          className="bg-slate-900 border border-indigo-500/40 rounded-lg px-2 py-0.5 text-xs text-indigo-300 font-bold outline-none cursor-pointer"
                        >
                          {Array.from(
                            { length: Math.min(cluster.totalCount, 5) },
                            (_, i) => i + 1
                          ).map((n) => (
                            <option key={n} value={n}>
                              {n} {n === 1 ? 'photo' : 'photos'}
                            </option>
                          ))}
                        </select>
                        <span className="text-slate-400">/ delete remaining {cluster.totalCount - cluster.recommendedKeepCount}</span>
                      </div>

                      <button
                        onClick={() => handleOpenComparison(cluster)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition-colors"
                        title="Compare photos side-by-side"
                      >
                        <Eye className="w-3.5 h-3.5 text-indigo-400" />
                        <span>Compare</span>
                      </button>

                      <button
                        onClick={() => handleCleanCluster(cluster)}
                        disabled={deleteCount === 0}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white shadow-md shadow-emerald-600/30 transition-all disabled:opacity-50"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Apply (Keep {keepCount}, Delete {deleteCount})</span>
                      </button>
                    </div>
                  </div>

                  {/* Horizontal Scroll Photo Strip */}
                  <div className="p-4 overflow-x-auto">
                    <div className="flex items-stretch gap-3 pb-2 min-w-max">
                      {cluster.photos.map((item) => {
                        const isKeep = !item.isMarkedForDeletion;
                        const isTopPick = item.rank === 1;

                        return (
                          <div
                            key={item.photo.id}
                            onClick={() => handleTogglePhotoStatus(cluster.id, item.photo.id)}
                            className={`w-60 rounded-xl overflow-hidden border transition-all cursor-pointer flex flex-col justify-between ${
                              isTopPick
                                ? 'bg-indigo-950/40 border-indigo-500 ring-2 ring-indigo-500/50 shadow-lg shadow-indigo-500/20'
                                : isKeep
                                ? 'bg-emerald-950/20 border-emerald-500/60 ring-1 ring-emerald-500/30'
                                : 'bg-slate-950/80 border-slate-800/90 opacity-75 hover:opacity-100 hover:border-slate-700'
                            }`}
                          >
                            {/* Photo Thumbnail */}
                            <div className="relative aspect-[4/3] bg-slate-950 overflow-hidden">
                              <img
                                src={item.photo.originalUrl}
                                alt={item.photo.title}
                                className={`w-full h-full object-cover transition-transform duration-300 hover:scale-105 ${
                                  !isKeep ? 'grayscale-[40%]' : ''
                                }`}
                              />

                              {/* Top Badges */}
                              <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none">
                                <span
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold backdrop-blur-sm ${
                                    isTopPick
                                      ? 'bg-indigo-600 text-white shadow-md'
                                      : isKeep
                                      ? 'bg-emerald-600 text-white shadow-sm'
                                      : 'bg-black/60 text-slate-400'
                                  }`}
                                >
                                  {isTopPick ? '👑 Best Pick #1' : `#${item.rank}`}
                                </span>

                                {/* Keep / Delete Toggle Indicator */}
                                <div
                                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold backdrop-blur-sm border flex items-center gap-1 ${
                                    isKeep
                                      ? 'bg-emerald-950/90 text-emerald-300 border-emerald-500/50'
                                      : 'bg-red-950/90 text-red-300 border-red-500/50'
                                  }`}
                                >
                                  {isKeep ? (
                                    <>
                                      <CheckCircle2 className="w-2.5 h-2.5 text-emerald-400" />
                                      <span>KEEP</span>
                                    </>
                                  ) : (
                                    <>
                                      <Trash2 className="w-2.5 h-2.5 text-red-400" />
                                      <span>DELETE</span>
                                    </>
                                  )}
                                </div>
                              </div>

                              {/* Time Delta */}
                              {item.timeDeltaMs !== undefined && item.timeDeltaMs > 0 && (
                                <span className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-black/60 backdrop-blur-sm text-[9px] font-mono text-slate-300">
                                  +{item.timeDeltaMs}ms
                                </span>
                              )}
                            </div>

                            {/* Card Content & Metrics */}
                            <div className="p-3 flex flex-col gap-2 flex-1 justify-between text-xs">
                              <div>
                                <h4 className="font-bold text-xs text-white truncate mb-1" title={item.photo.title}>
                                  {item.photo.title}
                                </h4>

                                {/* Sharpness & Expression Meters */}
                                <div className="flex flex-col gap-1 my-1.5">
                                  <div className="flex items-center justify-between text-[10px] font-semibold text-slate-400">
                                    <span>Sharpness:</span>
                                    <span className={item.sharpnessScore >= 90 ? 'text-emerald-400 font-bold' : 'text-slate-300'}>
                                      {item.sharpnessScore}%
                                    </span>
                                  </div>
                                  <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
                                    <div
                                      className={`h-full rounded-full ${
                                        item.sharpnessScore >= 90 ? 'bg-emerald-500' : 'bg-slate-600'
                                      }`}
                                      style={{ width: `${item.sharpnessScore}%` }}
                                    />
                                  </div>
                                </div>

                                {/* AI Reasoning */}
                                <p className="text-[11px] text-slate-300 line-clamp-2 leading-relaxed bg-slate-900/90 p-1.5 rounded border border-slate-800">
                                  {item.aiCurationReason}
                                </p>
                              </div>

                              {/* Action Footer */}
                              <div className="flex items-center justify-between pt-1.5 border-t border-slate-800/80 text-[10px]">
                                <span className="text-slate-400 font-mono">
                                  {(item.photo.fileSize / 1000000).toFixed(1)} MB
                                </span>
                                <span
                                  className={`font-semibold ${
                                    isKeep ? 'text-emerald-400' : 'text-red-400'
                                  }`}
                                >
                                  {isKeep ? 'Selected to Keep' : 'Marked for Deletion'}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* SIDE-BY-SIDE BURST COMPARISON MODAL */}
      {comparingCluster && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm text-white flex items-center gap-2">
                  <Eye className="w-4 h-4 text-indigo-400" />
                  <span>Side-by-Side Burst Comparator: {comparingCluster.title}</span>
                </h3>
                <p className="text-xs text-slate-400">
                  Inspect facial focus, iris sharpness, and expressions across candidate frames.
                </p>
              </div>
              <button
                onClick={() => setComparingCluster(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Split Comparison View */}
            <div className="p-6 flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-3 gap-4">
              {comparingPhotos.map((item) => {
                const isKeep = !item.isMarkedForDeletion;

                return (
                  <div
                    key={item.photo.id}
                    className={`rounded-xl overflow-hidden bg-slate-950 border flex flex-col ${
                      isKeep ? 'border-emerald-500' : 'border-slate-800'
                    }`}
                  >
                    <div className="relative aspect-[4/3] bg-slate-900 overflow-hidden">
                      <img
                        src={item.photo.originalUrl}
                        alt={item.photo.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 left-2 px-2 py-0.5 rounded bg-black/70 text-xs font-bold text-white">
                        Rank #{item.rank}
                      </div>
                    </div>

                    <div className="p-3 flex flex-col gap-2 text-xs flex-1 justify-between">
                      <div>
                        <h4 className="font-bold text-white truncate">{item.photo.title}</h4>
                        <p className="text-slate-300 text-xs mt-1 leading-relaxed">{item.aiCurationReason}</p>
                        <div className="mt-2 text-xs text-indigo-300 font-semibold">
                          Sharpness Score: {item.sharpnessScore}%
                        </div>
                      </div>

                      <button
                        onClick={() => handleTogglePhotoStatus(comparingCluster.id, item.photo.id)}
                        className={`w-full py-1.5 rounded-lg text-xs font-bold transition-colors ${
                          isKeep
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                            : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                        }`}
                      >
                        {isKeep ? '✓ Selected to Keep' : 'Mark for Deletion'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 flex items-center justify-end gap-2">
              <button
                onClick={() => setComparingCluster(null)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-md"
              >
                Done Comparing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
