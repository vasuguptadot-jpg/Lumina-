import React, { useState } from 'react';
import {
  Sparkles,
  Eraser,
  Image as ImageIcon,
  Wand2,
  Sun,
  Users,
  Zap,
  Type,
  Car,
  EyeOff,
  Trash2,
  Layers,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  HelpCircle,
  Scissors,
  Flame,
  Maximize2,
  Palette,
  Focus,
  Lightbulb,
  Camera,
  Compass,
  PlusCircle,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  Move,
  ShoppingBag,
  Dog,
  Building,
  Watch,
  Paintbrush,
  RefreshCw,
  Sliders,
  Scaling,
  Smile,
  Eye,
  Activity,
  Moon,
  Grid,
  FileCheck,
  PaintBucket,
  VolumeX,
  History,
  Check,
  Brain,
} from 'lucide-react';
import { AdjustmentSettings, Project } from '../../../types/editor';
import { AIImageUnderstandingPanel } from './AIImageUnderstandingPanel';
import {
  requestAiAutoEnhance,
  requestAiBackgroundReplacement,
  requestAiBackgroundRemoval,
  requestAiBackgroundExpansion,
  requestAiBackgroundRelighting,
  requestAiBackgroundBlur,
  requestAiStyleTransfer,
  requestAiSmartRemoval,
  requestAiObjectRemoval,
  requestAiGenerativeFill,
  requestAiGenerativeReplace,
  requestAiGenerativeAdd,
  requestAiGenerativeExpandDirection,
  requestAiEnhanceImage,
  EnhanceImageOptions,
} from '../../../services/aiService';

interface AIToolsPanelProps {
  project: Project;
  onUpdateSettings: (settings: AdjustmentSettings) => void;
  onUpdateImage: (newUrl: string, name?: string) => void;
  isAiProcessing: boolean;
  setIsAiProcessing: (loading: boolean) => void;
  showToast: (type: 'success' | 'error' | 'info', title: string, msg?: string) => void;
}

// Generative Fill Presets
const GEN_FILL_IDEAS = [
  { label: 'Black Sports Car', prompt: 'A sleek matte black sports car parked naturally with matching asphalt reflections and perspective' },
  { label: 'Artisan Coffee Cup', prompt: 'A steaming cup of artisan latte with detailed foam art in a ceramic mug on the surface' },
  { label: 'Campfire Glow', prompt: 'A warm crackling campfire with glowing embers, wood logs, and ambient orange illumination' },
  { label: 'Fresh Flower Bouquet', prompt: 'A lush blooming bouquet of pastel roses, peonies, and eucalyptus in a clear glass vase' },
  { label: 'Vintage Film Camera', prompt: 'A classic mechanical 35mm rangefinder camera with brass patina resting on the table' },
  { label: 'Neon Cyberpunk Sign', prompt: 'A glowing neon sign emitting vibrant cyan and magenta light reflections on nearby surfaces' },
  { label: 'Golden Fireworks', prompt: 'Dazzling golden fireworks exploding in the night sky with glowing sparkle trails' },
  { label: 'Floating Paper Lanterns', prompt: 'Warm glowing illuminated paper lanterns floating serenely into the evening sky' },
];

// Generative Replace Templates
const GEN_REPLACE_TEMPLATES = [
  {
    category: 'Clothing & Outfits',
    items: [
      { original: 'shirt / top', replacement: 'a stylish black leather motorcycle jacket with metallic zippers', label: 'Black Leather Jacket' },
      { original: 'casual outfit', replacement: 'an elegant bespoke black tailored tuxedo suit with satin lapels', label: 'Tailored Tuxedo' },
      { original: 'dress', replacement: 'a flowing crimson red silk evening gown with graceful fabric folds', label: 'Red Silk Gown' },
      { original: 'jacket', replacement: 'a warm vintage sheepskin shearling aviator jacket', label: 'Shearling Aviator' },
    ],
  },
  {
    category: 'Accessories & Eyewear',
    items: [
      { original: 'glasses / eyewear', replacement: 'high-end classic gold-rimmed aviator sunglasses with gradient tint', label: 'Gold Aviators' },
      { original: 'wristwatch', replacement: 'a luxury Swiss chronometer wristwatch with solid gold bezel', label: 'Gold Chronometer' },
      { original: 'hat / headwear', replacement: 'a classic handcrafted Panama straw hat with a black grosgrain band', label: 'Panama Straw Hat' },
      { original: 'bag / purse', replacement: 'a minimalist dark brown full-grain leather tote bag', label: 'Leather Tote' },
    ],
  },
  {
    category: 'Vehicles & Environment',
    items: [
      { original: 'car / vehicle', replacement: 'a pristine cherry red vintage sports convertible coupe', label: 'Red Sports Convertible' },
      { original: 'chair / seat', replacement: 'a modern mid-century Bauhaus leather lounge armchair with steel frame', label: 'Modern Bauhaus Chair' },
      { original: 'table surface', replacement: 'a polished Carrara white marble countertop with subtle grey veining', label: 'White Marble Surface' },
      { original: 'wallpaper / wall', replacement: 'a luxury dark acoustic wood slat accent wall with warm LED backlighting', label: 'Wood Slat Wall' },
    ],
  },
];

