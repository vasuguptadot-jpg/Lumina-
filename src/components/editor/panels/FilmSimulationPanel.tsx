import React, { useState } from 'react';
import {
  Film,
  Sparkles,
  Sliders,
  Flame,
  Sun,
  Layers,
  RotateCcw,
  Camera,
  CheckCircle2,
  Calendar,
  Zap,
  Box,
  Eye,
  ShieldCheck,
  Disc,
} from 'lucide-react';
import { Project } from '../../../types/editor';
import {
  FilmSimulationOptions,
  requestAiFilmSimulation,
} from '../../../services/aiService';

interface FilmSimulationPanelProps {
  project: Project;
  onUpdateImage: (newUrl: string, name?: string) => void;
  isAiProcessing: boolean;
  setIsAiProcessing: (loading: boolean) => void;
  showToast: (type: 'success' | 'error' | 'info', title: string, msg?: string) => void;
}

interface FilmStockDef {
  id: FilmSimulationOptions['filmStock'];
  name: string;
  brand: 'KODAK' | 'FUJIFILM' | 'CINESTILL' | 'POLAROID' | 'ILFORD' | 'VINTAGE';
  type: string;
  iso: string;
  palette: string[];
  desc: string;
  defaultGrain: number;
  defaultGrainSize: 'fine' | 'medium' | 'coarse';
  defaultHalation: number;
  defaultBloom: number;
  defaultCurve: FilmSimulationOptions['filmCurve'];
  defaultWarmShift: number;
  defaultGreenMagenta: number;
  defaultBorder?: FilmSimulationOptions['instantBorder'];
}

