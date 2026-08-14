import React, { useRef, useState, useEffect } from 'react';
import { RotateCcw, TrendingUp, Sliders, LineChart, Sparkles } from 'lucide-react';
import { ToneCurves, CurvePoint, ParametricCurveSettings } from '../../../types/editor';
import { DEFAULT_TONE_CURVES } from '../../../engine/defaultSettings';

interface CurvesPanelProps {
  toneCurves: ToneCurves;
  onChange: (curves: ToneCurves) => void;
}

export const CurvesPanel: React.FC<CurvesPanelProps> = ({ toneCurves, onChange }) => {
  const [curveMode, setCurveMode] = useState<'point' | 'parametric'>(toneCurves.mode || 'point');
  const [activeChannel, setActiveChannel] = useState<'master' | 'red' | 'green' | 'blue'>('master');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [draggingPointIndex, setDraggingPointIndex] = useState<number | null>(null);

  const currentPoints = (toneCurves[activeChannel] || [
    { x: 0, y: 0 },
    { x: 255, y: 255 },
  ]) as CurvePoint[];

  const parametric: ParametricCurveSettings = toneCurves.parametric || {
    highlights: 0,
    lights: 0,
    darks: 0,
    shadows: 0,
  };

  // Sync mode changes
  const switchMode = (mode: 'point' | 'parametric') => {
    setCurveMode(mode);
    onChange({
      ...toneCurves,
      mode,
    });
  };

  const updateParametricField = (field: keyof ParametricCurveSettings, val: number) => {
    onChange({
      ...toneCurves,
      mode: 'parametric',
      parametric: {
        ...parametric,
        [field]: val,
      },
    });
  };

  // Draw Spline Curve or Parametric Curve on Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    // Background & Grid
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, w, h);

    // Diagonal 45-degree reference line
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(0, h);
    ctx.lineTo(w, 0);
    ctx.stroke();
    ctx.setLineDash([]);

    // 4x4 Tonal Grid (Shadows, Darks, Lights, Highlights zones)
    ctx.strokeStyle = '#151f32';
    for (let i = 1; i < 4; i++) {
      const gx = (w / 4) * i;
      const gy = (h / 4) * i;
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, h);
      ctx.moveTo(0, gy);
      ctx.lineTo(w, gy);
      ctx.stroke();
    }

    // Zone labels in parametric mode
    if (curveMode === 'parametric') {
      ctx.fillStyle = '#475569';
      ctx.font = '9px monospace';
      ctx.fillText('SHD', w * 0.08, h - 6);
      ctx.fillText('DRK', w * 0.33, h - 6);
      ctx.fillText('LGT', w * 0.58, h - 6);
      ctx.fillText('HLT', w * 0.83, h - 6);
    }

    // Channel styling
    let strokeColor = '#f8fafc';
    let pointColor = '#6366f1';
    if (activeChannel === 'red') {
      strokeColor = '#ef4444';
      pointColor = '#ef4444';
    } else if (activeChannel === 'green') {
      strokeColor = '#22c55e';
      pointColor = '#22c55e';
    } else if (activeChannel === 'blue') {
      strokeColor = '#3b82f6';
      pointColor = '#3b82f6';
    }

    if (curveMode === 'point') {
      // Sort control points
      const sorted = [...currentPoints].sort((a, b) => a.x - b.x);

      // Draw Smooth Spline Curve
      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 2.5;
      ctx.beginPath();

      for (let px = 0; px <= w; px++) {
        const valX = (px / w) * 255;
        let valY = valX;

        if (valX <= sorted[0].x) {
          valY = sorted[0].y;
        } else if (valX >= sorted[sorted.length - 1].x) {
          valY = sorted[sorted.length - 1].y;
        } else {
          let i = 0;
          while (i < sorted.length - 1 && valX > sorted[i + 1].x) i++;
          const p0 = sorted[i];
          const p1 = sorted[i + 1];
          const t = (valX - p0.x) / (p1.x - p0.x || 1);
          // Smoothstep Hermite polynomial
          valY = p0.y + (p1.y - p0.y) * (t * t * (3 - 2 * t));
        }

        const py = h - (valY / 255) * h;
        if (px === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();

      // Draw Control Points
      sorted.forEach((pt) => {
        const cx = (pt.x / 255) * w;
        const cy = h - (pt.y / 255) * h;

        ctx.fillStyle = pointColor;
        ctx.beginPath();
        ctx.arc(cx, cy, 6, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, 6, 0, Math.PI * 2);
        ctx.stroke();
      });
    } else {
      // Draw Parametric Curve
      const hAdj = (parametric.highlights || 0) * 0.4;
      const lAdj = (parametric.lights || 0) * 0.45;
      const dAdj = (parametric.darks || 0) * 0.45;
      const sAdj = (parametric.shadows || 0) * 0.4;

      const pPts: CurvePoint[] = [
        { x: 0, y: Math.max(0, Math.min(255, sAdj * 0.4)) },
        { x: 64, y: Math.max(0, Math.min(255, 64 + sAdj * 0.6 + dAdj * 0.5)) },
        { x: 128, y: Math.max(0, Math.min(255, 128 + dAdj * 0.5 + lAdj * 0.5)) },
        { x: 192, y: Math.max(0, Math.min(255, 192 + lAdj * 0.5 + hAdj * 0.6)) },
        { x: 255, y: Math.max(0, Math.min(255, 255 + hAdj * 0.4)) },
      ];

      ctx.strokeStyle = '#818cf8';
      ctx.lineWidth = 2.5;
      ctx.beginPath();

      for (let px = 0; px <= w; px++) {
        const valX = (px / w) * 255;
        let i = 0;
        while (i < pPts.length - 1 && valX > pPts[i + 1].x) i++;
        const p0 = pPts[i];
        const p1 = pPts[i + 1] || pPts[pPts.length - 1];
        const t = (valX - p0.x) / (p1.x - p0.x || 1);
        const valY = p0.y + (p1.y - p0.y) * (t * t * (3 - 2 * t));

        const py = h - (valY / 255) * h;
        if (px === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }
  }, [currentPoints, activeChannel, curveMode, parametric]);

  // Handle Point dragging & adding in Point Mode
  const getCanvasCoords = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(255, Math.round(((e.clientX - rect.left) / rect.width) * 255)));
    const y = Math.max(0, Math.min(255, Math.round((1 - (e.clientY - rect.top) / rect.height) * 255)));
    return { x, y };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (curveMode !== 'point') return;
    const { x, y } = getCanvasCoords(e);
    const existingIndex = currentPoints.findIndex(
      (p) => Math.hypot(p.x - x, p.y - y) < 18
    );

    if (existingIndex !== -1) {
      setDraggingPointIndex(existingIndex);
    } else {
      const newPoints = [...currentPoints, { x, y }].sort((a, b) => a.x - b.x);
      onChange({
        ...toneCurves,
        mode: 'point',
        [activeChannel]: newPoints,
      });
      setDraggingPointIndex(newPoints.findIndex((p) => p.x === x && p.y === y));
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (curveMode !== 'point' || draggingPointIndex === null) return;
    const { x, y } = getCanvasCoords(e);

    const updated = [...currentPoints];
    if (draggingPointIndex === 0) {
      updated[0] = { x: 0, y };
    } else if (draggingPointIndex === currentPoints.length - 1) {
      updated[currentPoints.length - 1] = { x: 255, y };
    } else {
      updated[draggingPointIndex] = { x, y };
    }

    onChange({
      ...toneCurves,
      mode: 'point',
      [activeChannel]: updated.sort((a, b) => a.x - b.x),
    });
  };

  const handleMouseUp = () => {
    setDraggingPointIndex(null);
  };

  const resetCurrentChannel = () => {
    if (curveMode === 'point') {
      onChange({
        ...toneCurves,
        [activeChannel]: [
          { x: 0, y: 0 },
          { x: 255, y: 255 },
        ],
      });
    } else {
      onChange({
        ...toneCurves,
        parametric: {
          highlights: 0,
          lights: 0,
          darks: 0,
          shadows: 0,
        },
      });
    }
  };

  return (
    <div className="p-4 space-y-4 select-none">
      {/* Mode Switcher: Point Curve vs Parametric Curve */}
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-indigo-400" />
          Tone Curves
        </span>

        <div className="flex bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs font-semibold">
          <button
            onClick={() => switchMode('point')}
            className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1 ${
              curveMode === 'point' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <LineChart className="w-3 h-3" />
            <span>Point</span>
          </button>
          <button
            onClick={() => switchMode('parametric')}
            className={`px-2.5 py-1 rounded transition-colors flex items-center gap-1 ${
              curveMode === 'parametric' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sliders className="w-3 h-3" />
            <span>Parametric</span>
          </button>
        </div>
      </div>

      {/* Point Curve RGB Channel Selector */}
      {curveMode === 'point' && (
        <div className="flex bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-xs font-bold justify-between">
          <button
            onClick={() => setActiveChannel('master')}
            className={`flex-1 py-1 rounded transition-colors text-center ${
              activeChannel === 'master' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            RGB Master
          </button>
          <button
            onClick={() => setActiveChannel('red')}
            className={`flex-1 py-1 rounded transition-colors text-center ${
              activeChannel === 'red' ? 'bg-red-950/80 text-red-300 border border-red-800/60' : 'text-red-400 hover:text-red-300'
            }`}
          >
            Red
          </button>
          <button
            onClick={() => setActiveChannel('green')}
            className={`flex-1 py-1 rounded transition-colors text-center ${
              activeChannel === 'green' ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/60' : 'text-emerald-400 hover:text-emerald-300'
            }`}
          >
            Green
          </button>
          <button
            onClick={() => setActiveChannel('blue')}
            className={`flex-1 py-1 rounded transition-colors text-center ${
              activeChannel === 'blue' ? 'bg-blue-950/80 text-blue-300 border border-blue-800/60' : 'text-blue-400 hover:text-blue-300'
            }`}
          >
            Blue
          </button>
        </div>
      )}

      {/* Interactive Spline Curve Canvas */}
      <div className="relative rounded-xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950">
        <canvas
          ref={canvasRef}
          width={280}
          height={240}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          className={`w-full h-[240px] block ${curveMode === 'point' ? 'cursor-crosshair' : 'cursor-default'}`}
        />
      </div>

      {/* Parametric Sliders (Highlights, Lights, Darks, Shadows) */}
      {curveMode === 'parametric' ? (
        <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-xl space-y-3">
          <div className="text-[11px] font-bold text-slate-300 flex items-center justify-between">
            <span>Parametric Tonal Ranges</span>
            <span className="text-slate-500 font-mono text-[10px]">4-Band Control</span>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Highlights</span>
              <span className="font-mono text-[11px] text-slate-300">{parametric.highlights > 0 ? `+${parametric.highlights}` : parametric.highlights}</span>
            </div>
            <input
              type="range"
              min={-100}
              max={100}
              value={parametric.highlights}
              onChange={(e) => updateParametricField('highlights', Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Lights</span>
              <span className="font-mono text-[11px] text-slate-300">{parametric.lights > 0 ? `+${parametric.lights}` : parametric.lights}</span>
            </div>
            <input
              type="range"
              min={-100}
              max={100}
              value={parametric.lights}
              onChange={(e) => updateParametricField('lights', Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-400"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Darks</span>
              <span className="font-mono text-[11px] text-slate-300">{parametric.darks > 0 ? `+${parametric.darks}` : parametric.darks}</span>
            </div>
            <input
              type="range"
              min={-100}
              max={100}
              value={parametric.darks}
              onChange={(e) => updateParametricField('darks', Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-violet-400"
            />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Shadows</span>
              <span className="font-mono text-[11px] text-slate-300">{parametric.shadows > 0 ? `+${parametric.shadows}` : parametric.shadows}</span>
            </div>
            <input
              type="range"
              min={-100}
              max={100}
              value={parametric.shadows}
              onChange={(e) => updateParametricField('shadows', Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-400"
            />
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between text-[11px] text-slate-500">
          <span>Click line to add anchor point</span>
          <button
            onClick={resetCurrentChannel}
            className="flex items-center gap-1 text-slate-400 hover:text-rose-400 font-semibold"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset {activeChannel.toUpperCase()}</span>
          </button>
        </div>
      )}

      {curveMode === 'parametric' && (
        <button
          onClick={resetCurrentChannel}
          className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs text-slate-400 hover:text-rose-400 font-semibold"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset Parametric Curves</span>
        </button>
      )}
    </div>
  );
};