// Generative Add Categories
const GEN_ADD_CATEGORIES = [
  {
    id: 'Vehicles',
    icon: Car,
    items: [
      { name: 'Black Sports Car', prompt: 'a glossy high-performance black sports car with sleek aerodynamic curves and rim reflections' },
      { name: 'Vintage Vespa', prompt: 'a mint green retro 1960s Italian Vespa scooter with chrome mirrors and leather seat' },
      { name: 'Luxury Yacht', prompt: 'a modern white luxury superyacht cruising smoothly on turquoise ocean water' },
      { name: 'Classic Convertible', prompt: 'a vintage 1957 red convertible coupe parked under soft sunlight' },
    ],
  },
  {
    id: 'Objects',
    icon: ShoppingBag,
    items: [
      { name: 'Vintage Camera', prompt: 'a classic retro mechanical 35mm rangefinder camera with leather strap' },
      { name: 'Artisan Latte', prompt: 'a steaming white ceramic cup of specialty latte with rosette latte art' },
      { name: 'Apple MacBook', prompt: 'a sleek space grey aluminum laptop open and resting naturally on the desk' },
      { name: 'Rose Bouquet', prompt: 'a fresh blooming bouquet of pastel garden roses in a textured ceramic vase' },
      { name: 'Retro Record Player', prompt: 'a vintage wooden turntable record player spinning a black vinyl record' },
    ],
  },
  {
    id: 'People',
    icon: Users,
    items: [
      { name: 'Fashion Model', prompt: 'an elegant high-fashion model posing gracefully in contemporary designer attire' },
      { name: 'Street Photographer', prompt: 'a casual photographer looking through a camera viewfinder in natural lighting' },
      { name: 'Smiling Tourist', prompt: 'a joyful tourist with a casual backpack taking in the surrounding scenery' },
      { name: 'Ambient Crowd', prompt: 'a soft, naturally blurred background crowd of people enjoying an outdoor plaza' },
    ],
  },
  {
    id: 'Animals',
    icon: Dog,
    items: [
      { name: 'Golden Retriever', prompt: 'a cheerful golden retriever dog with silky golden fur sitting contentedly' },
      { name: 'Playful Kitten', prompt: 'an adorable fluffy calico kitten with bright curious eyes' },
      { name: 'Majestic Eagle', prompt: 'a majestic bald eagle with sharp plumage perched nobly' },
      { name: 'White Stallion', prompt: 'a noble white horse with a flowing mane standing in golden sunlight' },
      { name: 'Tropical Macaw', prompt: 'a vibrant scarlet macaw parrot with rich red, yellow, and blue feathers' },
    ],
  },
  {
    id: 'Buildings',
    icon: Building,
    items: [
      { name: 'Glass Skyscraper', prompt: 'a towering futuristic modern architectural skyscraper reflecting sky and clouds' },
      { name: 'Stone Castle', prompt: 'a historic European medieval stone fortress castle on a distant misty hill' },
      { name: 'Mountain Cabin', prompt: 'a cozy rustic Scandinavian timber log cabin with warm glowing windows' },
      { name: 'Modern Villa', prompt: 'a luxury minimalist concrete and glass cantilevered architectural villa' },
      { name: 'Coastal Lighthouse', prompt: 'a picturesque red-and-white striped coastal lighthouse on rocky cliffs' },
    ],
  },
  {
    id: 'Accessories',
    icon: Watch,
    items: [
      { name: 'Gold Aviators', prompt: 'designer sunglasses with gold titanium wireframes and warm tinted lenses' },
      { name: 'Luxury Chronograph', prompt: 'a high-end luxury Swiss automatic chronograph wristwatch with sapphire crystal' },
      { name: 'Leather Duffel', prompt: 'a rugged vintage brown full-grain leather weekender travel bag' },
      { name: 'Straw Sun Hat', prompt: 'a chic woven wide-brim straw sun hat casting a soft sun dappled shadow' },
    ],
  },
  {
    id: 'Lighting',
    icon: Sun,
    items: [
      { name: 'Golden Hour Sunflare', prompt: 'dramatic warm optical lens flare and golden sunset rays breaking across the scene' },
      { name: 'Cyberpunk Neon Glow', prompt: 'vibrant dual-tone cyan and hot magenta neon light bounce and atmospheric fog' },
      { name: 'Volumetric God Rays', prompt: 'cinematic volumetric sunbeams streaming through atmospheric haze and dust motes' },
      { name: 'Dramatic Spotlight', prompt: 'a focused warm overhead studio key spotlight with high-contrast chiaroscuro shadows' },
      { name: 'Dreamy Fairy Lights', prompt: 'soft out-of-focus golden string bokeh lights twinkling delicately in the background' },
    ],
  },
];

const PRESET_BACKDROPS = [
  { id: 'tokyo-cyber', name: 'Futuristic Tokyo Night', prompt: 'Futuristic Tokyo street at night with glowing neon signs in cyan and magenta, wet asphalt reflections, tall cyberpunk skyscrapers, atmospheric fog and bokeh depth of field', icon: '🌃', category: 'Sci-Fi' },
  { id: 'modern-studio', name: 'Minimalist Photo Studio', prompt: 'Clean high-end modern minimalist photo studio with warm wooden flooring and soft diffused daylight from large windows', icon: '🏛️', category: 'Studio' },
  { id: 'sunset-beach', name: 'Golden Hour Beach', prompt: 'Scenic coastal beach with gentle turquoise waves at sunset, golden warm sunlight rays, soft bokeh background', icon: '🌅', category: 'Nature' },
  { id: 'luxury-penthouse', name: 'Manhattan Penthouse', prompt: 'Luxury modern penthouse living room with floor-to-ceiling glass windows overlooking the Manhattan city skyline at dusk with warm ambient lights', icon: '🏙️', category: 'Urban' },
  { id: 'botanical-garden', name: 'Lush Botanical Greenhouse', prompt: 'Lush tropical glass botanical greenhouse filled with exotic monstera leaves, soft misty morning backlight', icon: '🌿', category: 'Nature' },
  { id: 'nordic-minimal', name: 'Nordic Architectural Loft', prompt: 'Spacious Scandinavian concrete loft with minimalist furniture, organic stone textures, warm ambient lighting', icon: '🛋️', category: 'Studio' },
  { id: 'santorini-sea', name: 'Santorini Balcony', prompt: 'Sun-drenched white Santorini cliffside terrace overlooking the deep blue Aegean sea under bright Mediterranean sunshine', icon: '🇬🇷', category: 'Travel' },
  { id: 'dark-slate', name: 'Moody Dark Slate Studio', prompt: 'Dark textured slate wall photography studio with subtle rim lighting and dramatic studio vignette', icon: '⬛', category: 'Studio' },
];

const SMART_REMOVAL_PRESETS = [
  {
    id: 'people' as const,
    name: 'People & Photobombers',
    description: 'Detects & removes background tourists, pedestrians, and passersby + ground shadows',
    icon: Users,
    badge: 'Auto-Detect',
    color: 'text-rose-400 bg-rose-950/40 border-rose-500/30',
  },
  {
    id: 'wires' as const,
    name: 'Power Lines & Wires',
    description: 'Detects & removes overhead electrical cables, telephone wires, and utility poles',
    icon: Zap,
    badge: 'Sky Clean',
    color: 'text-amber-400 bg-amber-950/40 border-amber-500/30',
  },
  {
    id: 'text' as const,
    name: 'Text & Watermarks',
    description: 'Detects & removes timestamps, copyright logos, subtitles, watermarks, and stickers',
    icon: Type,
    badge: 'OCR Inpaint',
    color: 'text-cyan-400 bg-cyan-950/40 border-cyan-500/30',
  },
  {
    id: 'vehicles' as const,
    name: 'Vehicles & Traffic',
    description: 'Detects & removes parked cars, traffic cones, bicycles, and road clutter',
    icon: Car,
    badge: 'Urban',
    color: 'text-emerald-400 bg-emerald-950/40 border-emerald-500/30',
  },
  {
    id: 'reflections' as const,
    name: 'Reflections & Glare',
    description: 'Detects & removes unwanted glass reflections, window bounce, and lens glare',
    icon: EyeOff,
    badge: 'Anti-Glare',
    color: 'text-purple-400 bg-purple-950/40 border-purple-500/30',
  },
  {
    id: 'clutter' as const,
    name: 'Background Clutter',
    description: 'Detects & cleans trash bins, street signs, debris, and visual distractions',
    icon: Trash2,
    badge: 'Studio Polish',
    color: 'text-blue-400 bg-blue-950/40 border-blue-500/30',
  },
];