const FILM_STOCKS: FilmStockDef[] = [
  {
    id: 'kodak-portra-400',
    name: 'Kodak Portra 400',
    brand: 'KODAK',
    type: 'Color Negative',
    iso: 'ISO 400',
    palette: ['#e4a87b', '#f5d6ba', '#6c969d', '#2c3e50'],
    desc: 'The gold standard portrait emulsion. Luminous warm skin tones, subtle cyan shadows, and creamy highlight roll-off.',
    defaultGrain: 35,
    defaultGrainSize: 'fine',
    defaultHalation: 30,
    defaultBloom: 25,
    defaultCurve: 'classic-s-curve',
    defaultWarmShift: 15,
    defaultGreenMagenta: -5,
  },
  {
    id: 'cinestill-800t',
    name: 'CineStill 800T',
    brand: 'CINESTILL',
    type: 'Motion Picture',
    iso: 'ISO 800',
    palette: ['#ff4d2e', '#2979ff', '#1a237e', '#ffab40'],
    desc: 'Legendary tungsten-balanced 35mm cinema stock with signature fiery red/orange halation around specular light sources & neon.',
    defaultGrain: 55,
    defaultGrainSize: 'medium',
    defaultHalation: 80,
    defaultBloom: 45,
    defaultCurve: 'punchy-contrast',
    defaultWarmShift: -20,
    defaultGreenMagenta: 10,
  },
  {
    id: 'kodak-gold-200',
    name: 'Kodak Gold 200',
    brand: 'KODAK',
    type: 'Consumer Negative',
    iso: 'ISO 200',
    palette: ['#fbc02d', '#d32f2f', '#388e3c', '#5d4037'],
    desc: 'Golden-hour holiday nostalgia. Warm amber yellows, saturated reds, punchy midtones, and forgiving vintage latitude.',
    defaultGrain: 45,
    defaultGrainSize: 'medium',
    defaultHalation: 25,
    defaultBloom: 20,
    defaultCurve: 'classic-s-curve',
    defaultWarmShift: 35,
    defaultGreenMagenta: 5,
  },
  {
    id: 'fuji-velvia-50',
    name: 'Fujifilm Velvia 50',
    brand: 'FUJIFILM',
    type: 'Slide Film',
    iso: 'ISO 50',
    palette: ['#00796b', '#c2185b', '#0288d1', '#fbc02d'],
    desc: 'Ultra-vivid reversal slide film. Emerald greens, deep magenta skies, high dynamic contrast, and micro-fine grain.',
    defaultGrain: 20,
    defaultGrainSize: 'fine',
    defaultHalation: 15,
    defaultBloom: 10,
    defaultCurve: 'punchy-contrast',
    defaultWarmShift: 5,
    defaultGreenMagenta: 15,
  },
  {
    id: 'fuji-classic-chrome',
    name: 'Fujifilm Classic Chrome',
    brand: 'FUJIFILM',
    type: 'Color Negative',
    iso: 'ISO 400',
    palette: ['#78909c', '#8d6e63', '#455a64', '#cfd8dc'],
    desc: 'Documentary magazine tonality. Restrained muted saturation, deep dramatic sky gradients, and hard shadow roll-off.',
    defaultGrain: 30,
    defaultGrainSize: 'fine',
    defaultHalation: 20,
    defaultBloom: 15,
    defaultCurve: 'classic-s-curve',
    defaultWarmShift: -10,
    defaultGreenMagenta: -10,
  },
  {
    id: 'kodak-tri-x-400',
    name: 'Kodak Tri-X 400',
    brand: 'KODAK',
    type: 'B&W Negative',
    iso: 'ISO 400',
    palette: ['#000000', '#424242', '#9e9e9e', '#ffffff'],
    desc: 'Iconic street photography monochrome. Gritty textured silver grain, deep inky blacks, and razor-sharp tonal edge separation.',
    defaultGrain: 65,
    defaultGrainSize: 'coarse',
    defaultHalation: 20,
    defaultBloom: 20,
    defaultCurve: 'punchy-contrast',
    defaultWarmShift: 0,
    defaultGreenMagenta: 0,
  },
  {
    id: 'disposable-camera-35mm',
    name: '90s Disposable Camera',
    brand: 'VINTAGE',
    type: 'Consumer Snapshot',
    iso: 'ISO 400',
    palette: ['#ff9800', '#4caf50', '#03a9f4', '#f44336'],
    desc: 'Direct camera flash look, slightly lifted green/amber shadow noise, soft plastic lens falloff, and nostalgic snapshot vibe.',
    defaultGrain: 60,
    defaultGrainSize: 'medium',
    defaultHalation: 40,
    defaultBloom: 30,
    defaultCurve: 'matte-lifted-blacks',
    defaultWarmShift: 25,
    defaultGreenMagenta: -15,
  },
  {
    id: 'polaroid-600',
    name: 'Polaroid 600 Instant',
    brand: 'POLAROID',
    type: 'Instant Emulsion',
    iso: 'ISO 640',
    palette: ['#ffccbc', '#b0bec5', '#ffe082', '#90caf9'],
    desc: 'Chemical dye-diffusion instant transfer. Creamy pastel highlights, softened focus, gentle color shift, and authentic instant chemistry.',
    defaultGrain: 40,
    defaultGrainSize: 'medium',
    defaultHalation: 35,
    defaultBloom: 40,
    defaultCurve: 'matte-lifted-blacks',
    defaultWarmShift: 20,
    defaultGreenMagenta: -5,
    defaultBorder: 'polaroid-classic-white',
  },
  {
    id: 'polaroid-sx70',
    name: 'Polaroid SX-70 Time-Zero',
    brand: 'POLAROID',
    type: 'Instant Emulsion',
    iso: 'ISO 160',
    palette: ['#d7ccc8', '#8d6e63', '#a1887f', '#efebe9'],
    desc: 'Warm vintage instant chemistry with softened cyan-cast deep blacks and characteristic chemical development edge fade.',
    defaultGrain: 45,
    defaultGrainSize: 'medium',
    defaultHalation: 30,
    defaultBloom: 35,
    defaultCurve: 'matte-lifted-blacks',
    defaultWarmShift: 30,
    defaultGreenMagenta: -10,
    defaultBorder: 'polaroid-vintage-aged',
  },
  {
    id: 'instax-mini',
    name: 'Fujifilm Instax Mini',
    brand: 'FUJIFILM',
    type: 'Instant Emulsion',
    iso: 'ISO 800',
    palette: ['#ffffff', '#ff80ab', '#80d8ff', '#ffd180'],
    desc: 'Modern crisp instant rendering with cheerful color saturation, bright clean highlights, and distinct vertical framing.',
    defaultGrain: 30,
    defaultGrainSize: 'fine',
    defaultHalation: 25,
    defaultBloom: 25,
    defaultCurve: 'classic-s-curve',
    defaultWarmShift: 10,
    defaultGreenMagenta: 5,
    defaultBorder: 'instax-mini-white',
  },
  {
    id: 'kodak-ektar-100',
    name: 'Kodak Ektar 100',
    brand: 'KODAK',
    type: 'Color Negative',
    iso: 'ISO 100',
    palette: ['#d50000', '#0091ea', '#ffd600', '#00c853'],
    desc: 'World’s finest grain color negative. Ultra-vivid saturation, striking architectural precision, and saturated primary pigments.',
    defaultGrain: 15,
    defaultGrainSize: 'fine',
    defaultHalation: 15,
    defaultBloom: 10,
    defaultCurve: 'punchy-contrast',
    defaultWarmShift: 10,
    defaultGreenMagenta: 0,
  },
  {
    id: 'fuji-superia-400',
    name: 'Fujifilm Superia X-TRA 400',
    brand: 'FUJIFILM',
    type: 'Color Negative',
    iso: 'ISO 400',
    palette: ['#2e7d32', '#c2185b', '#1565c0', '#fbc02d'],
    desc: '4th color layer technology with distinctive green/magenta dye coupler response and crisp daylight sharpness.',
    defaultGrain: 40,
    defaultGrainSize: 'medium',
    defaultHalation: 25,
    defaultBloom: 20,
    defaultCurve: 'classic-s-curve',
    defaultWarmShift: -5,
    defaultGreenMagenta: 15,
  },
  {
    id: 'ilford-hp5',
    name: 'Ilford HP5 Plus 400',
    brand: 'ILFORD',
    type: 'B&W Negative',
    iso: 'ISO 400',
    palette: ['#111111', '#555555', '#aaaaaa', '#eeeeee'],
    desc: 'Smooth mid-grey tonal gradation, forgiving exposure latitude, and beautiful organic silver grain for fine art photography.',
    defaultGrain: 50,
    defaultGrainSize: 'medium',
    defaultHalation: 15,
    defaultBloom: 15,
    defaultCurve: 'classic-s-curve',
    defaultWarmShift: 0,
    defaultGreenMagenta: 0,
  },
];

