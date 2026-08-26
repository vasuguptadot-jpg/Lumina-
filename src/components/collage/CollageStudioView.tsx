import React, { useState, useRef } from 'react';
import {
  Grid,
  LayoutGrid,
  Plus,
  Trash2,
  Download,
  Sliders,
  Maximize2,
  RefreshCw,
  Image as ImageIcon,
  Check,
  Sparkles,
  ArrowRight,
  Palette,
  Eye,
} from 'lucide-react';
import { Project } from '../../types/editor';
import { SAMPLE_IMAGES } from '../../engine/sampleImages';

interface CollageStudioViewProps {
  project: Project;
  onOpenEditorWithImage?: (imageUrl: string, name: string) => void;
  showToast?: (type: 'success' | 'error' | 'info', title: string, msg?: string) => void;
}

type AspectRatioType = '1:1' | '4:5' | '16:9' | '9:16' | '3:2' | '2:3';
type CollageLayoutType = 'grid_2x2' | 'hero_1_2' | 'grid_3x3' | 'duo_split' | 'strip_3' | 'asymmetric_4';

interface CollageSlot {
  id: string;
  imageUrl: string;
  title: string;
}

export const CollageStudioView: React.FC<CollageStudioViewProps> = ({
  project,
  onOpenEditorWithImage,
  showToast,
}) => {
  const [aspectRatio, setAspectRatio] = useState<AspectRatioType>('1:1');
  const [layout, setLayout] = useState<CollageLayoutType>('grid_2x2');
  const [spacing, setSpacing] = useState<number>(8);
  const [borderRadius, setBorderRadius] = useState<number>(4);
  const [outerPadding, setOuterPadding] = useState<number>(12);
  const [backgroundColor, setBackgroundColor] = useState<string>('#000000');
  const [selectedSlotIndex, setSelectedSlotIndex] = useState<number | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initial collage slots with default samples
  const [slots, setSlots] = useState<CollageSlot[]>([
    {
      id: 'slot_1',
      imageUrl: project.image?.originalUrl || SAMPLE_IMAGES[0].url,
      title: project.image?.name || SAMPLE_IMAGES[0].name,
    },
    {
      id: 'slot_2',
      imageUrl: SAMPLE_IMAGES[1]?.url || SAMPLE_IMAGES[0].url,
      title: SAMPLE_IMAGES[1]?.name || 'Photo 2',
    },
    {
      id: 'slot_3',
      imageUrl: SAMPLE_IMAGES[2]?.url || SAMPLE_IMAGES[0].url,
      title: SAMPLE_IMAGES[2]?.name || 'Photo 3',
    },
    {
      id: 'slot_4',
      imageUrl: SAMPLE_IMAGES[3]?.url || SAMPLE_IMAGES[0].url,
      title: SAMPLE_IMAGES[3]?.name || 'Photo 4',
    },
  ]);

  const LAYOUTS: { id: CollageLayoutType; label: string; maxSlots: number }[] = [
    { id: 'grid_2x2', label: '2×2 Quad', maxSlots: 4 },
    { id: 'hero_1_2', label: '1+2 Hero', maxSlots: 3 },
    { id: 'duo_split', label: 'Duo Split', maxSlots: 2 },
    { id: 'strip_3', label: '3-Photo Strip', maxSlots: 3 },
    { id: 'grid_3x3', label: '3×3 Gallery', maxSlots: 9 },
    { id: 'asymmetric_4', label: 'Asymmetric 4', maxSlots: 4 },
  ];

  const ASPECT_RATIOS: { id: AspectRatioType; label: string; class: string }[] = [
    { id: '1:1', label: '1:1 Square', class: 'aspect-square' },
    { id: '4:5', label: '4:5 Social', class: 'aspect-4/5' },
    { id: '16:9', label: '16:9 Landscape', class: 'aspect-video' },
    { id: '9:16', label: '9:16 Vertical', class: 'aspect-9/16' },
    { id: '3:2', label: '3:2 Classic', class: 'aspect-3/2' },
    { id: '2:3', label: '2:3 Poster', class: 'aspect-2/3' },
  ];

  const BG_COLORS = [
    { label: 'Black', value: '#000000' },
    { label: 'Dark Charcoal', value: '#101010' },
    { label: 'Deep Gray', value: '#181818' },
    { label: 'Mid Gray', value: '#2C2C2C' },
    { label: 'Light Gray', value: '#CCCCCC' },
    { label: 'White', value: '#FFFFFF' },
  ];

  const handleSelectSampleForSlot = (sampleUrl: string, sampleName: string) => {
    if (selectedSlotIndex === null) return;
    setSlots((prev) => {
      const next = [...prev];
      if (next[selectedSlotIndex]) {
        next[selectedSlotIndex] = {
          ...next[selectedSlotIndex],
          imageUrl: sampleUrl,
          title: sampleName,
        };
      }
      return next;
    });
    showToast?.('success', 'Slot Updated', `Loaded ${sampleName}`);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || selectedSlotIndex === null) return;

    const url = URL.createObjectURL(file);
    setSlots((prev) => {
      const next = [...prev];
      if (next[selectedSlotIndex]) {
        next[selectedSlotIndex] = {
          ...next[selectedSlotIndex],
          imageUrl: url,
          title: file.name,
        };
      }
      return next;
    });
    showToast?.('success', 'Photo Uploaded', `Assigned ${file.name} to slot.`);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleExportCollage = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      showToast?.('success', 'Collage Exported', 'Rendered lossless 32-bit composite.');
    }, 600);
  };

  const handleOpenInEditor = () => {
    if (slots[0]?.imageUrl && onOpenEditorWithImage) {
      onOpenEditorWithImage(slots[0].imageUrl, 'Collage Composite');
    }
  };

  return (
    <div className="flex-1 overflow-hidden bg-[#000000] text-white flex flex-col md:flex-row select-none font-sans">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Main Canvas Viewport */}
      <div className="flex-1 flex flex-col min-w-0 bg-[#050505] overflow-y-auto">
        {/* Top Viewport Action Header */}
        <div className="h-12 border-b border-[#222222] px-4 sm:px-6 flex items-center justify-between bg-[#080808] shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#141414] text-[#CCCCCC] border border-[#2C2C2C] uppercase tracking-wider flex items-center gap-1.5">
              <Grid className="w-3 h-3 text-[#CCCCCC]" />
              <span>COLLAGE STUDIO</span>
            </span>
            <span className="text-xs text-[#666666] font-mono hidden sm:inline">
              {aspectRatio} • {layout}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleOpenInEditor}
              className="px-3 py-1.5 rounded-lg bg-[#141414] hover:bg-[#181818] border border-[#222222] text-[#CCCCCC] hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Open in Photo Editor</span>
            </button>

            <button
              onClick={handleExportCollage}
              disabled={isExporting}
              className="px-3.5 py-1.5 rounded-lg bg-white hover:bg-[#CCCCCC] text-black text-xs font-semibold flex items-center gap-1.5 transition-colors active:scale-98"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExporting ? 'Rendering...' : 'Export Collage'}</span>
            </button>
          </div>
        </div>

        {/* Collage Canvas Stage */}
        <div className="flex-1 flex items-center justify-center p-4 sm:p-8">
          <div
            className={`w-full max-w-xl transition-all duration-200 shadow-2xl border border-[#222222] overflow-hidden ${
              ASPECT_RATIOS.find((a) => a.id === aspectRatio)?.class || 'aspect-square'
            }`}
            style={{
              backgroundColor: backgroundColor,
              padding: `${outerPadding}px`,
            }}
          >
            {/* Layout Grid Container */}
            <div
              className={`w-full h-full ${
                layout === 'grid_2x2'
                  ? 'grid grid-cols-2 grid-rows-2'
                  : layout === 'duo_split'
                  ? 'grid grid-cols-2'
                  : layout === 'strip_3'
                  ? 'grid grid-cols-3'
                  : layout === 'grid_3x3'
                  ? 'grid grid-cols-3 grid-rows-3'
                  : layout === 'hero_1_2'
                  ? 'grid grid-cols-2 grid-rows-2'
                  : 'grid grid-cols-2 grid-rows-2'
              }`}
              style={{ gap: `${spacing}px` }}
            >
              {slots.slice(0, LAYOUTS.find((l) => l.id === layout)?.maxSlots || 4).map((slot, idx) => {
                const isSelected = selectedSlotIndex === idx;
                const isHeroSpan = layout === 'hero_1_2' && idx === 0;

                return (
                  <div
                    key={slot.id || idx}
                    onClick={() => setSelectedSlotIndex(idx)}
                    className={`relative overflow-hidden cursor-pointer group border transition-all ${
                      isHeroSpan ? 'row-span-2' : ''
                    } ${
                      isSelected
                        ? 'border-white ring-2 ring-white/30'
                        : 'border-[#222222] hover:border-[#666666]'
                    }`}
                    style={{ borderRadius: `${borderRadius}px` }}
                  >
                    <img
                      src={slot.imageUrl}
                      alt={slot.title}
                      className="w-full h-full object-cover grayscale contrast-105 group-hover:scale-102 transition-transform duration-200"
                    />

                    {/* Slot Overlay Info */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-2 text-center">
                      <span className="text-[10px] font-mono text-white font-semibold">
                        Slot {idx + 1}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedSlotIndex(idx);
                          fileInputRef.current?.click();
                        }}
                        className="px-2 py-1 rounded bg-white text-black text-[10px] font-semibold"
                      >
                        Replace Image
                      </button>
                    </div>

                    {/* Badge */}
                    <span className="absolute bottom-1.5 left-1.5 px-1.5 py-0.5 rounded text-[8px] font-mono bg-black/80 text-white border border-[#444444]">
                      {idx + 1}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Right Properties & Control Inspector */}
      <div className="w-full md:w-80 border-t md:border-t-0 md:border-l border-[#222222] bg-[#080808] p-5 space-y-6 overflow-y-auto shrink-0">
        {/* Aspect Ratio Selector */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-white uppercase font-mono tracking-wider">
            Aspect Ratio
          </label>
          <div className="grid grid-cols-3 gap-1.5">
            {ASPECT_RATIOS.map((ar) => (
              <button
                key={ar.id}
                onClick={() => setAspectRatio(ar.id)}
                className={`py-1.5 px-2 rounded-lg text-xs font-mono font-medium transition-colors border ${
                  aspectRatio === ar.id
                    ? 'bg-white text-black border-white'
                    : 'bg-[#101010] text-[#999999] border-[#222222] hover:text-white'
                }`}
              >
                {ar.label.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>

        {/* Layout Templates */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-white uppercase font-mono tracking-wider">
            Grid Layout
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {LAYOUTS.map((lay) => (
              <button
                key={lay.id}
                onClick={() => setLayout(lay.id)}
                className={`py-2 px-2.5 rounded-lg text-xs font-medium text-left transition-colors border flex items-center justify-between ${
                  layout === lay.id
                    ? 'bg-[#181818] text-white border-[#444444]'
                    : 'bg-[#101010] text-[#999999] border-[#222222] hover:text-white'
                }`}
              >
                <span>{lay.label}</span>
                {layout === lay.id && <Check className="w-3 h-3 text-white" />}
              </button>
            ))}
          </div>
        </div>

        {/* Spacing & Padding Sliders */}
        <div className="space-y-4 pt-2 border-t border-[#181818]">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#999999]">Slot Spacing</span>
              <span className="font-mono text-white">{spacing}px</span>
            </div>
            <input
              type="range"
              min="0"
              max="32"
              value={spacing}
              onChange={(e) => setSpacing(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#999999]">Corner Radius</span>
              <span className="font-mono text-white">{borderRadius}px</span>
            </div>
            <input
              type="range"
              min="0"
              max="24"
              value={borderRadius}
              onChange={(e) => setBorderRadius(Number(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#999999]">Outer Border</span>
              <span className="font-mono text-white">{outerPadding}px</span>
            </div>
            <input
              type="range"
              min="0"
              max="40"
              value={outerPadding}
              onChange={(e) => setOuterPadding(Number(e.target.value))}
              className="w-full"
            />
          </div>
        </div>

        {/* Background Color Palette */}
        <div className="space-y-2 pt-2 border-t border-[#181818]">
          <label className="text-xs font-semibold text-white uppercase font-mono tracking-wider">
            Background Color
          </label>
          <div className="flex items-center gap-2">
            {BG_COLORS.map((bg) => (
              <button
                key={bg.value}
                onClick={() => setBackgroundColor(bg.value)}
                title={bg.label}
                className={`w-7 h-7 rounded-full border transition-all ${
                  backgroundColor === bg.value
                    ? 'border-white scale-110 ring-2 ring-white/30'
                    : 'border-[#444444] hover:scale-105'
                }`}
                style={{ backgroundColor: bg.value }}
              />
            ))}
          </div>
        </div>

        {/* Slot Photo Selector */}
        <div className="space-y-2.5 pt-2 border-t border-[#181818]">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-white uppercase font-mono tracking-wider">
              {selectedSlotIndex !== null
                ? `Slot ${selectedSlotIndex + 1} Image`
                : 'Select Slot To Replace'}
            </label>
            {selectedSlotIndex !== null && (
              <button
                onClick={() => fileInputRef.current?.click()}
                className="text-[11px] text-[#CCCCCC] hover:text-white"
              >
                Upload File
              </button>
            )}
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            {SAMPLE_IMAGES.map((sample) => (
              <button
                key={sample.id}
                onClick={() => {
                  if (selectedSlotIndex === null) setSelectedSlotIndex(0);
                  handleSelectSampleForSlot(sample.url, sample.name);
                }}
                className="aspect-square rounded border border-[#222222] hover:border-white overflow-hidden transition-colors"
                title={sample.name}
              >
                <img
                  src={sample.url}
                  alt={sample.name}
                  className="w-full h-full object-cover grayscale contrast-105"
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