// Enhancement Tool Presets & Quick Actions
const ENHANCEMENT_TOOLS = [
  {
    id: 'super-resolution',
    name: 'Super Resolution',
    description: 'AI neural upscaling to 2×, 4×, or 8× with reconstructed micro-textures & crystal clarity',
    icon: Scaling,
    badge: 'UPSCALE',
    color: 'text-indigo-400 bg-indigo-950/50 border-indigo-500/30',
  },
  {
    id: 'face-restoration',
    name: 'Face Restoration',
    description: 'Reconstruct crystal-clear eyes, natural irises, teeth, eyelashes, and skin pores',
    icon: Smile,
    badge: 'PORTRAIT',
    color: 'text-rose-400 bg-rose-950/50 border-rose-500/30',
  },
  {
    id: 'detail-reconstruction',
    name: 'Detail Reconstruction',
    description: 'Synthesize fine micro-details across fabrics, hair, foliage, materials, and typography',
    icon: Focus,
    badge: 'SYNTHESIS',
    color: 'text-purple-400 bg-purple-950/50 border-purple-500/30',
  },
  {
    id: 'sharpening',
    name: 'Lens Sharpening',
    description: 'Correct optical lens diffraction, softness, and slight focus inaccuracies',
    icon: Activity,
    badge: 'OPTICS',
    color: 'text-blue-400 bg-blue-950/50 border-blue-500/30',
  },
  {
    id: 'deblurring',
    name: 'AI Deblurring',
    description: 'Invert optical point spread function to recover sharp geometric silhouettes & text',
    icon: Eye,
    badge: 'CLARITY',
    color: 'text-cyan-400 bg-cyan-950/50 border-cyan-500/30',
  },
  {
    id: 'motion-deblur',
    name: 'Motion Deblur',
    description: 'Eliminate camera shake, panning smear, and fast subject motion blur',
    icon: Move,
    badge: 'SHAKE FIX',
    color: 'text-emerald-400 bg-emerald-950/50 border-emerald-500/30',
  },
  {
    id: 'low-light',
    name: 'Low-Light Enhance',
    description: 'Lift underexposed dark scenes, recover shadow detail & suppress night noise',
    icon: Moon,
    badge: 'NIGHT PRO',
    color: 'text-amber-400 bg-amber-950/50 border-amber-500/30',
  },
  {
    id: 'jpeg-artifact-removal',
    name: 'JPEG Artifact Clean',
    description: 'Remove 8x8 DCT blockiness, mosquito noise, ringing, and gradient banding',
    icon: Grid,
    badge: 'DE-BLOCK',
    color: 'text-violet-400 bg-violet-950/50 border-violet-500/30',
  },
  {
    id: 'old-photo-restoration',
    name: 'Old Photo Restore',
    description: 'Repair vintage prints: fix cracks, tears, fading, chemical stains & yellowing',
    icon: History,
    badge: 'ARCHIVE',
    color: 'text-yellow-400 bg-yellow-950/50 border-yellow-500/30',
  },
  {
    id: 'scratch-restoration',
    name: 'Scratch Restoration',
    description: 'Scan and eliminate paper scratch lines, crease folds, dust specks, and tape marks',
    icon: FileCheck,
    badge: 'CLEANUP',
    color: 'text-pink-400 bg-pink-950/50 border-pink-500/30',
  },
  {
    id: 'colorization',
    name: 'AI Colorization',
    description: 'Convert monochrome & sepia photos into photorealistic, rich full color',
    icon: PaintBucket,
    badge: 'COLORIST',
    color: 'text-teal-400 bg-teal-950/50 border-teal-500/30',
  },
  {
    id: 'denoising',
    name: 'Image Denoising',
    description: 'Suppress high-ISO sensor grain & chroma noise while protecting sharp edges',
    icon: VolumeX,
    badge: 'NOISE REDUCE',
    color: 'text-sky-400 bg-sky-950/50 border-sky-500/30',
  },
];

