import React from 'react';
import { Stamp, Square, Grid } from 'lucide-react';
import { WatermarkSettings, BorderSettings } from '../../../types/editor';

interface WatermarkPanelProps {
  watermark: WatermarkSettings;
  border: BorderSettings;
  onChangeWatermark: (w: WatermarkSettings) => void;
  onChangeBorder: (b: BorderSettings) => void;
}

const POSITIONS = [
  'top-left', 'top-center', 'top-right',
  'center',
  'bottom-left', 'bottom-center', 'bottom-right'
] as const;

export const WatermarkPanel: React.FC<WatermarkPanelProps> = ({
  watermark,
  border,
  onChangeWatermark,
  onChangeBorder,
}) => {
  return (
    <div className="p-4 space-y-6 select-none overflow-y-auto max-h-full pb-16">
      {/* Watermark Section */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
          <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <Stamp className="w-3.5 h-3.5 text-indigo-400" />
            Signature / Text Watermark
          </span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={watermark.enabled}
              onChange={(e) => onChangeWatermark({ ...watermark, enabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-8 h-4 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
        </div>

        {watermark.enabled && (
          <div className="space-y-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <div>
              <label className="text-[11px] font-semibold text-slate-400">Watermark Text</label>
              <input
                type="text"
                value={watermark.text}
                onChange={(e) => onChangeWatermark({ ...watermark, text: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 outline-none focus:border-indigo-500 mt-1"
              />
            </div>

            {/* Position 9-Grid */}
            <div>
              <label className="text-[11px] font-semibold text-slate-400">Anchor Position</label>
              <div className="grid grid-cols-3 gap-1.5 mt-1">
                {POSITIONS.map((pos) => (
                  <button
                    key={pos}
                    onClick={() => onChangeWatermark({ ...watermark, position: pos })}
                    className={`py-1 text-[10px] font-bold uppercase rounded border transition-colors ${
                      watermark.position === pos
                        ? 'bg-indigo-600 text-white border-indigo-500'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    {pos.replace('-', ' ')}
                  </button>
                ))}
              </div>
            </div>

            {/* Opacity Slider */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Opacity</span>
                <span className="font-mono text-indigo-300">{watermark.opacity}%</span>
              </div>
              <input
                type="range"
                min={10}
                max={100}
                value={watermark.opacity}
                onChange={(e) => onChangeWatermark({ ...watermark, opacity: Number(e.target.value) })}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>

            {/* Font Size */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Font Size</span>
                <span className="font-mono text-indigo-300">{watermark.fontSize}pt</span>
              </div>
              <input
                type="range"
                min={12}
                max={72}
                value={watermark.fontSize}
                onChange={(e) => onChangeWatermark({ ...watermark, fontSize: Number(e.target.value) })}
                className="w-full accent-indigo-500 cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>

      {/* Frame & Border Section */}
      <div className="space-y-3.5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
          <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
            <Square className="w-3.5 h-3.5 text-amber-400" />
            Border & Frame Mat
          </span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={border.enabled}
              onChange={(e) => onChangeBorder({ ...border, enabled: e.target.checked })}
              className="sr-only peer"
            />
            <div className="w-8 h-4 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-amber-500"></div>
          </label>
        </div>

        {border.enabled && (
          <div className="space-y-3 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
            <div>
              <label className="text-[11px] font-semibold text-slate-400">Frame Style</label>
              <div className="grid grid-cols-2 gap-1.5 mt-1">
                {(['solid', 'polaroid', 'film', 'minimal'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => onChangeBorder({ ...border, type })}
                    className={`py-1.5 text-xs font-bold capitalize rounded-lg border transition-colors ${
                      border.type === type
                        ? 'bg-amber-500 text-slate-950 border-amber-400'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    {type === 'film' ? 'Film Negative' : type}
                  </button>
                ))}
              </div>
            </div>

            {/* Border Size */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-slate-400">
                <span>Frame Thickness</span>
                <span className="font-mono text-amber-300">{border.size}px</span>
              </div>
              <input
                type="range"
                min={4}
                max={80}
                value={border.size}
                onChange={(e) => onChangeBorder({ ...border, size: Number(e.target.value) })}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
