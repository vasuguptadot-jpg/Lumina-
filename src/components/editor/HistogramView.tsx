import React, { useRef, useEffect, useState } from 'react';
import { Camera, Aperture, Clock, Activity, AlertTriangle } from 'lucide-react';
import { RawMetadata } from '../../types/editor';
import { computeHistogram, HistogramData } from '../../engine/histogram';

interface HistogramViewProps {
  metadata?: RawMetadata;
}

export const HistogramView: React.FC<HistogramViewProps> = ({ metadata }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [histData, setHistData] = useState<HistogramData | null>(null);
  const [channelMode, setChannelMode] = useState<'rgb' | 'lum' | 'r' | 'g' | 'b'>('rgb');

  // Listen to canvas updates or periodic sampling of current rendered image
  useEffect(() => {
    const updateHistogram = () => {
      const mainCanvas = document.querySelector('canvas') as HTMLCanvasElement | null;
      if (mainCanvas && mainCanvas.width > 0 && mainCanvas.height > 0) {
        const data = computeHistogram(mainCanvas);
        setHistData(data);
      }
    };

    const interval = setInterval(updateHistogram, 500);
    updateHistogram();

    return () => clearInterval(interval);
  }, []);

  // Draw histogram curve on mini canvas
  useEffect(() => {
    if (!histData || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Background grid
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, w, h);

    // Vertical third guidelines
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    for (let i = 1; i < 4; i++) {
      const x = (w / 4) * i;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }

    const max = histData.maxCount || 1;

    const drawChannel = (arr: Uint32Array, color: string, fillStyle?: string) => {
      ctx.beginPath();
      ctx.moveTo(0, h);
      for (let i = 0; i < 256; i++) {
        const x = (i / 255) * w;
        const y = h - (arr[i] / max) * h * 0.92;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(w, h);
      if (fillStyle) {
        ctx.fillStyle = fillStyle;
        ctx.fill();
      }
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.2;
      ctx.stroke();
    };

    ctx.globalCompositeOperation = 'screen';

    if (channelMode === 'rgb') {
      drawChannel(histData.r, 'rgba(239, 68, 68, 0.85)', 'rgba(239, 68, 68, 0.15)');
      drawChannel(histData.g, 'rgba(34, 197, 94, 0.85)', 'rgba(34, 197, 94, 0.15)');
      drawChannel(histData.b, 'rgba(59, 130, 246, 0.85)', 'rgba(59, 130, 246, 0.15)');
    } else if (channelMode === 'lum') {
      ctx.globalCompositeOperation = 'source-over';
      drawChannel(histData.lum, '#f8fafc', 'rgba(248, 250, 252, 0.2)');
    } else if (channelMode === 'r') {
      ctx.globalCompositeOperation = 'source-over';
      drawChannel(histData.r, '#ef4444', 'rgba(239, 68, 68, 0.25)');
    } else if (channelMode === 'g') {
      ctx.globalCompositeOperation = 'source-over';
      drawChannel(histData.g, '#22c55e', 'rgba(34, 197, 94, 0.25)');
    } else if (channelMode === 'b') {
      ctx.globalCompositeOperation = 'source-over';
      drawChannel(histData.b, '#3b82f6', 'rgba(59, 130, 246, 0.25)');
    }

    ctx.globalCompositeOperation = 'source-over';
  }, [histData, channelMode]);

  return (
    <div className="bg-slate-950/70 border-b border-slate-800/80 p-3 select-none">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-300">
          <Activity className="w-3.5 h-3.5 text-indigo-400" />
          <span>Live Histogram</span>
        </div>

        {/* Channel View Toggle */}
        <div className="flex items-center bg-slate-900 rounded-lg p-0.5 border border-slate-800 text-[10px]">
          <button
            onClick={() => setChannelMode('rgb')}
            className={`px-1.5 py-0.5 rounded font-bold transition-colors ${
              channelMode === 'rgb' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            RGB
          </button>
          <button
            onClick={() => setChannelMode('lum')}
            className={`px-1.5 py-0.5 rounded font-bold transition-colors ${
              channelMode === 'lum' ? 'bg-slate-800 text-white' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            LUM
          </button>
          <button
            onClick={() => setChannelMode('r')}
            className={`px-1.5 py-0.5 rounded font-bold transition-colors ${
              channelMode === 'r' ? 'bg-red-950 text-red-400' : 'text-red-600/70'
            }`}
          >
            R
          </button>
          <button
            onClick={() => setChannelMode('g')}
            className={`px-1.5 py-0.5 rounded font-bold transition-colors ${
              channelMode === 'g' ? 'bg-emerald-950 text-emerald-400' : 'text-emerald-600/70'
            }`}
          >
            G
          </button>
          <button
            onClick={() => setChannelMode('b')}
            className={`px-1.5 py-0.5 rounded font-bold transition-colors ${
              channelMode === 'b' ? 'bg-blue-950 text-blue-400' : 'text-blue-600/70'
            }`}
          >
            B
          </button>
        </div>
      </div>

      {/* Histogram Canvas */}
      <div className="relative rounded-lg overflow-hidden border border-slate-800/80 shadow-inner">
        <canvas ref={canvasRef} width={280} height={70} className="w-full h-[70px] block" />

        {/* Clipping Warnings */}
        {histData && histData.shadowClippingPercent > 1.5 && (
          <div className="absolute top-1 left-1.5 flex items-center gap-1 bg-blue-950/80 border border-blue-500/40 text-blue-300 px-1.5 py-0.5 rounded text-[9px] font-bold">
            <AlertTriangle className="w-2.5 h-2.5" />
            <span>Shadow Clip {histData.shadowClippingPercent.toFixed(1)}%</span>
          </div>
        )}

        {histData && histData.highlightClippingPercent > 1.5 && (
          <div className="absolute top-1 right-1.5 flex items-center gap-1 bg-rose-950/80 border border-rose-500/40 text-rose-300 px-1.5 py-0.5 rounded text-[9px] font-bold">
            <AlertTriangle className="w-2.5 h-2.5" />
            <span>Highlight Clip {histData.highlightClippingPercent.toFixed(1)}%</span>
          </div>
        )}
      </div>

      {/* EXIF Metadata Bar */}
      {metadata && (
        <div className="mt-2 pt-2 border-t border-slate-800/60 grid grid-cols-4 gap-1 text-[10px] text-slate-400 font-mono">
          <div className="flex items-center gap-1">
            <Camera className="w-3 h-3 text-slate-500" />
            <span className="truncate">{metadata.iso ? `ISO ${metadata.iso}` : 'ISO 100'}</span>
          </div>
          <div className="flex items-center gap-1">
            <Aperture className="w-3 h-3 text-slate-500" />
            <span>{metadata.aperture || 'f/2.8'}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-500" />
            <span>{metadata.shutterSpeed || '1/250s'}</span>
          </div>
          <div className="flex items-center gap-1 justify-end">
            <span className="text-indigo-400 font-semibold">{metadata.focalLength || '35mm'}</span>
          </div>
        </div>
      )}
    </div>
  );
};