const ONE_CLICK_RECIPES = [
  {
    name: '90s Summer Flash',
    icon: '📸',
    stock: 'disposable-camera-35mm',
    grain: 65,
    halation: 40,
    bloom: 35,
    curve: 'matte-lifted-blacks' as const,
    dateStamp: true,
    dateText: "'98 08 16",
    lightLeak: true,
    border: 'none' as const,
  },
  {
    name: 'Tokyo Cyber Night',
    icon: '🏮',
    stock: 'cinestill-800t',
    grain: 55,
    halation: 90,
    bloom: 50,
    curve: 'punchy-contrast' as const,
    dateStamp: false,
    dateText: '',
    lightLeak: false,
    border: 'film-sprocket-35mm' as const,
  },
  {
    name: 'Golden Hour Portra',
    icon: '🌅',
    stock: 'kodak-portra-400',
    grain: 30,
    halation: 30,
    bloom: 25,
    curve: 'classic-s-curve' as const,
    dateStamp: false,
    dateText: '',
    lightLeak: false,
    border: 'none' as const,
  },
  {
    name: 'Aged Polaroid Nostalgia',
    icon: '🖼️',
    stock: 'polaroid-sx70',
    grain: 45,
    halation: 35,
    bloom: 40,
    curve: 'matte-lifted-blacks' as const,
    dateStamp: false,
    dateText: '',
    lightLeak: true,
    border: 'polaroid-vintage-aged' as const,
  },
  {
    name: 'Street Noir Tri-X',
    icon: '🕶️',
    stock: 'kodak-tri-x-400',
    grain: 75,
    halation: 15,
    bloom: 15,
    curve: 'punchy-contrast' as const,
    dateStamp: false,
    dateText: '',
    lightLeak: false,
    border: 'contact-sheet-black' as const,
  },
];

