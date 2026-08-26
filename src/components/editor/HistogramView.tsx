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
  const [channelMode, setChannelMode] = useState<'rgb' | 'lum'>('lum');

  useEffect(() => {
    const updateHistogram = () => {
      const mainCanvas = document.querySelector('canvas') as HTMLCanvasElement | null;
      if (mainCanvas && mainCanvas.width > 0 && mainCanvas.height > 0) {
        const data = computeHistogram(mainCanvas);
        setHistData(data);
      }
    };

    const interval = setInterval(updateHistogram, 400);
    updateHistogram();

    return () => clearInterval(interval);
  }, []);

  // Draw monochrome precision curve on mini canvas
  useEffect(() => {
    if (!histData || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    // Background base
    ctx.fillStyle = '#09090b';
    ctx.fillRect(0, 0, w, h);

    // Zone grid dividers (Zone System)
    ctx.strokeStyle = '#27272a';
    ctx.lineWidth = 1;
    for (let i = 1; i < 4; i++) {
      const x = (w / 4) * i;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }

    const max = histData.maxCount || 1;

    const drawCurve = (arr: Uint32Array, strokeStyle: string, fillStyle?: string) => {
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
      ctx.strokeStyle = strokeStyle;
      ctx.lineWidth = 1.2;
      ctx.stroke();
    };

    if (channelMode === 'lum') {
      drawCurve(histData.lum, '#fafafa', 'rgba(250, 250, 250, 0.12)');
    } else {
      // In monochrome RGB mode, draw distinct line weights and stroke styles
      ctx.setLineDash([2, 2]);
      drawCurve(histData.r, '#a1a1aa', 'rgba(161, 161, 170, 0.05)');
      ctx.setLineDash([4, 2]);
      drawCurve(histData.g, '#d4d4d8', 'rgba(212, 212, 216, 0.05)');
      ctx.setLineDash([]);
      drawCurve(histData.b, '#ffffff', 'rgba(255, 255, 255, 0.08)');
    }
  }, [histData, channelMode]);

  return (
    <div className="bg-zinc-950 border-b border-zinc-800 p-2.5 select-none font-mono">
      <div className="flex items-center justify-between mb-1.5 text-xs">
        <div className="flex items-center gap-1.5 font-semibold text-zinc-300">
          <Activity className="w-3.5 h-3.5 text-zinc-400" />
          <span className="text-[11px] uppercase tracking-wider">Histogram</span>
        </div>

        {/* Channel View Toggle */}
        <div className="flex items-center bg-zinc-900 rounded p-0.5 border border-zinc-800 text-[10px]">
          <button
            onClick={() => setChannelMode('lum')}
            className={`px-2 py-0.5 rounded font-mono transition-colors ${
              channelMode === 'lum' ? 'bg-zinc-800 text-zinc-100 font-bold' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            LUM
          </button>
          <button
            onClick={() => setChannelMode('rgb')}
            className={`px-2 py-0.5 rounded font-mono transition-colors ${
              channelMode === 'rgb' ? 'bg-zinc-800 text-zinc-100 font-bold' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            RGB
          </button>
        </div>
      </div>

      {/* Histogram Canvas */}
      <div className="relative rounded overflow-hidden border border-zinc-800 bg-zinc-950">
        <canvas ref={canvasRef} width={280} height={60} className="w-full h-[60px] block" />

        {/* Clipping Warnings */}
        {histData && histData.shadowClippingPercent > 1.5 && (
          <div className="absolute top-1 left-1 flex items-center gap-1 bg-zinc-900/90 border border-zinc-700 text-zinc-200 px-1.5 py-0.5 rounded text-[9px] font-mono">
            <span>△ CLIP {histData.shadowClippingPercent.toFixed(1)}%</span>
          </div>
        )}

        {histData && histData.highlightClippingPercent > 1.5 && (
          <div className="absolute top-1 right-1 flex items-center gap-1 bg-zinc-900/90 border border-zinc-700 text-zinc-200 px-1.5 py-0.5 rounded text-[9px] font-mono">
            <span>△ PEAK {histData.highlightClippingPercent.toFixed(1)}%</span>
          </div>
        )}
      </div>

      {/* EXIF Metadata Bar */}
      {metadata && (
        <div className="mt-2 pt-1.5 border-t border-zinc-850 grid grid-cols-4 gap-1 text-[10px] text-zinc-400 font-mono">
          <div className="flex items-center gap-1">
            <Camera className="w-3 h-3 text-zinc-500" />
            <span className="truncate">{metadata.iso ? `ISO ${metadata.iso}` : 'ISO 100'}</span>
          </div>
          <div className="flex items-center gap-1">
            <Aperture className="w-3 h-3 text-zinc-500" />
            <span>{metadata.aperture || 'f/2.8'}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-zinc-500" />
            <span>{metadata.shutterSpeed || '1/250s'}</span>
          </div>
          <div className="flex items-center gap-1 justify-end">
            <span className="text-zinc-200 font-semibold">{metadata.focalLength || '35mm'}</span>
          </div>
        </div>
      )}
    </div>
  );
};
