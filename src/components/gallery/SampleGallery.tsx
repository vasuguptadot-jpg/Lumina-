import React from 'react';
import { Sparkles, Camera, Image as ImageIcon, ArrowRight } from 'lucide-react';
import { SAMPLE_IMAGES, createSampleImageFile } from '../../engine/sampleImages';
import { Project } from '../../types/editor';
import { DEFAULT_PROJECT_STATE } from '../../engine/defaultSettings';

interface SampleGalleryProps {
  onLoadSample: (project: Project) => void;
}

export const SampleGallery: React.FC<SampleGalleryProps> = ({ onLoadSample }) => {
  const handleSelect = (sample: (typeof SAMPLE_IMAGES)[0]) => {
    const imgFile = createSampleImageFile(sample);
    const newProject: Project = {
      ...DEFAULT_PROJECT_STATE,
      id: `proj_${Date.now()}`,
      name: sample.name,
      image: imgFile,
      updatedAt: Date.now(),
      createdAt: Date.now(),
      history: [
        {
          id: 'step_init',
          timestamp: Date.now(),
          label: `Opened ${sample.name}`,
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
    };

    onLoadSample(newProject);
  };

  return (
    <div className="flex-1 h-full bg-slate-950 p-6 overflow-y-auto select-none">
      <div className="max-w-6xl mx-auto space-y-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-indigo-400" />
            Curated Demo Photo Gallery
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Test Lumina Studio Pro with high-dynamic range landscapes, editorial portraits, simulated 14-bit RAW sensor data, and night photography.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 pb-12">
          {SAMPLE_IMAGES.map((sample) => (
            <div
              key={sample.id}
              onClick={() => handleSelect(sample)}
              className="bg-slate-900 border border-slate-800 hover:border-indigo-500/60 rounded-2xl overflow-hidden shadow-xl hover:shadow-indigo-500/10 cursor-pointer transition-all duration-200 group flex flex-col justify-between"
            >
              <div className="relative aspect-[16/10] overflow-hidden bg-slate-950">
                <img
                  src={sample.url}
                  alt={sample.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute top-3 left-3 bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-bold text-amber-300 uppercase tracking-wider border border-white/10">
                  {sample.category}
                </div>
                <div className="absolute bottom-3 right-3 bg-black/75 backdrop-blur-md px-2 py-0.5 rounded text-[10px] font-mono text-slate-300">
                  {sample.width} × {sample.height} px
                </div>
              </div>

              <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white group-hover:text-indigo-300 transition-colors">
                    {sample.name}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {sample.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-indigo-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                    Open in Editor <ArrowRight className="w-3 h-3" />
                  </span>
                  <span className="text-[10px] uppercase font-mono text-slate-500">
                    {sample.isRaw ? '14-BIT RAW' : 'JPEG PRO'}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
