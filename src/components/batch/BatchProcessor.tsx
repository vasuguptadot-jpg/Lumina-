import React, { useState } from 'react';
import {
  UploadCloud,
  Layers,
  Sparkles,
  Download,
  FileArchive,
  Trash2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Palette,
  Sliders,
  Settings,
} from 'lucide-react';
import { BatchProcessingOptions, BatchQueueItem } from '../../types/editor';
import { FILTER_PRESETS } from '../../engine/presets';
import { processSingleBatchItem, createBatchZipArchive } from '../../engine/batchEngine';
import { parseImageOrRawFile } from '../../engine/rawParser';
import { triggerDownload } from '../../engine/exportEngine';

interface BatchProcessorProps {
  showToast: (type: 'success' | 'error' | 'info', title: string, msg?: string) => void;
}

export const BatchProcessor: React.FC<BatchProcessorProps> = ({ showToast }) => {
  const [queue, setQueue] = useState<BatchQueueItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);

  const [options, setOptions] = useState<BatchProcessingOptions>({
    applyPresetId: 'portra-400',
    presetStrength: 100,
    autoEnhance: false,
    resizeOption: 'original',
    maxWidth: 2400,
    maxHeight: 1600,
    outputFormat: 'jpeg',
    quality: 0.92,
    applyWatermark: false,
    namingPattern: '{name}_lumina',
  });

  // Handle Multi-file Upload
  const handleFilesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files: File[] = Array.from(e.target.files);

    const newItems: BatchQueueItem[] = [];
    for (const file of files) {
      try {
        const parsed = await parseImageOrRawFile(file);
        newItems.push({
          id: `batch_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          file,
          originalUrl: parsed.previewUrl,
          thumbnailUrl: parsed.previewUrl,
          width: parsed.imageFile.width,
          height: parsed.imageFile.height,
          status: 'idle',
          progress: 0,
        });
      } catch (err) {
        console.error(`Failed to parse batch item ${file.name}:`, err);
      }
    }

    setQueue((prev) => [...prev, ...newItems]);
    showToast('success', 'Images Added to Queue', `Loaded ${newItems.length} photos ready for batch processing.`);
  };

  // Run Batch Processing on entire queue
  const handleStartBatch = async () => {
    if (queue.length === 0) return;
    setIsProcessing(true);
    setOverallProgress(0);

    const processedResults: Array<{ blob: Blob; filename: string }> = [];

    for (let i = 0; i < queue.length; i++) {
      const item = queue[i];

      // Update item to processing
      setQueue((prev) =>
        prev.map((q, idx) => (idx === i ? { ...q, status: 'processing', progress: 10 } : q))
      );

      try {
        const result = await processSingleBatchItem(item, options, (prog) => {
          setQueue((prev) =>
            prev.map((q, idx) => (idx === i ? { ...q, progress: prog } : q))
          );
        });

        const resultUrl = URL.createObjectURL(result.blob);
        processedResults.push(result);

        setQueue((prev) =>
          prev.map((q, idx) =>
            idx === i
              ? {
                  ...q,
                  status: 'completed',
                  progress: 100,
                  resultBlobUrl: resultUrl,
                  resultSize: result.blob.size,
                }
              : q
          )
        );
      } catch (err: any) {
        setQueue((prev) =>
          prev.map((q, idx) =>
            idx === i
              ? { ...q, status: 'error', progress: 0, errorMessage: err.message }
              : q
          )
        );
      }

      setOverallProgress(Math.round(((i + 1) / queue.length) * 100));
    }

    setIsProcessing(false);
    showToast('success', 'Batch Processing Complete', `Successfully processed ${processedResults.length} photos.`);
  };

  // Download All as ZIP Archive
  const handleDownloadAllZip = async () => {
    const completed = queue.filter((q) => q.status === 'completed' && q.resultBlobUrl);
    if (completed.length === 0) return;

    showToast('info', 'Creating ZIP Archive', 'Packaging high-resolution exports into ZIP...');

    const zipItems: Array<{ blob: Blob; filename: string }> = [];
    for (const item of completed) {
      const response = await fetch(item.resultBlobUrl!);
      const blob = await response.blob();
      const ext = options.outputFormat;
      const baseName = item.file.name.replace(/\.[^/.]+$/, '');
      zipItems.push({ blob, filename: `${baseName}_Lumina.${ext}` });
    }

    const zipBlob = await createBatchZipArchive(zipItems);
    const zipUrl = URL.createObjectURL(zipBlob);
    triggerDownload(zipUrl, `Lumina_Batch_Export_${Date.now()}.zip`);
    showToast('success', 'ZIP Archive Downloaded', 'Batch zip package ready.');
  };

  const clearQueue = () => {
    setQueue([]);
  };

  return (
    <div className="flex-1 h-full bg-slate-950 text-slate-100 flex flex-col md:flex-row overflow-hidden select-none">
      {/* Left Column: Batch Settings & Workflow Recipe */}
      <div className="w-full md:w-80 lg:w-96 bg-slate-900/90 border-r border-slate-800 p-5 overflow-y-auto space-y-6 shrink-0">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-400" />
            Batch Studio
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Apply color profiles, film emulations, watermarks, and resolution transforms to 50+ photos in parallel.
          </p>
        </div>

        {/* Recipe Preset Selector */}
        <div className="space-y-3 bg-slate-950/70 border border-slate-800 p-4 rounded-xl">
          <div className="flex items-center justify-between text-xs font-bold text-slate-300">
            <span className="flex items-center gap-1.5">
              <Palette className="w-4 h-4 text-indigo-400" />
              Batch Film Emulation
            </span>
          </div>

          <select
            value={options.applyPresetId || ''}
            onChange={(e) => setOptions({ ...options, applyPresetId: e.target.value || undefined })}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 outline-none focus:border-indigo-500 font-medium cursor-pointer"
          >
            <option value="">No Filter (Keep Individual Adjustments)</option>
            {FILTER_PRESETS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} ({p.category})
              </option>
            ))}
          </select>

          {options.applyPresetId && (
            <div className="space-y-1 pt-1">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Preset Intensity</span>
                <span className="font-mono text-indigo-300 font-bold">{options.presetStrength}%</span>
              </div>
              <input
                type="range"
                min={20}
                max={150}
                value={options.presetStrength}
                onChange={(e) => setOptions({ ...options, presetStrength: Number(e.target.value) })}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>
          )}
        </div>

        {/* Output Format & Quality */}
        <div className="space-y-3 bg-slate-950/70 border border-slate-800 p-4 rounded-xl">
          <div className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <Settings className="w-4 h-4 text-teal-400" />
            Format & Compression
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            {(['jpeg', 'png', 'webp', 'tiff'] as const).map((fmt) => (
              <button
                key={fmt}
                onClick={() => setOptions({ ...options, outputFormat: fmt })}
                className={`py-1.5 text-xs font-bold uppercase rounded-lg border transition-all ${
                  options.outputFormat === fmt
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-sm'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                {fmt}
              </button>
            ))}
          </div>

          {options.outputFormat === 'jpeg' && (
            <div className="space-y-1 pt-1">
              <div className="flex justify-between text-xs text-slate-400">
                <span>JPEG Quality</span>
                <span className="font-mono text-indigo-300 font-bold">{Math.round(options.quality * 100)}%</span>
              </div>
              <input
                type="range"
                min={0.5}
                max={1.0}
                step={0.01}
                value={options.quality}
                onChange={(e) => setOptions({ ...options, quality: Number(e.target.value) })}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>
          )}

          {/* Resize Option */}
          <div className="pt-2">
            <label className="text-[11px] font-semibold text-slate-400">Batch Scaling</label>
            <select
              value={options.resizeOption}
              onChange={(e) => setOptions({ ...options, resizeOption: e.target.value as any })}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none mt-1"
            >
              <option value="original">Original Dimensions (100% Native)</option>
              <option value="50%">Half Size (50% Web Preview)</option>
              <option value="200%">2x Super-Resolution (200% Upscale)</option>
              <option value="max-width">Max Width 2400px (Editorial Web)</option>
              <option value="max-height">Max Height 1600px</option>
            </select>
          </div>
        </div>

        {/* Start Batch Button */}
        <button
          onClick={handleStartBatch}
          disabled={queue.length === 0 || isProcessing}
          className="w-full py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-teal-500 hover:from-indigo-500 hover:to-teal-400 text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-indigo-600/25 disabled:opacity-40 transition-all flex items-center justify-center gap-2"
        >
          {isProcessing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Processing Queue ({overallProgress}%)...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Process All {queue.length} Images</span>
            </>
          )}
        </button>
      </div>

      {/* Right Column: Queue Grid & Drag Drop Area */}
      <div className="flex-1 h-full p-6 flex flex-col overflow-hidden">
        {/* Header Action Bar */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <span className="text-sm font-bold text-slate-200">
              Queue: {queue.length} Photos
            </span>
            {queue.some((q) => q.status === 'completed') && (
              <span className="text-xs text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">
                {queue.filter((q) => q.status === 'completed').length} Finished
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Upload Button */}
            <label className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold cursor-pointer transition-colors shadow-sm">
              <UploadCloud className="w-3.5 h-3.5" />
              <span>+ Add Photos / RAW</span>
              <input
                type="file"
                multiple
                accept="image/*,.dng,.cr2,.cr3,.nef,.arw,.tiff,.tif"
                onChange={handleFilesUpload}
                className="hidden"
              />
            </label>

            {/* Download All as ZIP */}
            {queue.some((q) => q.status === 'completed') && (
              <button
                onClick={handleDownloadAllZip}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-colors shadow-sm"
              >
                <FileArchive className="w-3.5 h-3.5" />
                <span>Download All ZIP</span>
              </button>
            )}

            {queue.length > 0 && (
              <button
                onClick={clearQueue}
                className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-900 transition-colors"
                title="Clear Queue"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Queue Cards Grid */}
        <div className="flex-1 overflow-y-auto pt-4">
          {queue.length === 0 ? (
            <label className="h-full border-2 border-dashed border-slate-800 hover:border-indigo-500/60 rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-colors p-8 text-center bg-slate-900/30 group">
              <div className="w-16 h-16 rounded-2xl bg-indigo-950/60 border border-indigo-800/40 flex items-center justify-center mb-4 group-hover:scale-105 transition-transform">
                <UploadCloud className="w-8 h-8 text-indigo-400" />
              </div>
              <h3 className="text-sm font-bold text-slate-200">Drag & Drop Batch Photos Here</h3>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Supports High-Res PNG, JPEG, WebP, Lossless TIFF, and RAW formats (.DNG, .CR2, .NEF, .ARW)
              </p>
              <input
                type="file"
                multiple
                accept="image/*,.dng,.cr2,.cr3,.nef,.arw,.tiff,.tif"
                onChange={handleFilesUpload}
                className="hidden"
              />
            </label>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-8">
              {queue.map((item) => (
                <div
                  key={item.id}
                  className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg flex flex-col"
                >
                  <div className="relative aspect-[4/3] bg-slate-950 overflow-hidden">
                    <img
                      src={item.thumbnailUrl}
                      alt={item.file.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 left-2 bg-black/75 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-mono text-slate-300">
                      {item.width} × {item.height}
                    </div>

                    {item.status === 'completed' && (
                      <div className="absolute top-2 right-2 bg-emerald-950/90 border border-emerald-500/60 text-emerald-400 p-1 rounded-full shadow-lg">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                    )}
                  </div>

                  <div className="p-3 flex-1 flex flex-col justify-between space-y-2">
                    <div>
                      <div className="text-xs font-bold text-slate-200 truncate">{item.file.name}</div>
                      <div className="text-[10px] text-slate-500">
                        {(item.file.size / 1024 / 1024).toFixed(2)} MB
                      </div>
                    </div>

                    {item.status === 'processing' && (
                      <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-indigo-500 h-1.5 rounded-full transition-all duration-200"
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    )}

                    {item.status === 'completed' && item.resultBlobUrl && (
                      <button
                        onClick={() => triggerDownload(item.resultBlobUrl!, `${item.file.name.replace(/\.[^/.]+$/, '')}_lumina.${options.outputFormat}`)}
                        className="w-full py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                      >
                        <Download className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Download Single</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