export const AIToolsPanel: React.FC<AIToolsPanelProps> = ({
  project,
  onUpdateSettings,
  onUpdateImage,
  isAiProcessing,
  setIsAiProcessing,
  showToast,
}) => {
  // Navigation Tabs
  const [activeSubTab, setActiveSubTab] = useState<
    'understanding' | 'enhance' | 'gen-fill' | 'gen-expand' | 'gen-replace' | 'gen-add' | 'gen-remove' | 'background' | 'auto-enhance'
  >('understanding');

  // AI Enhancement State
  const [selectedEnhancement, setSelectedEnhancement] = useState<string>('super-resolution');
  const [upscaleScale, setUpscaleScale] = useState<'2x' | '4x' | '8x'>('4x');
  const [faceRestoreToggle, setFaceRestoreToggle] = useState(true);
  const [detailReconstructToggle, setDetailReconstructToggle] = useState(true);
  const [oldPhotoScratchToggle, setOldPhotoScratchToggle] = useState(true);
  const [oldPhotoColorizeToggle, setOldPhotoColorizeToggle] = useState(false);
  const [denoiseStrength, setDenoiseStrength] = useState<'light' | 'medium' | 'strong' | 'ultra'>('medium');
  const [enhancementCustomNotes, setEnhancementCustomNotes] = useState('');

  // Generative Fill State
  const [fillPrompt, setFillPrompt] = useState('Add a black sports car.');
  const [fillBlendLighting, setFillBlendLighting] = useState(true);
  const [fillCastShadows, setFillCastShadows] = useState(true);

  // Generative Expand State
  const [expandDirection, setExpandDirection] = useState<'all' | 'left' | 'right' | 'top' | 'bottom'>('all');
  const [expandScale, setExpandScale] = useState('50%');
  const [expandCustomPrompt, setExpandCustomPrompt] = useState('');

  // Generative Replace State
  const [replaceTarget, setReplaceTarget] = useState('the shirt');
  const [replaceWith, setReplaceWith] = useState('a black leather jacket');

  // Generative Add State
  const [selectedAddCategory, setSelectedAddCategory] = useState('Vehicles');
  const [customAddPrompt, setCustomAddPrompt] = useState('');

  // Background Studio State
  const [customBgPrompt, setCustomBgPrompt] = useState('Replace the background with a futuristic Tokyo street at night.');
  const [bgHarmonizeLighting, setBgHarmonizeLighting] = useState(true);
  const [bgCastShadows, setBgCastShadows] = useState(true);

  // Generative Remove State
  const [removeShadows, setRemoveShadows] = useState(true);

  // Helper to extract image and mask from viewport canvas
  const getCanvasData = (): { imgBase64: string; maskBase64?: string } | null => {
    const canvas = document.querySelector('canvas') as HTMLCanvasElement | null;
    if (!canvas) return null;

    const imgBase64 = canvas.toDataURL('image/png');
    let maskBase64: string | undefined;

    const maskCanvas = document.getElementById('inpaint-mask-canvas') as HTMLCanvasElement | null;
    if (maskCanvas) {
      const mCtx = maskCanvas.getContext('2d');
      if (mCtx) {
        const pData = mCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height).data;
        let drawn = false;
        for (let i = 3; i < pData.length; i += 4) {
          if (pData[i] > 0) {
            drawn = true;
            break;
          }
        }
        if (drawn) {
          maskBase64 = maskCanvas.toDataURL('image/png');
        }
      }
    }

    return { imgBase64, maskBase64 };
  };

  const clearInpaintMask = () => {
    const maskCanvas = document.getElementById('inpaint-mask-canvas') as HTMLCanvasElement | null;
    if (maskCanvas) {
      const mCtx = maskCanvas.getContext('2d');
      mCtx?.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
    }
  };

  // 1. AI ENHANCEMENT HANDLER
  const handleExecuteEnhancement = async (overrideType?: string) => {
    const activeType = (overrideType || selectedEnhancement) as EnhanceImageOptions['type'];
    const data = getCanvasData();
    if (!data) return;

    const toolMeta = ENHANCEMENT_TOOLS.find((t) => t.id === activeType) || ENHANCEMENT_TOOLS[0];

    setIsAiProcessing(true);
    showToast(
      'info',
      `AI Enhancement: ${toolMeta.name}`,
      `Running neural processing for ${toolMeta.name.toLowerCase()}...`
    );

    try {
      const res = await requestAiEnhanceImage(data.imgBase64, {
        type: activeType,
        scale: upscaleScale,
        faceRestoration: faceRestoreToggle,
        detailReconstruction: detailReconstructToggle,
        removeScratches: oldPhotoScratchToggle,
        colorize: oldPhotoColorizeToggle,
        denoiseStrength,
        customNotes: enhancementCustomNotes.trim() || undefined,
      });

      if (res.success && res.imageUrl) {
        onUpdateImage(res.imageUrl, `Enhanced_${toolMeta.name}_${project.name}`);
        showToast(
          'success',
          `${toolMeta.name} Complete`,
          'High-fidelity photographic enhancement applied.'
        );
      } else {
        showToast('error', 'Enhancement Failed', res.message || res.error);
      }
    } catch (err: any) {
      showToast('error', 'AI Error', err.message);
    } finally {
      setIsAiProcessing(false);
    }
  };

  // 2. GENERATIVE FILL
  const handleExecuteGenerativeFill = async (promptToUse?: string) => {
    const activePrompt = promptToUse || fillPrompt;
    if (!activePrompt.trim()) return;

    const data = getCanvasData();
    if (!data) return;

    setIsAiProcessing(true);
    showToast('info', 'Generative Fill', `Synthesizing "${activePrompt}" with perspective and shadow blending...`);

    try {
      const res = await requestAiGenerativeFill(data.imgBase64, {
        prompt: activePrompt,
        maskBase64: data.maskBase64,
        blendLighting: fillBlendLighting,
        castShadows: fillCastShadows,
      });

      if (res.success && res.imageUrl) {
        onUpdateImage(res.imageUrl, `GenFill_${project.name}`);
        clearInpaintMask();
        showToast('success', 'Generative Fill Complete', 'Element synthesized and composited seamlessly.');
      } else {
        showToast('error', 'Generative Fill Failed', res.message || res.error);
      }
    } catch (err: any) {
      showToast('error', 'AI Error', err.message);
    } finally {
      setIsAiProcessing(false);
    }
  };

  // 3. GENERATIVE EXPAND (DIRECTIONAL)
  const handleExecuteGenerativeExpand = async () => {
    const data = getCanvasData();
    if (!data) return;

    setIsAiProcessing(true);
    const dirLabel =
      expandDirection === 'all'
        ? 'All Directions'
        : expandDirection.charAt(0).toUpperCase() + expandDirection.slice(1);
    showToast('info', 'Generative Expand', `Extrapolating scenery outwards (${dirLabel}, +${expandScale})...`);

    try {
      const res = await requestAiGenerativeExpandDirection(
        data.imgBase64,
        expandDirection,
        expandScale,
        expandCustomPrompt.trim() || undefined
      );

      if (res.success && res.imageUrl) {
        onUpdateImage(res.imageUrl, `GenExpand_${project.name}`);
        showToast('success', 'Canvas Expanded', `Scenery extrapolated seamlessly ${dirLabel.toLowerCase()}.`);
      } else {
        showToast('error', 'Expansion Failed', res.message || res.error);
      }
    } catch (err: any) {
      showToast('error', 'AI Error', err.message);
    } finally {
      setIsAiProcessing(false);
    }
  };

  // 4. GENERATIVE REPLACE
  const handleExecuteGenerativeReplace = async (orig?: string, rep?: string) => {
    const targetObj = orig || replaceTarget;
    const replacement = rep || replaceWith;
    if (!replacement.trim()) return;

    const data = getCanvasData();
    if (!data) return;

    setIsAiProcessing(true);
    showToast('info', 'Generative Replace', `Replacing ${targetObj || 'target'} with "${replacement}"...`);

    try {
      const res = await requestAiGenerativeReplace(
        data.imgBase64,
        replacement,
        data.maskBase64,
        targetObj || undefined
      );

      if (res.success && res.imageUrl) {
        onUpdateImage(res.imageUrl, `GenReplace_${project.name}`);
        clearInpaintMask();
        showToast('success', 'Generative Replace Complete', 'Element swapped with realistic texture and fit.');
      } else {
        showToast('error', 'Replacement Failed', res.message || res.error);
      }
    } catch (err: any) {
      showToast('error', 'AI Error', err.message);
    } finally {
      setIsAiProcessing(false);
    }
  };

  // 5. GENERATIVE ADD
  const handleExecuteGenerativeAdd = async (category: string, promptToAdd: string) => {
    const data = getCanvasData();
    if (!data) return;

    setIsAiProcessing(true);
    showToast('info', `Generative Add (${category})`, `Synthesizing "${promptToAdd}"...`);

    try {
      const res = await requestAiGenerativeAdd(data.imgBase64, {
        category,
        prompt: promptToAdd,
        maskBase64: data.maskBase64,
        blendLighting: true,
        castShadows: true,
      });

      if (res.success && res.imageUrl) {
        onUpdateImage(res.imageUrl, `GenAdd_${project.name}`);
        clearInpaintMask();
        showToast('success', 'Element Added', `Generated and composited "${promptToAdd}" harmoniously.`);
      } else {
        showToast('error', 'Generation Failed', res.message || res.error);
      }
    } catch (err: any) {
      showToast('error', 'AI Error', err.message);
    } finally {
      setIsAiProcessing(false);
    }
  };

  // 6. GENERATIVE REMOVE (PROMPT-FREE + PRESETS)
  const handlePromptFreeRemove = async () => {
    const data = getCanvasData();
    if (!data) return;

    setIsAiProcessing(true);
    showToast('info', 'Generative Remove', 'Detecting masked object, eliminating shadows, and synthesizing background...');

    try {
      const res = await requestAiObjectRemoval(data.imgBase64, data.maskBase64 || '', {
        removeShadows,
      });

      if (res.success && res.imageUrl) {
        onUpdateImage(res.imageUrl, `GenRemoved_${project.name}`);
        clearInpaintMask();
        showToast('success', 'Object Erased', 'Clean background reconstructed with matching grain.');
      } else {
        showToast('error', 'Removal Failed', res.message || res.error);
      }
    } catch (err: any) {
      showToast('error', 'AI Error', err.message);
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleSmartPresetRemove = async (presetId: any) => {
    const data = getCanvasData();
    if (!data) return;

    setIsAiProcessing(true);
    showToast('info', 'AI Smart Detect & Remove', `Scanning image for ${presetId}...`);

    try {
      const res = await requestAiSmartRemoval(data.imgBase64, presetId, undefined, removeShadows);
      if (res.success && res.imageUrl) {
        onUpdateImage(res.imageUrl, `Cleaned_${presetId}_${project.name}`);
        showToast('success', 'Smart Removal Complete', `All ${presetId} removed seamlessly.`);
      } else {
        showToast('error', 'Smart Removal Failed', res.message || res.error);
      }
    } catch (err: any) {
      showToast('error', 'AI Error', err.message);
    } finally {
      setIsAiProcessing(false);
    }
  };

  // 7. BACKGROUND STUDIO REPLACEMENT
  const handleReplaceBackground = async (promptText: string) => {
    const data = getCanvasData();
    if (!data) return;

    setIsAiProcessing(true);
    showToast('info', 'Synthesizing Background', 'Isolating subject, generating environment, and harmonizing lighting...');

    try {
      const res = await requestAiBackgroundReplacement(data.imgBase64, {
        backgroundPrompt: promptText,
        harmonizeLighting: bgHarmonizeLighting,
        castShadows: bgCastShadows,
      });

      if (res.success && res.imageUrl) {
        onUpdateImage(res.imageUrl, `BG_${project.name}`);
        showToast('success', 'Background Replaced', 'Subject blended into new environment.');
      } else {
        showToast('error', 'Replacement Failed', res.message || res.error);
      }
    } catch (err: any) {
      showToast('error', 'AI Error', err.message);
    } finally {
      setIsAiProcessing(false);
    }
  };

  // 8. AUTO-ENHANCE MASTER COLORIST
  const handleAutoEnhance = async () => {
    const data = getCanvasData();
    if (!data) return;

    setIsAiProcessing(true);
    showToast('info', 'AI Colorist Analysis', 'Analyzing dynamic range, histogram balance, and exposure...');

    try {
      const res = await requestAiAutoEnhance(data.imgBase64);
      if (res.success && res.data) {
        const d = res.data;
        onUpdateSettings({
          ...project.settings,
          exposure: d.exposure ?? project.settings.exposure,
          brightness: d.brightness ?? project.settings.brightness,
          contrast: d.contrast ?? project.settings.contrast,
          highlights: d.highlights ?? project.settings.highlights,
          shadows: d.shadows ?? project.settings.shadows,
          whites: d.whites ?? project.settings.whites,
          blacks: d.blacks ?? project.settings.blacks,
          temperature: d.temperature ?? project.settings.temperature,
          tint: d.tint ?? project.settings.tint,
          saturation: d.saturation ?? project.settings.saturation,
          vibrance: d.vibrance ?? project.settings.vibrance,
          clarity: d.clarity ?? project.settings.clarity,
          sharpness: d.sharpness ?? project.settings.sharpness,
          vignette: d.vignette ?? project.settings.vignette,
        });
        showToast('success', 'Master Enhancements Applied', d.analysis || 'Exposure, contrast, and color balanced.');
      } else {
        showToast('error', 'Enhancement Failed', res.error);
      }
    } catch (err: any) {
      showToast('error', 'AI Error', err.message);
    } finally {
      setIsAiProcessing(false);
    }
  };

  return (
    <div className="p-4 space-y-4 select-none text-slate-200">
      {/* Top Generative AI Studio Sub-Navigation */}
      <div className="flex items-center gap-1 bg-slate-950 p-1.5 rounded-2xl border border-slate-800 text-xs font-bold overflow-x-auto scrollbar-none shadow-inner">
        <button
          onClick={() => setActiveSubTab('understanding')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all whitespace-nowrap ${
            activeSubTab === 'understanding'
              ? 'bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white shadow-md shadow-purple-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Brain className="w-3.5 h-3.5 text-purple-300" />
          <span>AI Vision & Fix</span>
        </button>

        <button
          onClick={() => setActiveSubTab('enhance')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all whitespace-nowrap ${
            activeSubTab === 'enhance'
              ? 'bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI Enhancement</span>
        </button>

        <button
          onClick={() => setActiveSubTab('gen-fill')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all whitespace-nowrap ${
            activeSubTab === 'gen-fill'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Paintbrush className="w-3.5 h-3.5" />
          <span>Generative Fill</span>
        </button>

        <button
          onClick={() => setActiveSubTab('gen-expand')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all whitespace-nowrap ${
            activeSubTab === 'gen-expand'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Maximize2 className="w-3.5 h-3.5" />
          <span>Expand</span>
        </button>

        <button
          onClick={() => setActiveSubTab('gen-replace')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all whitespace-nowrap ${
            activeSubTab === 'gen-replace'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Replace</span>
        </button>

        <button
          onClick={() => setActiveSubTab('gen-add')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all whitespace-nowrap ${
            activeSubTab === 'gen-add'
              ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <PlusCircle className="w-3.5 h-3.5" />
          <span>Add</span>
        </button>

        <button
          onClick={() => setActiveSubTab('gen-remove')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all whitespace-nowrap ${
            activeSubTab === 'gen-remove'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Eraser className="w-3.5 h-3.5" />
          <span>Erase</span>
        </button>

        <button
          onClick={() => setActiveSubTab('background')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all whitespace-nowrap ${
            activeSubTab === 'background'
              ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span>BG Studio</span>
        </button>

        <button
          onClick={() => setActiveSubTab('auto-enhance')}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl transition-all whitespace-nowrap ${
            activeSubTab === 'auto-enhance'
              ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Wand2 className="w-3.5 h-3.5" />
          <span>Colorist</span>
        </button>
      </div>

      {/* SUBTAB: AI IMAGE UNDERSTANDING & EDIT RECOMMENDATIONS */}
      {activeSubTab === 'understanding' && (
        <AIImageUnderstandingPanel
          project={project}
          onUpdateSettings={onUpdateSettings}
          onUpdateImage={onUpdateImage}
          isAiProcessing={isAiProcessing}
          setIsAiProcessing={setIsAiProcessing}
          showToast={showToast}
        />
      )}

      {/* SUBTAB: AI ENHANCEMENT (COMPREHENSIVE MASTER SUITE) */}
      {activeSubTab === 'enhance' && (
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-cyan-950/70 via-slate-900 to-indigo-950/60 border border-cyan-500/25 p-3.5 rounded-2xl space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-cyan-300 flex items-center gap-1.5 uppercase tracking-wide">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <span>AI Photographic Enhancement Suite</span>
              </span>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                PRO NEURAL RESTORATION
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              State-of-the-art Super Resolution (2×, 4×, 8×), Facial Reconstruction, Deblurring, Low-Light Recovery, Old Photo Repair, and AI Colorization.
            </p>
          </div>

          {/* Enhancement Tool Selector Cards */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Select Enhancement Mode:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {ENHANCEMENT_TOOLS.map((tool) => {
                const Icon = tool.icon;
                const isSelected = selectedEnhancement === tool.id;
                return (
                  <button
                    key={tool.id}
                    onClick={() => setSelectedEnhancement(tool.id)}
                    className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'bg-slate-900 border-cyan-500 shadow-md shadow-cyan-500/20 ring-1 ring-cyan-500/50'
                        : 'bg-slate-900/70 hover:bg-slate-900 border-slate-800/80 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className={`p-2 rounded-xl border ${tool.color}`}>
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                        {tool.badge}
                      </span>
                    </div>
                    <div>
                      <div className={`text-xs font-bold ${isSelected ? 'text-cyan-300' : 'text-slate-200'}`}>
                        {tool.name}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-2 leading-tight">
                        {tool.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Contextual Fine-Tuning Controls based on selected tool */}
          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl space-y-3.5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-cyan-400" />
                <span>
                  {ENHANCEMENT_TOOLS.find((t) => t.id === selectedEnhancement)?.name} Options
                </span>
              </span>
              <span className="text-[10px] text-cyan-400 font-mono">NEURAL v3.7</span>
            </div>

            {/* If Super Resolution: Scale selector + Face toggle */}
            {selectedEnhancement === 'super-resolution' && (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Upscale Resolution Scale:
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(['2x', '4x', '8x'] as const).map((sc) => (
                      <button
                        key={sc}
                        onClick={() => setUpscaleScale(sc)}
                        className={`py-2 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                          upscaleScale === sc
                            ? 'bg-gradient-to-r from-cyan-600 to-indigo-600 text-white border-cyan-400 shadow-md shadow-cyan-600/30'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                        }`}
                      >
                        <Scaling className="w-3 h-3" />
                        <span>{sc.toUpperCase()} Scale</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    <input
                      type="checkbox"
                      checked={faceRestoreToggle}
                      onChange={(e) => setFaceRestoreToggle(e.target.checked)}
                      className="w-4 h-4 rounded accent-cyan-500 cursor-pointer"
                    />
                    <span className="text-slate-300 font-medium text-[11px]">Face Restoration</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    <input
                      type="checkbox"
                      checked={detailReconstructToggle}
                      onChange={(e) => setDetailReconstructToggle(e.target.checked)}
                      className="w-4 h-4 rounded accent-cyan-500 cursor-pointer"
                    />
                    <span className="text-slate-300 font-medium text-[11px]">Detail Synthesis</span>
                  </label>
                </div>
              </div>
            )}

            {/* If Old Photo Restoration: Scratches & Colorize toggles */}
            {selectedEnhancement === 'old-photo-restoration' && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <label className="flex items-center gap-2 cursor-pointer bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    <input
                      type="checkbox"
                      checked={oldPhotoScratchToggle}
                      onChange={(e) => setOldPhotoScratchToggle(e.target.checked)}
                      className="w-4 h-4 rounded accent-yellow-500 cursor-pointer"
                    />
                    <span className="text-slate-300 font-medium text-[11px]">Scratch & Tear Fix</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                    <input
                      type="checkbox"
                      checked={oldPhotoColorizeToggle}
                      onChange={(e) => setOldPhotoColorizeToggle(e.target.checked)}
                      className="w-4 h-4 rounded accent-yellow-500 cursor-pointer"
                    />
                    <span className="text-slate-300 font-medium text-[11px]">Auto Colorize</span>
                  </label>
                </div>
              </div>
            )}

            {/* If Image Denoising: Strength selector */}
            {selectedEnhancement === 'denoising' && (
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Noise Reduction Strength:
                </label>
                <div className="grid grid-cols-4 gap-1.5 text-xs font-semibold">
                  {(['light', 'medium', 'strong', 'ultra'] as const).map((lvl) => (
                    <button
                      key={lvl}
                      onClick={() => setDenoiseStrength(lvl)}
                      className={`py-1.5 rounded-lg border text-center transition-all capitalize ${
                        denoiseStrength === lvl
                          ? 'bg-cyan-600 text-white border-cyan-500 font-bold'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                      }`}
                    >
                      {lvl}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Optional Specific Guidance Box */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Special Enhancement Instructions (Optional):
              </label>
              <input
                type="text"
                placeholder="e.g. Preserve natural film grain, sharpen eyes, fix motion blur on hands"
                value={enhancementCustomNotes}
                onChange={(e) => setEnhancementCustomNotes(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 outline-none focus:border-cyan-500 transition-colors"
              />
            </div>

            {/* Main Action Button */}
            <button
              onClick={() => handleExecuteEnhancement()}
              disabled={isAiProcessing}
              className="w-full py-3 bg-gradient-to-r from-cyan-500 via-indigo-600 to-purple-600 hover:from-cyan-400 hover:via-indigo-500 hover:to-purple-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/30 disabled:opacity-40 flex items-center justify-center gap-2"
            >
              <Sparkles className={`w-4 h-4 ${isAiProcessing ? 'animate-spin' : ''}`} />
              <span>
                {isAiProcessing
                  ? 'Processing AI Enhancement...'
                  : `Execute ${ENHANCEMENT_TOOLS.find((t) => t.id === selectedEnhancement)?.name}`}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* SUBTAB: GENERATIVE FILL */}
      {activeSubTab === 'gen-fill' && (
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-indigo-950/70 via-slate-900 to-purple-950/60 border border-indigo-500/25 p-3.5 rounded-2xl space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-indigo-300 flex items-center gap-1.5 uppercase tracking-wide">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span>Generative Fill</span>
              </span>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                PRO AI INPAINT
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Select an area on canvas with the <strong>Brush</strong> or <strong>Lasso</strong>, then describe what should appear in that exact spatial perspective.
            </p>
          </div>

          {/* Prompt Box */}
          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-200">
              <span className="flex items-center gap-1.5">
                <Paintbrush className="w-3.5 h-3.5 text-indigo-400" />
                <span>Describe What Should Appear:</span>
              </span>
              <span className="text-[10px] text-slate-500 font-normal">e.g. Add a black sports car</span>
            </div>

            <textarea
              rows={2}
              placeholder="e.g. Add a black sports car with glossy paint and realistic road reflections."
              value={fillPrompt}
              onChange={(e) => setFillPrompt(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 outline-none focus:border-indigo-500 transition-colors resize-none placeholder:text-slate-600"
            />

            {/* Quick Inspiration Pills */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Quick Inspiration:</span>
              <div className="flex flex-wrap gap-1.5">
                {GEN_FILL_IDEAS.map((idea, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setFillPrompt(idea.prompt);
                    }}
                    className="text-[11px] px-2.5 py-1 rounded-lg bg-slate-950 hover:bg-indigo-600 hover:text-white text-slate-300 border border-slate-800 transition-all text-left"
                  >
                    + {idea.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Harmonization Controls */}
            <div className="pt-2.5 border-t border-slate-800 grid grid-cols-2 gap-2 text-xs">
              <label className="flex items-center gap-2 cursor-pointer bg-slate-950 p-2 rounded-xl border border-slate-800">
                <input
                  type="checkbox"
                  checked={fillBlendLighting}
                  onChange={(e) => setFillBlendLighting(e.target.checked)}
                  className="w-4 h-4 rounded accent-indigo-500 cursor-pointer"
                />
                <span className="text-slate-300 font-medium text-[11px]">Match Scene Light</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer bg-slate-950 p-2 rounded-xl border border-slate-800">
                <input
                  type="checkbox"
                  checked={fillCastShadows}
                  onChange={(e) => setFillCastShadows(e.target.checked)}
                  className="w-4 h-4 rounded accent-indigo-500 cursor-pointer"
                />
                <span className="text-slate-300 font-medium text-[11px]">Cast Contact Shadows</span>
              </label>
            </div>

            {/* Generate Button */}
            <button
              onClick={() => handleExecuteGenerativeFill()}
              disabled={!fillPrompt.trim() || isAiProcessing}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/30 disabled:opacity-40 flex items-center justify-center gap-2"
            >
              <Sparkles className={`w-4 h-4 ${isAiProcessing ? 'animate-spin' : ''}`} />
              <span>{isAiProcessing ? 'Synthesizing Generative Fill...' : 'Generate Fill into Selection'}</span>
            </button>
          </div>
        </div>
      )}

      {/* SUBTAB: GENERATIVE EXPAND */}
      {activeSubTab === 'gen-expand' && (
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-indigo-950/70 via-slate-900 to-purple-950/60 border border-indigo-500/25 p-3.5 rounded-2xl space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-indigo-300 flex items-center gap-1.5 uppercase tracking-wide">
                <Maximize2 className="w-4 h-4 text-indigo-400" />
                <span>Generative Expand (Outpainting)</span>
              </span>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                MULTI-DIRECTION
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Extend your canvas in any direction. The AI seamlessly synthesizes realistic missing scenery, architecture, and horizon lines with matching lighting and grain.
            </p>
          </div>

          {/* Directional Map Selector */}
          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl space-y-3.5">
            <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
              <span>Select Expansion Direction:</span>
              <span className="text-indigo-400 uppercase font-mono text-[11px]">{expandDirection}</span>
            </label>

            {/* Compass Grid */}
            <div className="grid grid-cols-3 gap-2 max-w-[260px] mx-auto">
              <div />
              <button
                onClick={() => setExpandDirection('top')}
                className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                  expandDirection === 'top'
                    ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/40'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                <ArrowUp className="w-4 h-4" />
                <span className="text-[10px] font-bold">Top</span>
              </button>
              <div />

              <button
                onClick={() => setExpandDirection('left')}
                className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                  expandDirection === 'left'
                    ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/40'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-[10px] font-bold">Left</span>
              </button>

              <button
                onClick={() => setExpandDirection('all')}
                className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                  expandDirection === 'all'
                    ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-indigo-400 shadow-md shadow-indigo-600/40 font-bold'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                <Move className="w-4 h-4" />
                <span className="text-[10px] font-bold">All 360°</span>
              </button>

              <button
                onClick={() => setExpandDirection('right')}
                className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                  expandDirection === 'right'
                    ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/40'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                <ArrowRight className="w-4 h-4" />
                <span className="text-[10px] font-bold">Right</span>
              </button>

              <div />
              <button
                onClick={() => setExpandDirection('bottom')}
                className={`p-2.5 rounded-xl border flex flex-col items-center gap-1 transition-all ${
                  expandDirection === 'bottom'
                    ? 'bg-indigo-600 text-white border-indigo-400 shadow-md shadow-indigo-600/40'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                <ArrowDown className="w-4 h-4" />
                <span className="text-[10px] font-bold">Bottom</span>
              </button>
              <div />
            </div>

            {/* Expansion Scale Slider / Buttons */}
            <div className="space-y-1.5 pt-2 border-t border-slate-800">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Extension Scale:
              </label>
              <div className="grid grid-cols-4 gap-1.5 text-xs font-semibold">
                {['+25%', '+50%', '+75%', '+100% (2x)'].map((sc) => (
                  <button
                    key={sc}
                    onClick={() => setExpandScale(sc)}
                    className={`py-1.5 rounded-lg border text-center transition-all ${
                      expandScale === sc
                        ? 'bg-indigo-600 text-white border-indigo-500'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    {sc}
                  </button>
                ))}
              </div>
            </div>

            {/* Optional Description */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Surrounding Scenery Guidance (Optional):
              </label>
              <input
                type="text"
                placeholder="e.g. Expansive sandy dunes under starlit sky"
                value={expandCustomPrompt}
                onChange={(e) => setExpandCustomPrompt(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            {/* Trigger Button */}
            <button
              onClick={handleExecuteGenerativeExpand}
              disabled={isAiProcessing}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/30 disabled:opacity-40 flex items-center justify-center gap-2"
            >
              <Maximize2 className={`w-4 h-4 ${isAiProcessing ? 'animate-spin' : ''}`} />
              <span>
                {isAiProcessing
                  ? 'Extrapolating Scenery...'
                  : `Generatively Expand (${expandDirection.toUpperCase()})`}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* SUBTAB: GENERATIVE REPLACE */}
      {activeSubTab === 'gen-replace' && (
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-indigo-950/70 via-slate-900 to-purple-950/60 border border-indigo-500/25 p-3.5 rounded-2xl space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-indigo-300 flex items-center gap-1.5 uppercase tracking-wide">
                <RefreshCw className="w-4 h-4 text-indigo-400" />
                <span>Generative Replace</span>
              </span>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                OBJECT SWAP
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Target any object or region and replace it with a new item while retaining subject pose, lighting angle, and realistic body/scene proportions.
            </p>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl space-y-3.5">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Select / Describe Object to Replace:
              </label>
              <input
                type="text"
                placeholder="e.g. the shirt, sunglasses, shoes, car"
                value={replaceTarget}
                onChange={(e) => setReplaceTarget(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Replace With:
              </label>
              <input
                type="text"
                placeholder="e.g. a black leather jacket with metallic zippers"
                value={replaceWith}
                onChange={(e) => setReplaceWith(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 outline-none focus:border-indigo-500"
              />
            </div>

            {/* Quick Templates */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Popular Replacement Templates:
              </label>
              <div className="space-y-3">
                {GEN_REPLACE_TEMPLATES.map((tmpl, idx) => (
                  <div key={idx} className="space-y-1">
                    <span className="text-[10px] text-indigo-300 font-semibold">{tmpl.category}</span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {tmpl.items.map((item, iIdx) => (
                        <button
                          key={iIdx}
                          onClick={() => {
                            setReplaceTarget(item.original);
                            setReplaceWith(item.replacement);
                          }}
                          className="p-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-indigo-500 text-left transition-all group"
                        >
                          <div className="text-xs font-bold text-slate-200 group-hover:text-indigo-300">
                            {item.label}
                          </div>
                          <div className="text-[9px] text-slate-500 truncate">
                            From: {item.original}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => handleExecuteGenerativeReplace()}
              disabled={!replaceWith.trim() || isAiProcessing}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/30 disabled:opacity-40 flex items-center justify-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${isAiProcessing ? 'animate-spin' : ''}`} />
              <span>{isAiProcessing ? 'Replacing Element...' : 'Execute Generative Replace'}</span>
            </button>
          </div>
        </div>
      )}

      {/* SUBTAB: GENERATIVE ADD */}
      {activeSubTab === 'gen-add' && (
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-indigo-950/70 via-slate-900 to-purple-950/60 border border-indigo-500/25 p-3.5 rounded-2xl space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-indigo-300 flex items-center gap-1.5 uppercase tracking-wide">
                <PlusCircle className="w-4 h-4 text-indigo-400" />
                <span>Generative Add</span>
              </span>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                SYNTHESIS
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Add new Objects, People, Animals, Buildings, Vehicles, Accessories, or Lighting to your photograph with natural perspective and contact shadow calculation.
            </p>
          </div>

          {/* Category Selector */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 overflow-x-auto scrollbar-none text-xs font-semibold">
            {GEN_ADD_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isSel = selectedAddCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedAddCategory(cat.id)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-all whitespace-nowrap ${
                    isSel ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{cat.id}</span>
                </button>
              );
            })}
          </div>

          {/* Preset Cards for selected category */}
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              {GEN_ADD_CATEGORIES.find((c) => c.id === selectedAddCategory)?.items.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleExecuteGenerativeAdd(selectedAddCategory, item.prompt)}
                  disabled={isAiProcessing}
                  className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/70 text-left transition-all group disabled:opacity-50 flex flex-col justify-between"
                >
                  <div className="text-xs font-bold text-slate-200 group-hover:text-indigo-300">
                    + {item.name}
                  </div>
                  <div className="text-[10px] text-slate-400 line-clamp-2 mt-1">
                    {item.prompt}
                  </div>
                </button>
              ))}
            </div>

            {/* Custom Prompt Box for Category */}
            <div className="bg-slate-900/90 border border-slate-800 p-3.5 rounded-2xl space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Custom {selectedAddCategory} Description:
              </span>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder={`Describe ${selectedAddCategory.toLowerCase()} to generate...`}
                  value={customAddPrompt}
                  onChange={(e) => setCustomAddPrompt(e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 outline-none focus:border-indigo-500"
                />
                <button
                  onClick={() => handleExecuteGenerativeAdd(selectedAddCategory, customAddPrompt)}
                  disabled={!customAddPrompt.trim() || isAiProcessing}
                  className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl transition-all disabled:opacity-40 flex items-center gap-1.5 shadow-md shadow-indigo-600/30"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Add</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB: GENERATIVE REMOVE (PROMPT-FREE + PRESETS) */}
      {activeSubTab === 'gen-remove' && (
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-rose-950/70 via-slate-900 to-orange-950/60 border border-rose-500/25 p-3.5 rounded-2xl space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-rose-300 flex items-center gap-1.5 uppercase tracking-wide">
                <Eraser className="w-4 h-4 text-rose-400" />
                <span>Generative Remove (Prompt-Free)</span>
              </span>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                SMART INPAINT
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Brush over any unwanted subject or choose a 1-click smart detection preset below. The AI automatically analyzes depth, vanishing lines, and eradicates cast shadows.
            </p>
          </div>

          {/* 1-Click Prompt-Free Canvas Brush Action */}
          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Paintbrush className="w-3.5 h-3.5 text-rose-400" />
                <span>Prompt-Free Mask Erase</span>
              </span>
              <label className="flex items-center gap-1.5 text-[11px] text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={removeShadows}
                  onChange={(e) => setRemoveShadows(e.target.checked)}
                  className="w-3.5 h-3.5 rounded accent-rose-500 cursor-pointer"
                />
                <span>Remove Shadows</span>
              </label>
            </div>

            <button
              onClick={handlePromptFreeRemove}
              disabled={isAiProcessing}
              className="w-full py-3 bg-gradient-to-r from-rose-600 via-orange-600 to-rose-600 hover:from-rose-500 hover:to-orange-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-rose-600/30 disabled:opacity-40 flex items-center justify-center gap-2"
            >
              <Eraser className={`w-4 h-4 ${isAiProcessing ? 'animate-spin' : ''}`} />
              <span>{isAiProcessing ? 'Eradicating Target...' : 'Instant AI Erase (Prompt-Free)'}</span>
            </button>
          </div>

          {/* 1-Click Smart Detection Presets */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              1-Click Smart Object Detectors:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {SMART_REMOVAL_PRESETS.map((preset) => {
                const Icon = preset.icon;
                return (
                  <button
                    key={preset.id}
                    onClick={() => handleSmartPresetRemove(preset.id)}
                    disabled={isAiProcessing}
                    className="p-3 rounded-2xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-rose-500/60 text-left transition-all group disabled:opacity-50 flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className={`p-2 rounded-xl border ${preset.color}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                        {preset.badge}
                      </span>
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-200 group-hover:text-rose-300">
                        {preset.name}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">
                        {preset.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB: BG STUDIO */}
      {activeSubTab === 'background' && (
        <div className="space-y-3.5">
          <div className="bg-gradient-to-br from-indigo-950/70 via-slate-900 to-purple-950/60 border border-indigo-500/25 p-3.5 rounded-2xl space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-indigo-300 flex items-center gap-1.5 uppercase tracking-wide">
                <ImageIcon className="w-4 h-4 text-indigo-400" />
                <span>AI Background Studio</span>
              </span>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                PRO SEGMENTATION
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Isolate subjects with sub-pixel hair fidelity, synthesize new environments, or apply optical depth blur.
            </p>
          </div>

          {/* Prompt Replacement Box */}
          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl space-y-3">
            <div className="flex items-center justify-between text-xs font-bold text-slate-200">
              <span className="flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-indigo-400" />
                <span>Custom Background Prompt</span>
              </span>
            </div>

            <textarea
              rows={2}
              placeholder="e.g. Replace the background with a futuristic Tokyo street at night."
              value={customBgPrompt}
              onChange={(e) => setCustomBgPrompt(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 outline-none focus:border-indigo-500 transition-colors resize-none"
            />

            <button
              onClick={() => handleReplaceBackground(customBgPrompt)}
              disabled={!customBgPrompt.trim() || isAiProcessing}
              className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-indigo-600/30 disabled:opacity-40 flex items-center justify-center gap-2"
            >
              <Sparkles className={`w-4 h-4 ${isAiProcessing ? 'animate-spin' : ''}`} />
              <span>{isAiProcessing ? 'Synthesizing Scene...' : 'Generate & Replace Background'}</span>
            </button>
          </div>

          {/* Preset Backdrops */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Curated Environments:
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PRESET_BACKDROPS.map((bg) => (
                <button
                  key={bg.id}
                  onClick={() => handleReplaceBackground(bg.prompt)}
                  disabled={isAiProcessing}
                  className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/60 text-left transition-all group disabled:opacity-50 flex items-start gap-2"
                >
                  <span className="text-lg leading-none">{bg.icon}</span>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-slate-200 group-hover:text-indigo-300 truncate">
                      {bg.name}
                    </div>
                    <div className="text-[9px] text-slate-500 uppercase">{bg.category}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUBTAB: AUTO-ENHANCE (COLORIST) */}
      {activeSubTab === 'auto-enhance' && (
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-amber-950/70 via-slate-900 to-indigo-950/60 border border-amber-500/25 p-3.5 rounded-2xl space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-amber-300 flex items-center gap-1.5 uppercase tracking-wide">
                <Wand2 className="w-4 h-4 text-amber-400" />
                <span>AI Master Colorist</span>
              </span>
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                1-CLICK COLOR GRADE
              </span>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Analyzes dynamic range, tone curve distribution, and color temperature, then provides balanced studio slider adjustments.
            </p>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-2xl space-y-3">
            <button
              onClick={handleAutoEnhance}
              disabled={isAiProcessing}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-xs font-black rounded-xl transition-all shadow-lg shadow-amber-500/30 disabled:opacity-40 flex items-center justify-center gap-2"
            >
              <Wand2 className={`w-4 h-4 ${isAiProcessing ? 'animate-spin' : ''}`} />
              <span>{isAiProcessing ? 'Analyzing Color Harmony...' : 'Auto-Enhance Photo (AI Colorist)'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