export const FilmSimulationPanel: React.FC<FilmSimulationPanelProps> = ({
  project,
  onUpdateImage,
  isAiProcessing,
  setIsAiProcessing,
  showToast,
}) => {
  // Selected Stock
  const [selectedStockId, setSelectedStockId] = useState<FilmSimulationOptions['filmStock']>('kodak-portra-400');

  // Sub-Navigation Tab
  const [activeSubTab, setActiveSubTab] = useState<'stocks' | 'grain-optics' | 'color-curves' | 'borders-artifacts'>('stocks');

  // Grain & Optical Emulsion
  const [grainAmount, setGrainAmount] = useState<number>(35);
  const [grainSize, setGrainSize] = useState<'fine' | 'medium' | 'coarse'>('fine');
  const [halationAmount, setHalationAmount] = useState<number>(30);
  const [bloomAmount, setBloomAmount] = useState<number>(25);

  // Characteristic Curve & Color Science
  const [filmCurve, setFilmCurve] = useState<FilmSimulationOptions['filmCurve']>('classic-s-curve');
  const [warmShift, setWarmShift] = useState<number>(15);
  const [greenMagentaShift, setGreenMagentaShift] = useState<number>(-5);
  const [highlightRollOff, setHighlightRollOff] = useState<number>(65);

  // Instant Borders & Darkroom Artifacts
  const [instantBorder, setInstantBorder] = useState<FilmSimulationOptions['instantBorder']>('none');
  const [dateStampEnabled, setDateStampEnabled] = useState<boolean>(false);
  const [dateStampText, setDateStampText] = useState<string>("'98 08 16");
  const [dustScratches, setDustScratches] = useState<number>(0);
  const [lightLeakEnabled, setLightLeakEnabled] = useState<boolean>(false);
  const [lightLeakWarmth, setLightLeakWarmth] = useState<number>(75);

  // Custom Prompt
  const [customNotes, setCustomNotes] = useState<string>('');

  const currentStock = FILM_STOCKS.find((s) => s.id === selectedStockId) || FILM_STOCKS[0];

  // Select Stock handler
  const handleSelectStock = (stock: FilmStockDef) => {
    setSelectedStockId(stock.id);
    setGrainAmount(stock.defaultGrain);
    setGrainSize(stock.defaultGrainSize);
    setHalationAmount(stock.defaultHalation);
    setBloomAmount(stock.defaultBloom);
    setFilmCurve(stock.defaultCurve);
    setWarmShift(stock.defaultWarmShift);
    setGreenMagentaShift(stock.defaultGreenMagenta);
    if (stock.defaultBorder) {
      setInstantBorder(stock.defaultBorder);
    }
    showToast('info', `Selected: ${stock.name}`, `${stock.type} (${stock.iso}) emulation parameters loaded.`);
  };

  // Apply Quick Recipe
  const handleApplyRecipe = (recipe: typeof ONE_CLICK_RECIPES[0]) => {
    const stock = FILM_STOCKS.find((s) => s.id === recipe.stock);
    if (stock) {
      setSelectedStockId(stock.id);
      setGrainAmount(recipe.grain);
      setHalationAmount(recipe.halation);
      setBloomAmount(recipe.bloom);
      setFilmCurve(recipe.curve);
      setDateStampEnabled(recipe.dateStamp);
      if (recipe.dateText) setDateStampText(recipe.dateText);
      setLightLeakEnabled(recipe.lightLeak);
      setInstantBorder(recipe.border);
      showToast('info', `Recipe Applied: ${recipe.name}`, 'Emulsion parameters calibrated.');
    }
  };

  // Reset to current stock defaults
  const handleResetStockDefaults = () => {
    handleSelectStock(currentStock);
    setDateStampEnabled(false);
    setDustScratches(0);
    setLightLeakEnabled(false);
    setInstantBorder('none');
    setCustomNotes('');
    showToast('info', 'Stock Reset', 'Restored default stock photochemical parameters.');
  };

  // Execute AI Film Simulation
  const handleExecuteFilmSimulation = async () => {
    const canvas = document.querySelector('canvas') as HTMLCanvasElement | null;
    if (!canvas) return;

    setIsAiProcessing(true);
    showToast(
      'info',
      'Simulating Analog Emulsion',
      `Processing ${currentStock.name} photochemical grain, halation & spectral response...`
    );

    try {
      const base64 = canvas.toDataURL('image/png');
      const res = await requestAiFilmSimulation(base64, {
        filmStock: selectedStockId,
        grainAmount,
        grainSize,
        halationAmount,
        bloomAmount,
        filmCurve,
        colorScience: {
          warmShift,
          greenMagentaShift,
          highlightRollOff,
        },
        instantBorder,
        dateStamp: {
          enabled: dateStampEnabled,
          text: dateStampText,
        },
        dustScratches,
        lightLeak: {
          enabled: lightLeakEnabled,
          warmth: lightLeakWarmth,
        },
        customNotes: customNotes.trim() || undefined,
      });

      if (res.success && res.imageUrl) {
        onUpdateImage(res.imageUrl, `Film_${selectedStockId}_${project.name}`);
        showToast('success', 'Film Emulsion Rendered', `${currentStock.name} chemistry applied with full optical fidelity.`);
      } else {
        showToast('error', 'Simulation Failed', res.message || res.error);
      }
    } catch (err: any) {
      showToast('error', 'AI Error', err.message);
    } finally {
      setIsAiProcessing(false);
    }
  };

  return (
    <div className="p-4 space-y-4 select-none text-slate-200">
      {/* Studio Header */}
      <div className="bg-gradient-to-br from-amber-950/70 via-slate-900 to-red-950/60 border border-amber-500/30 p-3.5 rounded-2xl space-y-3 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <Film className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-black text-amber-300 uppercase tracking-wide">
                Analog Film Simulation Studio
              </div>
              <div className="text-[10px] text-slate-400">
                Portra, CineStill halation, Velvia, Tri-X, Polaroid & 35mm sprockets
              </div>
            </div>
          </div>

          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
            EMULSION LAB
          </span>
        </div>

        {/* 1-Click Iconic Recipes Carousel */}
        <div className="space-y-1.5 pt-1 border-t border-slate-800/80">
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            <span>⚡ 1-Click Iconic Film Recipes</span>
            <button
              onClick={handleResetStockDefaults}
              className="text-[9px] text-amber-400 hover:text-amber-300 flex items-center gap-1"
            >
              <RotateCcw className="w-2.5 h-2.5" />
              <span>Reset</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
            {ONE_CLICK_RECIPES.map((recipe) => (
              <button
                key={recipe.name}
                onClick={() => handleApplyRecipe(recipe)}
                className="px-2.5 py-1.5 rounded-xl bg-slate-950/80 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/50 text-[11px] font-medium text-slate-300 hover:text-amber-200 transition-all flex items-center gap-1.5 shrink-0"
              >
                <span>{recipe.icon}</span>
                <span className="whitespace-nowrap">{recipe.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-2xl border border-slate-800 text-xs font-bold overflow-x-auto scrollbar-none shadow-inner">
        {[
          { id: 'stocks', label: 'Film Stocks', icon: Film },
          { id: 'grain-optics', label: 'Grain & Halation', icon: Flame },
          { id: 'color-curves', label: 'Color & Curves', icon: Sliders },
          { id: 'borders-artifacts', label: 'Borders & Artifacts', icon: Box },
        ].map((tab) => {
          const Icon = tab.icon;
          const isSelected = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
                isSelected
                  ? 'bg-gradient-to-r from-amber-600 to-red-600 text-white shadow-md shadow-amber-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 1. FILM STOCKS BROWSER */}
      {activeSubTab === 'stocks' && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 px-0.5">
            <span>Select Emulsion Stock ({FILM_STOCKS.length})</span>
            <span className="text-[10px] text-amber-400 font-mono">Photochemical Match</span>
          </div>

          <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800">
            {FILM_STOCKS.map((stock) => {
              const isSelected = selectedStockId === stock.id;
              return (
                <button
                  key={stock.id}
                  onClick={() => handleSelectStock(stock)}
                  className={`w-full p-3 rounded-2xl border text-left transition-all space-y-1.5 group shadow-sm ${
                    isSelected
                      ? 'bg-slate-900 border-amber-500 ring-1 ring-amber-500/50'
                      : 'bg-slate-900/60 border-slate-800 hover:bg-slate-900 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-200 group-hover:text-amber-300 transition-colors">
                        {stock.name}
                      </span>
                      <span
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${
                          stock.brand === 'KODAK'
                            ? 'bg-amber-950/60 text-amber-300 border-amber-500/30'
                            : stock.brand === 'FUJIFILM'
                            ? 'bg-emerald-950/60 text-emerald-300 border-emerald-500/30'
                            : stock.brand === 'CINESTILL'
                            ? 'bg-red-950/60 text-red-300 border-red-500/30'
                            : stock.brand === 'POLAROID'
                            ? 'bg-blue-950/60 text-blue-300 border-blue-500/30'
                            : 'bg-slate-950 text-slate-300 border-slate-700'
                        }`}
                      >
                        {stock.brand}
                      </span>
                      <span className="text-[9px] text-slate-400 font-mono">{stock.iso}</span>
                    </div>

                    {/* Color Swatch Dots */}
                    <div className="flex items-center gap-1">
                      {stock.palette.map((color, i) => (
                        <span
                          key={i}
                          className="w-2.5 h-2.5 rounded-full border border-black/40 shadow-xs"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-400 leading-relaxed">{stock.desc}</p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. GRAIN & HALATION OPTICS */}
      {activeSubTab === 'grain-optics' && (
        <div className="space-y-3 bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-amber-400" />
              <span>Silver-Halide Grain & Red Halation Bleed</span>
            </span>
          </div>

          {/* Film Grain Amount */}
          <div className="space-y-1 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium">Silver-Halide Grain Amount</span>
              <span className="text-[11px] font-mono font-bold text-amber-400">{grainAmount}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={grainAmount}
              onChange={(e) => setGrainAmount(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>

          {/* Grain Particle Size */}
          <div className="space-y-1 bg-slate-950/60 p-2 rounded-xl border border-slate-800/80">
            <div className="flex items-center justify-between text-xs pb-1">
              <span className="text-slate-300 font-medium">Grain Structure & Size</span>
              <span className="text-[10px] font-mono text-amber-400 capitalize">{grainSize}</span>
            </div>
            <div className="grid grid-cols-3 gap-1.5 text-xs">
              {(['fine', 'medium', 'coarse'] as const).map((sz) => (
                <button
                  key={sz}
                  onClick={() => setGrainSize(sz)}
                  className={`py-1.5 rounded-lg border font-semibold capitalize transition-all ${
                    grainSize === sz
                      ? 'bg-amber-950 text-amber-300 border-amber-500/50'
                      : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                  }`}
                >
                  {sz}
                </button>
              ))}
            </div>
          </div>

          {/* Anti-Halation Red Glow */}
          <div className="space-y-1 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium flex items-center gap-1">
                <span>🔴 CineStill / Film Halation (Rem-Jet Bleed)</span>
              </span>
              <span className="text-[11px] font-mono font-bold text-red-400">{halationAmount}%</span>
            </div>
            <p className="text-[9px] text-slate-400 pb-1">
              Fiery red-orange photonic bleed around specular highlights and light bulbs.
            </p>
            <input
              type="range"
              min={0}
              max={100}
              value={halationAmount}
              onChange={(e) => setHalationAmount(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-red-500"
            />
          </div>

          {/* Optical Highlight Bloom */}
          <div className="space-y-1 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium">Optical Highlight Diffusion & Bloom</span>
              <span className="text-[11px] font-mono font-bold text-amber-400">{bloomAmount}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={bloomAmount}
              onChange={(e) => setBloomAmount(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>
        </div>
      )}

      {/* 3. COLOR SCIENCE & CURVES */}
      {activeSubTab === 'color-curves' && (
        <div className="space-y-3 bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              <span>Photochemical Curves & Spectral Science</span>
            </span>
          </div>

          {/* Film Curve Selector */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Emulsion Characteristic Curve (D-Log H):
            </label>
            <div className="grid grid-cols-2 gap-1.5 text-xs">
              {[
                { id: 'classic-s-curve', label: 'Classic S-Curve', desc: 'Smooth toe & shoulder' },
                { id: 'matte-lifted-blacks', label: 'Matte Lifted Blacks', desc: 'Faded vintage black point' },
                { id: 'punchy-contrast', label: 'Punchy Slide Curve', desc: 'Deep dynamic impact' },
                { id: 'soft-faded-highlights', label: 'Soft Pastel Roll-Off', desc: 'Zero digital clipping' },
              ].map((curve) => (
                <button
                  key={curve.id}
                  onClick={() => setFilmCurve(curve.id as any)}
                  className={`p-2 rounded-xl border text-left transition-all ${
                    filmCurve === curve.id
                      ? 'bg-slate-950 border-amber-500 text-amber-300 font-bold ring-1 ring-amber-500/50'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="text-[11px] font-semibold">{curve.label}</div>
                  <div className="text-[9px] text-slate-500 truncate">{curve.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Spectral Warm / Cool Shift */}
          <div className="space-y-1 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium">Spectral Color Bias (Cool / Warm)</span>
              <span className="text-[11px] font-mono font-bold text-amber-400">
                {warmShift > 0 ? `+${warmShift} Warm` : `${warmShift} Cool`}
              </span>
            </div>
            <input
              type="range"
              min={-50}
              max={50}
              value={warmShift}
              onChange={(e) => setWarmShift(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>

          {/* Green / Magenta Dye Coupler Shift */}
          <div className="space-y-1 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium">Dye Coupler Tint (Green / Magenta)</span>
              <span className="text-[11px] font-mono font-bold text-amber-400">
                {greenMagentaShift > 0 ? `+${greenMagentaShift} Mag` : `${greenMagentaShift} Grn`}
              </span>
            </div>
            <input
              type="range"
              min={-50}
              max={50}
              value={greenMagentaShift}
              onChange={(e) => setGreenMagentaShift(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>

          {/* Highlight Roll-off */}
          <div className="space-y-1 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium">Analog Highlight Compression</span>
              <span className="text-[11px] font-mono font-bold text-amber-400">{highlightRollOff}%</span>
            </div>
            <input
              type="range"
              min={10}
              max={100}
              value={highlightRollOff}
              onChange={(e) => setHighlightRollOff(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>
        </div>
      )}

      {/* 4. INSTANT BORDERS & ARTIFACTS */}
      {activeSubTab === 'borders-artifacts' && (
        <div className="space-y-3 bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
              <Box className="w-3.5 h-3.5 text-amber-400" />
              <span>Instant Borders, Sprockets & Darkroom Patina</span>
            </span>
          </div>

          {/* Border Styles */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Film Borders & Framing:
            </label>
            <div className="grid grid-cols-3 gap-1.5 text-xs">
              {[
                { id: 'none', label: 'Frameless', icon: '◻️' },
                { id: 'polaroid-classic-white', label: 'Polaroid Classic', icon: '🖼️' },
                { id: 'polaroid-vintage-aged', label: 'Aged SX-70', icon: '📜' },
                { id: 'instax-mini-white', label: 'Instax Mini', icon: '🎴' },
                { id: 'film-sprocket-35mm', label: '35mm Sprockets', icon: '🎞️' },
                { id: 'contact-sheet-black', label: 'Contact Sheet', icon: '⬛' },
              ].map((b) => (
                <button
                  key={b.id}
                  onClick={() => setInstantBorder(b.id as any)}
                  className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 text-center transition-all ${
                    instantBorder === b.id
                      ? 'bg-slate-950 border-amber-500 text-amber-300 font-bold ring-1 ring-amber-500/50'
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="text-sm">{b.icon}</span>
                  <span className="text-[10px] truncate leading-tight">{b.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 90s LED Date Stamp Switch & Text */}
          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 space-y-2">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-400" />
                  <span>90s Orange LED Date Stamp</span>
                </div>
                <div className="text-[9px] text-slate-400">Vintage camera quartz date display</div>
              </div>
              <input
                type="checkbox"
                checked={dateStampEnabled}
                onChange={(e) => setDateStampEnabled(e.target.checked)}
                className="w-4 h-4 rounded accent-amber-500 cursor-pointer shrink-0"
              />
            </div>

            {dateStampEnabled && (
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[10px] text-slate-400 font-mono">STAMP:</span>
                <input
                  type="text"
                  value={dateStampText}
                  onChange={(e) => setDateStampText(e.target.value)}
                  placeholder="'98 08 16"
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs font-mono text-amber-400 outline-none focus:border-amber-500"
                />
              </div>
            )}
          </div>

          {/* Light Leak Toggle */}
          <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80 flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-orange-400" />
                <span>Analog Camera Light Leak</span>
              </div>
              <div className="text-[9px] text-slate-400">Warm ruby/amber edge streak flare</div>
            </div>
            <input
              type="checkbox"
              checked={lightLeakEnabled}
              onChange={(e) => setLightLeakEnabled(e.target.checked)}
              className="w-4 h-4 rounded accent-amber-500 cursor-pointer shrink-0"
            />
          </div>

          {/* Dust & Scratches */}
          <div className="space-y-1 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/80">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-300 font-medium">Darkroom Dust & Negative Scratches</span>
              <span className="text-[11px] font-mono font-bold text-amber-400">{dustScratches}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={dustScratches}
              onChange={(e) => setDustScratches(Number(e.target.value))}
              className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
            />
          </div>
        </div>
      )}

      {/* Custom Emulsion Guidance */}
      <div className="space-y-1">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
          Custom Photochemical Guidance (Optional):
        </label>
        <input
          type="text"
          placeholder="e.g. Extra halation around neon signs, faded pastel tones in shadows"
          value={customNotes}
          onChange={(e) => setCustomNotes(e.target.value)}
          className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 outline-none focus:border-amber-500 transition-colors"
        />
      </div>

      {/* Primary Action Button */}
      <button
        onClick={handleExecuteFilmSimulation}
        disabled={isAiProcessing}
        className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-orange-600 to-red-600 hover:from-amber-400 hover:via-orange-500 hover:to-red-500 text-white text-xs font-bold rounded-2xl transition-all shadow-lg shadow-amber-600/30 disabled:opacity-40 flex items-center justify-center gap-2"
      >
        <Sparkles className={`w-4 h-4 ${isAiProcessing ? 'animate-spin' : ''}`} />
        <span>{isAiProcessing ? 'Simulating Film Emulsion...' : `Apply ${currentStock.name}`}</span>
      </button>
    </div>
  );
};
