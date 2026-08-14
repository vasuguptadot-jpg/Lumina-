import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Columns,
  Eye,
  Eraser,
  Sparkles,
  Zap,
  Trash2,
  Crosshair,
  Compass,
  Paintbrush,
  Pipette,
  Circle,
  Minus,
  Layers,
  Flame,
} from 'lucide-react';
import { AdjustmentSettings, BorderSettings, CropSettings, HSLSettings, Project, SelectiveMask, ToneCurves, WatermarkSettings } from '../../types/editor';
import { processImagePipeline } from '../../engine/colorPipeline';
import { smartClientInpaint } from '../../engine/inpainting';
import { requestAiObjectRemoval } from '../../services/aiService';
import { getOrComputeDepthMap, getDepthAtCoordinate } from '../../engine/depthEngine';

interface CanvasViewportProps {
  project: Project;
  onUpdateSettings: (settings: AdjustmentSettings) => void;
  onUpdateCrop: (crop: CropSettings) => void;
  onUpdateImage: (newUrl: string, name?: string) => void;
  onUpdateMasks?: (masks: SelectiveMask[]) => void;
  activeMaskId?: string | null;
  onSelectMask?: (id: string | null) => void;
  activeToolTab: string;
  isAiProcessing: boolean;
  setIsAiProcessing: (loading: boolean) => void;
  showToast: (type: 'success' | 'error' | 'info', title: string, msg?: string) => void;
}

export const CanvasViewport: React.FC<CanvasViewportProps> = ({
  project,
  onUpdateSettings,
  onUpdateCrop,
  onUpdateImage,
  onUpdateMasks,
  activeMaskId,
  onSelectMask,
  activeToolTab,
  isAiProcessing,
  setIsAiProcessing,
  showToast,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const processedCanvasRef = useRef<HTMLCanvasElement>(null);
  const originalCanvasRef = useRef<HTMLCanvasElement>(null);
  const maskCanvasRef = useRef<HTMLCanvasElement>(null);
  const sourceImageRef = useRef<HTMLImageElement | null>(null);

  // Viewport Zoom & Pan State
  const [scale, setScale] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  // Comparison Split Slider State
  const [comparisonMode, setComparisonMode] = useState<'off' | 'split-vertical' | 'split-horizontal' | 'side-by-side' | 'hold'>('off');
  const [splitPos, setSplitPos] = useState(0.5); // 0 to 1
  const [isDraggingSplit, setIsDraggingSplit] = useState(false);
  const [isHoldingBefore, setIsHoldingBefore] = useState(false);

  // Inpainting Brush State
  const [brushSize, setBrushSize] = useState(28);
  const [isDrawingMask, setIsDrawingMask] = useState(false);
  const [hasMaskDrawn, setHasMaskDrawn] = useState(false);
  const [inpaintPrompt, setInpaintPrompt] = useState('');

  // Interactive On-Canvas Crop Box Dragging State
  const [cropDragMode, setCropDragMode] = useState<string | null>(null);
  const [cropDragStart, setCropDragStart] = useState<{
    mouseX: number;
    mouseY: number;
    cropX: number;
    cropY: number;
    cropW: number;
    cropH: number;
  }>({ mouseX: 0, mouseY: 0, cropX: 0, cropY: 0, cropW: 1, cropH: 1 });

  // Selective Masking Interactive State
  const [selectiveBrushSize, setSelectiveBrushSize] = useState(25);
  const [selectiveBrushMode, setSelectiveBrushMode] = useState<'add' | 'erase'>('add');
  const [isDrawingSelectiveMask, setIsDrawingSelectiveMask] = useState(false);
  const [draggedGradientHandle, setDraggedGradientHandle] = useState<'start' | 'end' | 'center' | 'radius' | null>(null);
  const currentSelectiveStrokeRef = useRef<{
    points: Array<{ x: number; y: number }>;
    size: number;
    feather: number;
    opacity: number;
    mode: 'add' | 'erase';
  } | null>(null);

  const selectedMask = (project.masks || []).find((m) => m.id === activeMaskId) || project.masks?.[0] || null;

  // 1. Load source image whenever project originalUrl changes
  useEffect(() => {
    if (!project.image?.originalUrl) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      sourceImageRef.current = img;

      // Initialize original canvas
      if (originalCanvasRef.current) {
        originalCanvasRef.current.width = img.naturalWidth;
        originalCanvasRef.current.height = img.naturalHeight;
        const oCtx = originalCanvasRef.current.getContext('2d');
        oCtx?.drawImage(img, 0, 0);
      }

      // Initialize mask canvas
      if (maskCanvasRef.current) {
        maskCanvasRef.current.width = img.naturalWidth;
        maskCanvasRef.current.height = img.naturalHeight;
        const mCtx = maskCanvasRef.current.getContext('2d');
        mCtx?.clearRect(0, 0, img.naturalWidth, img.naturalHeight);
      }

      fitToScreen();
      renderProcessedImage();
    };
    img.src = project.image.originalUrl;
  }, [project.image?.originalUrl]);

  // 2. Render processed image when settings/crops change
  const renderProcessedImage = useCallback(() => {
    if (!sourceImageRef.current || !processedCanvasRef.current) return;
    const srcImg = sourceImageRef.current;
    const pCanvas = processedCanvasRef.current;

    pCanvas.width = srcImg.naturalWidth;
    pCanvas.height = srcImg.naturalHeight;

    processImagePipeline({
      sourceCanvas: srcImg,
      targetCanvas: pCanvas,
      adjustments: project.currentSettings,
      toneCurves: project.toneCurves,
      hsl: project.hsl,
      activePresetId: project.activePresetId,
      presetStrength: project.presetStrength,
      watermark: project.watermark,
      border: project.border,
      masks: project.masks,
      highQuality: true,
    });
  }, [
    project.currentSettings,
    project.toneCurves,
    project.hsl,
    project.activePresetId,
    project.presetStrength,
    project.watermark,
    project.border,
    project.masks,
  ]);

  useEffect(() => {
    renderProcessedImage();
  }, [renderProcessedImage]);

  // Auto Fit to Screen helper
  const fitToScreen = useCallback(() => {
    if (!containerRef.current || !sourceImageRef.current) return;
    const container = containerRef.current;
    const img = sourceImageRef.current;

    const availableW = container.clientWidth - 80;
    const availableH = container.clientHeight - 80;

    const scaleW = availableW / img.naturalWidth;
    const scaleH = availableH / img.naturalHeight;
    const fitScale = Math.min(scaleW, scaleH, 1);

    setScale(fitScale);
    setPan({ x: 0, y: 0 });
  }, []);

  // Zoom handlers
  const handleZoom = (delta: number) => {
    setScale((prev) => Math.max(0.1, Math.min(5, prev + delta)));
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;
      setScale((prev) => Math.max(0.1, Math.min(5, prev * zoomFactor)));
    } else {
      setPan((prev) => ({
        x: prev.x - e.deltaX * 0.8,
        y: prev.y - e.deltaY * 0.8,
      }));
    }
  };

  const [mouseDownPos, setMouseDownPos] = useState({ x: 0, y: 0 });

  // Mouse pan & crop handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setMouseDownPos({ x: e.clientX, y: e.clientY });

    // If drawing inpaint mask
    if (activeToolTab === 'ai-tools' && e.button === 0 && !e.altKey && !e.spaceKey) {
      startDrawingMask(e);
      return;
    }

    // If drawing selective mask brush/eraser
    if (
      activeToolTab === 'masks' &&
      selectedMask &&
      (selectedMask.type === 'brush' || selectedMask.type === 'eraser') &&
      e.button === 0 &&
      !e.altKey &&
      !e.spaceKey &&
      processedCanvasRef.current
    ) {
      const rect = processedCanvasRef.current.getBoundingClientRect();
      const normX = Math.max(0, Math.min(1, (e.clientX - rect.left) / (rect.width || 1)));
      const normY = Math.max(0, Math.min(1, (e.clientY - rect.top) / (rect.height || 1)));

      setIsDrawingSelectiveMask(true);
      currentSelectiveStrokeRef.current = {
        points: [{ x: Number(normX.toFixed(4)), y: Number(normY.toFixed(4)) }],
        size: selectiveBrushSize,
        feather: selectedMask.feather ?? 50,
        opacity: selectedMask.opacity ?? 100,
        mode: selectedMask.type === 'eraser' ? 'erase' : selectiveBrushMode,
      };
      return;
    }

    if (e.button === 0 || e.button === 1 || e.spaceKey) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handleStartCropDrag = (mode: string, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setCropDragMode(mode);
    setCropDragStart({
      mouseX: e.clientX,
      mouseY: e.clientY,
      cropX: project.crop.x,
      cropY: project.crop.y,
      cropW: project.crop.width,
      cropH: project.crop.height,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (cropDragMode && processedCanvasRef.current) {
      const rect = processedCanvasRef.current.getBoundingClientRect();
      const deltaNormX = (e.clientX - cropDragStart.mouseX) / (rect.width || 1);
      const deltaNormY = (e.clientY - cropDragStart.mouseY) / (rect.height || 1);

      let newX = cropDragStart.cropX;
      let newY = cropDragStart.cropY;
      let newW = cropDragStart.cropW;
      let newH = cropDragStart.cropH;

      if (cropDragMode === 'move') {
        newX = Math.max(0, Math.min(1 - newW, cropDragStart.cropX + deltaNormX));
        newY = Math.max(0, Math.min(1 - newH, cropDragStart.cropY + deltaNormY));
      } else {
        if (cropDragMode.includes('e')) {
          newW = Math.max(0.05, Math.min(1 - newX, cropDragStart.cropW + deltaNormX));
        }
        if (cropDragMode.includes('s')) {
          newH = Math.max(0.05, Math.min(1 - newY, cropDragStart.cropH + deltaNormY));
        }
        if (cropDragMode.includes('w')) {
          const maxDeltaLeft = cropDragStart.cropW - 0.05;
          const clampedDeltaX = Math.max(-cropDragStart.cropX, Math.min(maxDeltaLeft, deltaNormX));
          newX = cropDragStart.cropX + clampedDeltaX;
          newW = cropDragStart.cropW - clampedDeltaX;
        }
        if (cropDragMode.includes('n')) {
          const maxDeltaTop = cropDragStart.cropH - 0.05;
          const clampedDeltaY = Math.max(-cropDragStart.cropY, Math.min(maxDeltaTop, deltaNormY));
          newY = cropDragStart.cropY + clampedDeltaY;
          newH = cropDragStart.cropH - clampedDeltaY;
        }

        // Apply aspect ratio lock if active
        if (project.crop.aspectRatio !== 'free' && typeof project.crop.aspectRatio === 'number') {
          const targetRatio = project.crop.aspectRatio;
          const imgAspect = (project.image.width || 1) / (project.image.height || 1);
          newH = (newW * imgAspect) / targetRatio;
          if (newY + newH > 1) {
            newH = 1 - newY;
            newW = (newH * targetRatio) / imgAspect;
          }
        }
      }

      onUpdateCrop({
        ...project.crop,
        x: Number(newX.toFixed(4)),
        y: Number(newY.toFixed(4)),
        width: Number(newW.toFixed(4)),
        height: Number(newH.toFixed(4)),
      });
      return;
    }

    if (isDraggingSplit) {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const relativeX = (e.clientX - rect.left) / rect.width;
      setSplitPos(Math.max(0.05, Math.min(0.95, relativeX)));
      return;
    }

    if (isDrawingMask) {
      drawMaskStroke(e);
      return;
    }

    // Selective Mask Brush Stroke Tracking
    if (isDrawingSelectiveMask && currentSelectiveStrokeRef.current && processedCanvasRef.current) {
      const rect = processedCanvasRef.current.getBoundingClientRect();
      const normX = Math.max(0, Math.min(1, (e.clientX - rect.left) / (rect.width || 1)));
      const normY = Math.max(0, Math.min(1, (e.clientY - rect.top) / (rect.height || 1)));
      currentSelectiveStrokeRef.current.points.push({
        x: Number(normX.toFixed(4)),
        y: Number(normY.toFixed(4)),
      });
      return;
    }

    // Selective Mask Gradient Handle Dragging
    if (draggedGradientHandle && selectedMask && onUpdateMasks && processedCanvasRef.current) {
      const rect = processedCanvasRef.current.getBoundingClientRect();
      const normX = Math.max(0, Math.min(1, (e.clientX - rect.left) / (rect.width || 1)));
      const normY = Math.max(0, Math.min(1, (e.clientY - rect.top) / (rect.height || 1)));

      if (draggedGradientHandle === 'start') {
        onUpdateMasks(
          project.masks.map((m) =>
            m.id === selectedMask.id ? { ...m, startX: Number(normX.toFixed(4)), startY: Number(normY.toFixed(4)) } : m
          )
        );
      } else if (draggedGradientHandle === 'end') {
        onUpdateMasks(
          project.masks.map((m) =>
            m.id === selectedMask.id ? { ...m, endX: Number(normX.toFixed(4)), endY: Number(normY.toFixed(4)) } : m
          )
        );
      } else if (draggedGradientHandle === 'center') {
        onUpdateMasks(
          project.masks.map((m) =>
            m.id === selectedMask.id ? { ...m, centerX: Number(normX.toFixed(4)), centerY: Number(normY.toFixed(4)) } : m
          )
        );
      } else if (draggedGradientHandle === 'radius') {
        const cx = selectedMask.centerX ?? 0.5;
        const cy = selectedMask.centerY ?? 0.5;
        const rx = Math.max(0.05, Math.abs(normX - cx));
        const ry = Math.max(0.05, Math.abs(normY - cy));
        onUpdateMasks(
          project.masks.map((m) =>
            m.id === selectedMask.id ? { ...m, radiusX: Number(rx.toFixed(4)), radiusY: Number(ry.toFixed(4)) } : m
          )
        );
      }
      return;
    }

    if (isPanning) {
      setPan({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    }
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    const dragDistance = Math.hypot(e.clientX - mouseDownPos.x, e.clientY - mouseDownPos.y);

    // Finalize Selective Mask Brush Stroke
    if (isDrawingSelectiveMask && currentSelectiveStrokeRef.current && selectedMask && onUpdateMasks) {
      const existingStrokes = selectedMask.brushStrokes || [];
      const updatedStrokes = [...existingStrokes, currentSelectiveStrokeRef.current];
      onUpdateMasks(
        project.masks.map((m) => (m.id === selectedMask.id ? { ...m, brushStrokes: updatedStrokes } : m))
      );
      setIsDrawingSelectiveMask(false);
      currentSelectiveStrokeRef.current = null;
      return;
    }

    if (draggedGradientHandle) {
      setDraggedGradientHandle(null);
      return;
    }

    // Selective Mask Canvas Click Interactions (Color Sample / Object Selection)
    if (
      activeToolTab === 'masks' &&
      dragDistance < 6 &&
      selectedMask &&
      onUpdateMasks &&
      processedCanvasRef.current
    ) {
      const rect = processedCanvasRef.current.getBoundingClientRect();
      const normX = Math.max(0, Math.min(1, (e.clientX - rect.left) / (rect.width || 1)));
      const normY = Math.max(0, Math.min(1, (e.clientY - rect.top) / (rect.height || 1)));

      if (selectedMask.type === 'color-range' && originalCanvasRef.current) {
        const oCtx = originalCanvasRef.current.getContext('2d');
        if (oCtx) {
          const pxX = Math.floor(normX * originalCanvasRef.current.width);
          const pxY = Math.floor(normY * originalCanvasRef.current.height);
          const pixel = oCtx.getImageData(pxX, pxY, 1, 1).data;
          const hex = `#${((1 << 24) + (pixel[0] << 16) + (pixel[1] << 8) + pixel[2]).toString(16).slice(1)}`;
          onUpdateMasks(
            project.masks.map((m) => (m.id === selectedMask.id ? { ...m, targetColor: hex } : m))
          );
          showToast('success', 'Color Sampled', `Sampled ${hex} at (${Math.round(normX * 100)}%, ${Math.round(normY * 100)}%)`);
        }
      } else if (selectedMask.type === 'ai-object') {
        onUpdateMasks(
          project.masks.map((m) =>
            m.id === selectedMask.id
              ? {
                  ...m,
                  aiObjectPoint: { x: Number(normX.toFixed(4)), y: Number(normY.toFixed(4)) },
                }
              : m
          )
        );
        showToast(
          'success',
          'Object Selected',
          `Segmenting target at (${Math.round(normX * 100)}%, ${Math.round(normY * 100)}%)`
        );
      }
    }

    // If user clicked without dragging in Blur & Depth tab, calibrate focal plane
    if (
      activeToolTab === 'blur-depth' &&
      dragDistance < 6 &&
      processedCanvasRef.current &&
      originalCanvasRef.current
    ) {
      const rect = processedCanvasRef.current.getBoundingClientRect();
      const normX = Math.max(0, Math.min(1, (e.clientX - rect.left) / (rect.width || 1)));
      const normY = Math.max(0, Math.min(1, (e.clientY - rect.top) / (rect.height || 1)));
      const oCtx = originalCanvasRef.current.getContext('2d');

      if (oCtx) {
        const depthMap = getOrComputeDepthMap(oCtx, originalCanvasRef.current.width, originalCanvasRef.current.height);
        const clickedDepth = getDepthAtCoordinate(
          depthMap,
          originalCanvasRef.current.width,
          originalCanvasRef.current.height,
          normX,
          normY
        );

        const currentBlur = project.currentSettings.blur || {
          enabled: true,
          mode: 'lens' as const,
          amount: 30,
          bokehShape: 'circle' as const,
          bokehIntensity: 40,
          bokehThreshold: 75,
          bokehSphericalAberration: 0,
          bokehBladeCurvature: 80,
          motionAngle: 0,
          motionDistance: 25,
          radialCenterX: 0.5,
          radialCenterY: 0.5,
          radialAngle: 15,
          zoomCenterX: 0.5,
          zoomCenterY: 0.5,
          zoomStrength: 25,
          tiltShiftCenterX: 0.5,
          tiltShiftCenterY: 0.5,
          tiltShiftAngle: 0,
          tiltShiftFocusWidth: 25,
          tiltShiftFeather: 35,
          focusDepth: 0.5,
          depthOfField: 0.25,
          apertureFStop: 'f/1.8',
          invertDepth: false,
          selectiveType: 'radial' as const,
          selectiveCenterX: 0.5,
          selectiveCenterY: 0.5,
          selectiveRadius: 0.35,
          selectiveFeather: 0.3,
          selectiveInvert: false,
        };

        const currentAIDepth = project.currentSettings.aiDepth || {
          enabled: false,
          depthEstimationMethod: 'neural-gradient' as const,
          showDepthMapOverlay: false,
          depthColorMap: 'turbo' as const,
          foregroundThreshold: 0.3,
          backgroundThreshold: 0.65,
          feather: 0.15,
          foreground: { exposure: 0, contrast: 0, highlights: 0, shadows: 0, temperature: 0, tint: 0, saturation: 0, vibrance: 0, clarity: 0, texture: 0, sharpness: 0, blur: 0, dehaze: 0 },
          subject: { exposure: 5, contrast: 5, highlights: 0, shadows: 5, temperature: 0, tint: 0, saturation: 5, vibrance: 5, clarity: 10, texture: 10, sharpness: 20, blur: 0, dehaze: 0 },
          background: { exposure: -5, contrast: -5, highlights: -10, shadows: 0, temperature: 0, tint: 0, saturation: -5, vibrance: -5, clarity: -10, texture: -10, sharpness: 0, blur: 25, dehaze: -5 },
          simulatedFocalDepth: 0.5,
          dofAperture: 0.25,
        };

        onUpdateSettings({
          ...project.currentSettings,
          blur: {
            ...currentBlur,
            focusDepth: Number(clickedDepth.toFixed(2)),
            radialCenterX: Number(normX.toFixed(2)),
            radialCenterY: Number(normY.toFixed(2)),
            zoomCenterX: Number(normX.toFixed(2)),
            zoomCenterY: Number(normY.toFixed(2)),
            tiltShiftCenterY: Number(normY.toFixed(2)),
            selectiveCenterX: Number(normX.toFixed(2)),
            selectiveCenterY: Number(normY.toFixed(2)),
          },
          aiDepth: {
            ...currentAIDepth,
            focalPointX: Number(normX.toFixed(2)),
            focalPointY: Number(normY.toFixed(2)),
            simulatedFocalDepth: Number(clickedDepth.toFixed(2)),
          },
        });

        const zone = clickedDepth < currentAIDepth.foregroundThreshold
          ? 'Foreground'
          : clickedDepth > currentAIDepth.backgroundThreshold
          ? 'Background'
          : 'Subject';

        showToast('info', `Focal Point Set (${zone})`, `Depth: ${Math.round(clickedDepth * 100)}% at (${Math.round(normX * 100)}%, ${Math.round(normY * 100)}%)`);
      }
    }

    setIsPanning(false);
    setIsDraggingSplit(false);
    setIsDrawingMask(false);
    setCropDragMode(null);
  };

  // Inpaint Mask Drawing Logic
  const getCanvasCoords = (e: React.MouseEvent) => {
    if (!maskCanvasRef.current || !processedCanvasRef.current) return { x: 0, y: 0 };
    const rect = processedCanvasRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * maskCanvasRef.current.width;
    const y = ((e.clientY - rect.top) / rect.height) * maskCanvasRef.current.height;
    return { x, y };
  };

  const startDrawingMask = (e: React.MouseEvent) => {
    const coords = getCanvasCoords(e);
    setIsDrawingMask(true);
    setHasMaskDrawn(true);

    const mCtx = maskCanvasRef.current?.getContext('2d');
    if (!mCtx) return;

    mCtx.strokeStyle = 'rgba(239, 68, 68, 0.75)'; // Semi-transparent Red Highlight
    mCtx.fillStyle = 'rgba(239, 68, 68, 0.75)';
    mCtx.lineWidth = brushSize * (maskCanvasRef.current!.width / (processedCanvasRef.current!.clientWidth || 800));
    mCtx.lineCap = 'round';
    mCtx.lineJoin = 'round';

    mCtx.beginPath();
    mCtx.arc(coords.x, coords.y, mCtx.lineWidth / 2, 0, Math.PI * 2);
    mCtx.fill();

    mCtx.beginPath();
    mCtx.moveTo(coords.x, coords.y);
  };

  const drawMaskStroke = (e: React.MouseEvent) => {
    const mCtx = maskCanvasRef.current?.getContext('2d');
    if (!mCtx) return;
    const coords = getCanvasCoords(e);
    mCtx.lineTo(coords.x, coords.y);
    mCtx.stroke();
  };

  const clearMask = () => {
    const mCtx = maskCanvasRef.current?.getContext('2d');
    if (mCtx && maskCanvasRef.current) {
      mCtx.clearRect(0, 0, maskCanvasRef.current.width, maskCanvasRef.current.height);
      setHasMaskDrawn(false);
    }
  };

  // Instant Client-Side Offline Inpaint
  const handleInstantOfflineInpaint = () => {
    if (!processedCanvasRef.current || !maskCanvasRef.current) return;
    try {
      const inpaintedCanvas = smartClientInpaint(processedCanvasRef.current, maskCanvasRef.current);
      const newUrl = inpaintedCanvas.toDataURL('image/jpeg', 0.95);
      onUpdateImage(newUrl, `Inpainted_${project.name}`);
      clearMask();
      showToast('success', 'Object Removed', 'Instant content-aware texture synthesis applied.');
    } catch (err: any) {
      showToast('error', 'Inpaint Failed', err.message);
    }
  };

  // Generative AI Object Removal
  const handleAiGenerativeInpaint = async () => {
    if (!processedCanvasRef.current || !maskCanvasRef.current) return;
    setIsAiProcessing(true);
    showToast('info', 'AI Retouching', 'Gemini is reconstructing background and lighting...');

    try {
      const imgBase64 = processedCanvasRef.current.toDataURL('image/png');
      const maskBase64 = maskCanvasRef.current.toDataURL('image/png');

      const res = await requestAiObjectRemoval(imgBase64, maskBase64, inpaintPrompt.trim() || undefined);
      if (res.success && res.imageUrl) {
        onUpdateImage(res.imageUrl, `AI_Cleaned_${project.name}`);
        clearMask();
        showToast('success', 'AI Object Erased', 'Seamless background reconstruction complete.');
      } else {
        showToast('error', 'AI Processing Failed', res.message || res.error || 'Could not generate result.');
      }
    } catch (err: any) {
      showToast('error', 'AI Error', err.message);
    } finally {
      setIsAiProcessing(false);
    }
  };

  const nativeW = sourceImageRef.current?.naturalWidth || project.image.width;
  const nativeH = sourceImageRef.current?.naturalHeight || project.image.height;
  const mp = ((nativeW * nativeH) / 1000000).toFixed(1);

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      className="relative flex-1 h-full bg-slate-950 overflow-hidden flex items-center justify-center select-none"
      style={{
        backgroundImage: 'radial-gradient(circle at 50% 50%, #0f172a 0%, #020617 100%)',
        cursor: isPanning ? 'grabbing' : activeToolTab === 'ai-tools' ? 'crosshair' : 'default',
      }}
    >
      {/* Top Floating HUD: Image Specs */}
      <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-slate-900/85 backdrop-blur-md border border-slate-800/80 px-3 py-1.5 rounded-xl text-xs shadow-xl">
        <span className="font-semibold text-slate-200">
          {nativeW} × {nativeH} px
        </span>
        <span className="text-slate-500">•</span>
        <span className="text-amber-400 font-medium">{mp} MP</span>
        <span className="text-slate-500">•</span>
        <span className="text-indigo-300 uppercase tracking-wider text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-950/60 border border-indigo-800/40">
          {project.image.rawMetadata?.isRaw ? '14-Bit RAW' : project.image.format.toUpperCase()}
        </span>
      </div>

      {/* Comparison Split Mode Selector */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-1 bg-slate-900/85 backdrop-blur-md border border-slate-800/80 p-1 rounded-xl shadow-xl">
        <button
          onClick={() => setComparisonMode(comparisonMode === 'split-vertical' ? 'off' : 'split-vertical')}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
            comparisonMode === 'split-vertical'
              ? 'bg-indigo-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
          title="Split View (Compare Original vs Edited)"
        >
          <Columns className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Split View</span>
        </button>

        <button
          onMouseDown={() => setIsHoldingBefore(true)}
          onMouseUp={() => setIsHoldingBefore(false)}
          onMouseLeave={() => setIsHoldingBefore(false)}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
            isHoldingBefore ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
          }`}
          title="Hold to see Original (\)"
        >
          <Eye className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Hold Original</span>
        </button>
      </div>

      {/* Main Scaled & Panned Canvas Workspace */}
      <div
        className="relative transition-transform duration-75 ease-out shadow-2xl rounded-sm"
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`,
          transformOrigin: 'center center',
        }}
      >
        {/* Hidden Canvas for Original Image Buffer */}
        <canvas ref={originalCanvasRef} className="hidden" />

        {/* Processed Final Canvas (or Original if holding) */}
        <canvas
          ref={processedCanvasRef}
          className={`block max-w-none shadow-2xl rounded-sm ${
            isHoldingBefore ? 'opacity-0' : 'opacity-100'
          }`}
        />

        {/* Before / After Vertical Split Overlay */}
        {comparisonMode === 'split-vertical' && originalCanvasRef.current && sourceImageRef.current && (
          <div
            className="absolute inset-0 overflow-hidden pointer-events-none"
            style={{ width: `${splitPos * 100}%`, borderRight: '2px solid rgba(255, 255, 255, 0.9)' }}
          >
            <img
              src={project.image.originalUrl}
              alt="Original"
              className="absolute top-0 left-0 max-w-none pointer-events-none"
              style={{
                width: processedCanvasRef.current?.width || '100%',
                height: processedCanvasRef.current?.height || '100%',
              }}
            />
            <div className="absolute top-3 left-3 bg-black/75 backdrop-blur-md px-2 py-1 rounded text-[11px] font-bold text-white uppercase tracking-wider border border-white/20">
              Original (Before)
            </div>
          </div>
        )}

        {/* Split Divider Handle */}
        {comparisonMode === 'split-vertical' && (
          <div
            onMouseDown={(e) => {
              e.stopPropagation();
              setIsDraggingSplit(true);
            }}
            className="absolute top-0 bottom-0 w-8 -ml-4 flex items-center justify-center cursor-ew-resize z-30 group"
            style={{ left: `${splitPos * 100}%` }}
          >
            <div className="w-6 h-6 rounded-full bg-white text-slate-950 flex items-center justify-center shadow-2xl text-[10px] font-black group-hover:scale-110 transition-transform">
              ↔
            </div>
          </div>
        )}

        {/* Inpainting Mask Canvas Overlay */}
        <canvas
          ref={maskCanvasRef}
          className={`absolute inset-0 pointer-events-none ${activeToolTab === 'ai-tools' ? 'opacity-90' : 'opacity-0'}`}
        />

        {/* Interactive Selective Mask Visual Handles & Overlays */}
        {activeToolTab === 'masks' && selectedMask && (
          <div className="absolute inset-0 pointer-events-none z-30">
            {/* Linear Gradient Interactive Line & Pin Handles */}
            {selectedMask.type === 'linear' && (
              <>
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  <line
                    x1={`${(selectedMask.startX ?? 0.5) * 100}%`}
                    y1={`${(selectedMask.startY ?? 0.75) * 100}%`}
                    x2={`${(selectedMask.endX ?? 0.5) * 100}%`}
                    y2={`${(selectedMask.endY ?? 1.0) * 100}%`}
                    stroke="rgba(6, 182, 212, 0.85)"
                    strokeWidth="2"
                    strokeDasharray="4 4"
                  />
                </svg>

                {/* Start Pin Handle */}
                <div
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setDraggedGradientHandle('start');
                  }}
                  className="absolute w-6 h-6 -ml-3 -mt-3 rounded-full bg-cyan-500 border-2 border-white shadow-xl cursor-grab active:cursor-grabbing pointer-events-auto flex items-center justify-center group z-40 hover:scale-125 transition-transform"
                  style={{
                    left: `${(selectedMask.startX ?? 0.5) * 100}%`,
                    top: `${(selectedMask.startY ?? 0.75) * 100}%`,
                  }}
                  title="Drag Gradient Start Pin"
                >
                  <div className="w-2 h-2 rounded-full bg-white" />
                </div>

                {/* End Pin Handle */}
                <div
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setDraggedGradientHandle('end');
                  }}
                  className="absolute w-6 h-6 -ml-3 -mt-3 rounded-full bg-cyan-600 border-2 border-white shadow-xl cursor-grab active:cursor-grabbing pointer-events-auto flex items-center justify-center group z-40 hover:scale-125 transition-transform"
                  style={{
                    left: `${(selectedMask.endX ?? 0.5) * 100}%`,
                    top: `${(selectedMask.endY ?? 1.0) * 100}%`,
                  }}
                  title="Drag Gradient End Pin"
                >
                  <div className="w-2 h-2 rounded-full bg-slate-900" />
                </div>
              </>
            )}

            {/* Radial Gradient Interactive Bounding Ellipse & Center / Radius Handles */}
            {selectedMask.type === 'radial' && (
              <>
                <svg className="absolute inset-0 w-full h-full pointer-events-none">
                  <ellipse
                    cx={`${(selectedMask.centerX ?? 0.5) * 100}%`}
                    cy={`${(selectedMask.centerY ?? 0.5) * 100}%`}
                    rx={`${(selectedMask.radiusX ?? 0.35) * 100}%`}
                    ry={`${(selectedMask.radiusY ?? 0.35) * 100}%`}
                    fill="none"
                    stroke="rgba(245, 158, 11, 0.8)"
                    strokeWidth="2"
                    strokeDasharray="5 5"
                  />
                </svg>

                {/* Center Pin Handle */}
                <div
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setDraggedGradientHandle('center');
                  }}
                  className="absolute w-6 h-6 -ml-3 -mt-3 rounded-full bg-amber-500 border-2 border-white shadow-xl cursor-grab active:cursor-grabbing pointer-events-auto flex items-center justify-center group z-40 hover:scale-125 transition-transform"
                  style={{
                    left: `${(selectedMask.centerX ?? 0.5) * 100}%`,
                    top: `${(selectedMask.centerY ?? 0.5) * 100}%`,
                  }}
                  title="Drag Radial Center Pin"
                >
                  <div className="w-2 h-2 rounded-full bg-white" />
                </div>

                {/* Radius Perimeter Handle */}
                <div
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    setDraggedGradientHandle('radius');
                  }}
                  className="absolute w-5 h-5 -ml-2.5 -mt-2.5 rounded-full bg-amber-400 border-2 border-white shadow-xl cursor-ew-resize pointer-events-auto flex items-center justify-center group z-40 hover:scale-125 transition-transform"
                  style={{
                    left: `${((selectedMask.centerX ?? 0.5) + (selectedMask.radiusX ?? 0.35)) * 100}%`,
                    top: `${(selectedMask.centerY ?? 0.5) * 100}%`,
                  }}
                  title="Resize Radial Radius"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-900" />
                </div>
              </>
            )}

            {/* AI Object Target Point Indicator */}
            {selectedMask.type === 'ai-object' && selectedMask.aiObjectPoint && (
              <div
                className="absolute w-7 h-7 -ml-3.5 -mt-3.5 rounded-full border-2 border-violet-400 bg-violet-500/30 flex items-center justify-center pointer-events-none animate-pulse z-40"
                style={{
                  left: `${selectedMask.aiObjectPoint.x * 100}%`,
                  top: `${selectedMask.aiObjectPoint.y * 100}%`,
                }}
              >
                <div className="w-2 h-2 rounded-full bg-violet-400" />
              </div>
            )}
          </div>
        )}

        {/* Interactive On-Canvas Crop Box & Grid Overlay when on Crop tab */}
        {activeToolTab === 'crop' && (
          <div className="absolute inset-0 pointer-events-none z-30">
            {/* Shaded Outside Rectangles (Darkened Mask) */}
            <div
              className="absolute top-0 left-0 right-0 bg-black/60 pointer-events-none transition-all"
              style={{ height: `${project.crop.y * 100}%` }}
            />
            <div
              className="absolute bottom-0 left-0 right-0 bg-black/60 pointer-events-none transition-all"
              style={{ height: `${(1 - (project.crop.y + project.crop.height)) * 100}%` }}
            />
            <div
              className="absolute left-0 bg-black/60 pointer-events-none transition-all"
              style={{
                top: `${project.crop.y * 100}%`,
                height: `${project.crop.height * 100}%`,
                width: `${project.crop.x * 100}%`,
              }}
            />
            <div
              className="absolute right-0 bg-black/60 pointer-events-none transition-all"
              style={{
                top: `${project.crop.y * 100}%`,
                height: `${project.crop.height * 100}%`,
                width: `${(1 - (project.crop.x + project.crop.width)) * 100}%`,
              }}
            />

            {/* Active Crop Bounding Box */}
            <div
              className="absolute border border-white/90 shadow-[0_0_0_1px_rgba(0,0,0,0.5)] pointer-events-auto cursor-move select-none"
              style={{
                left: `${project.crop.x * 100}%`,
                top: `${project.crop.y * 100}%`,
                width: `${project.crop.width * 100}%`,
                height: `${project.crop.height * 100}%`,
              }}
              onMouseDown={(e) => handleStartCropDrag('move', e)}
            >
              {/* 3x3 Rule of Thirds Grid */}
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none opacity-60">
                <div className="border-r border-b border-white/40" />
                <div className="border-r border-b border-white/40" />
                <div className="border-b border-white/40" />
                <div className="border-r border-b border-white/40" />
                <div className="border-r border-b border-white/40" />
                <div className="border-b border-white/40" />
                <div className="border-r border-white/40" />
                <div className="border-r border-white/40" />
                <div />
              </div>

              {/* Floating Size HUD Badge */}
              <div className="absolute -top-7 left-0 bg-slate-900/90 text-white text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-white/30 backdrop-blur shadow-md whitespace-nowrap pointer-events-none">
                {Math.round((project.image.width || 1) * project.crop.width)} × {Math.round((project.image.height || 1) * project.crop.height)} px
              </div>

              {/* 4 Corner L-Bracket Handles */}
              {/* Top-Left */}
              <div
                onMouseDown={(e) => handleStartCropDrag('nw', e)}
                className="absolute -top-1.5 -left-1.5 w-4 h-4 cursor-nwse-resize pointer-events-auto flex items-start justify-start group"
              >
                <div className="w-3 h-3 border-t-2 border-l-2 border-white bg-indigo-600 shadow-sm" />
              </div>

              {/* Top-Right */}
              <div
                onMouseDown={(e) => handleStartCropDrag('ne', e)}
                className="absolute -top-1.5 -right-1.5 w-4 h-4 cursor-nesw-resize pointer-events-auto flex items-start justify-end group"
              >
                <div className="w-3 h-3 border-t-2 border-r-2 border-white bg-indigo-600 shadow-sm" />
              </div>

              {/* Bottom-Left */}
              <div
                onMouseDown={(e) => handleStartCropDrag('sw', e)}
                className="absolute -bottom-1.5 -left-1.5 w-4 h-4 cursor-nesw-resize pointer-events-auto flex items-end justify-start group"
              >
                <div className="w-3 h-3 border-b-2 border-l-2 border-white bg-indigo-600 shadow-sm" />
              </div>

              {/* Bottom-Right */}
              <div
                onMouseDown={(e) => handleStartCropDrag('se', e)}
                className="absolute -bottom-1.5 -right-1.5 w-4 h-4 cursor-nwse-resize pointer-events-auto flex items-end justify-end group"
              >
                <div className="w-3 h-3 border-b-2 border-r-2 border-white bg-indigo-600 shadow-sm" />
              </div>

              {/* 4 Edge Center Handles */}
              {/* Top Edge */}
              <div
                onMouseDown={(e) => handleStartCropDrag('n', e)}
                className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-6 h-3 cursor-ns-resize pointer-events-auto flex items-center justify-center"
              >
                <div className="w-4 h-1.5 bg-white rounded-full shadow-sm" />
              </div>

              {/* Bottom Edge */}
              <div
                onMouseDown={(e) => handleStartCropDrag('s', e)}
                className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-6 h-3 cursor-ns-resize pointer-events-auto flex items-center justify-center"
              >
                <div className="w-4 h-1.5 bg-white rounded-full shadow-sm" />
              </div>

              {/* Left Edge */}
              <div
                onMouseDown={(e) => handleStartCropDrag('w', e)}
                className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-3 h-6 cursor-ew-resize pointer-events-auto flex items-center justify-center"
              >
                <div className="w-1.5 h-4 bg-white rounded-full shadow-sm" />
              </div>

              {/* Right Edge */}
              <div
                onMouseDown={(e) => handleStartCropDrag('e', e)}
                className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-3 h-6 cursor-ew-resize pointer-events-auto flex items-center justify-center"
              >
                <div className="w-1.5 h-4 bg-white rounded-full shadow-sm" />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* AI Inpainting Floating Floating Toolbar when in AI tools mode */}
      {activeToolTab === 'ai-tools' && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-30 bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 p-3 rounded-2xl shadow-2xl flex flex-col sm:flex-row items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
            <Eraser className="w-4 h-4 text-rose-400" />
            <span>Brush Size:</span>
            <input
              type="range"
              min="8"
              max="120"
              value={brushSize}
              onChange={(e) => setBrushSize(Number(e.target.value))}
              className="w-24 accent-rose-500 cursor-pointer"
            />
            <span className="w-6 text-right font-mono">{brushSize}px</span>
          </div>

          <div className="h-4 w-[1px] bg-slate-700 hidden sm:block" />

          {/* Quick Prompt Hint for AI Object Removal */}
          <input
            type="text"
            placeholder="Optional prompt (e.g. remove person, clean background)"
            value={inpaintPrompt}
            onChange={(e) => setInpaintPrompt(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-xs text-slate-200 px-2.5 py-1 rounded-lg w-56 outline-none focus:border-indigo-500"
          />

          <div className="flex items-center gap-1.5">
            {/* Instant Offline Inpaint */}
            <button
              onClick={handleInstantOfflineInpaint}
              disabled={!hasMaskDrawn || isAiProcessing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-40 transition-all"
              title="Fast Offline Texture Synthesis (No internet needed)"
            >
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Fast Patch</span>
            </button>

            {/* AI Generative Inpaint */}
            <button
              onClick={handleAiGenerativeInpaint}
              disabled={!hasMaskDrawn || isAiProcessing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white shadow-lg shadow-rose-600/30 disabled:opacity-40 transition-all"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isAiProcessing ? 'animate-spin' : ''}`} />
              <span>AI Erase Object</span>
            </button>

            {/* Clear Mask */}
            {hasMaskDrawn && (
              <button
                onClick={clearMask}
                className="p-1.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                title="Clear Mask"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Selective Masking Floating Toolbar when in Masks mode */}
      {activeToolTab === 'masks' && selectedMask && (
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-30 bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 p-2.5 rounded-2xl shadow-2xl flex flex-wrap items-center gap-3">
          {/* Active Mask Tag */}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-xl bg-indigo-950/80 border border-indigo-500/30 text-indigo-300 text-xs font-bold">
            <Layers className="w-3.5 h-3.5 text-indigo-400" />
            <span>{selectedMask.name}</span>
          </div>

          {/* Brush / Eraser Controls */}
          {(selectedMask.type === 'brush' || selectedMask.type === 'eraser') && (
            <>
              <div className="h-4 w-[1px] bg-slate-700 hidden sm:block" />

              <div className="flex items-center gap-2 text-xs font-semibold text-slate-300">
                <Paintbrush className="w-4 h-4 text-pink-400" />
                <span>Size:</span>
                <input
                  type="range"
                  min="5"
                  max="120"
                  value={selectiveBrushSize}
                  onChange={(e) => setSelectiveBrushSize(Number(e.target.value))}
                  className="w-20 accent-pink-500 cursor-pointer"
                />
                <span className="w-6 text-right font-mono text-pink-300">{selectiveBrushSize}px</span>
              </div>

              {/* Mode Toggle: Paint vs Erase */}
              {selectedMask.type === 'brush' && (
                <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-[11px] font-bold">
                  <button
                    onClick={() => setSelectiveBrushMode('add')}
                    className={`px-2 py-0.5 rounded-md transition-colors ${
                      selectiveBrushMode === 'add' ? 'bg-pink-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Paint
                  </button>
                  <button
                    onClick={() => setSelectiveBrushMode('erase')}
                    className={`px-2 py-0.5 rounded-md transition-colors ${
                      selectiveBrushMode === 'erase' ? 'bg-rose-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Erase
                  </button>
                </div>
              )}

              {/* Clear Strokes Button */}
              {selectedMask.brushStrokes && selectedMask.brushStrokes.length > 0 && (
                <button
                  onClick={() => {
                    if (onUpdateMasks) {
                      onUpdateMasks(
                        project.masks.map((m) => (m.id === selectedMask.id ? { ...m, brushStrokes: [] } : m))
                      );
                      showToast('info', 'Brush Cleared', 'Removed all brush strokes from this mask.');
                    }
                  }}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                  title="Clear all strokes"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              )}
            </>
          )}

          {/* Color Range Hint */}
          {selectedMask.type === 'color-range' && (
            <div className="flex items-center gap-2 text-xs text-purple-300">
              <Pipette className="w-4 h-4 text-purple-400" />
              <span>Click any pixel on photo to sample target color</span>
              <div
                className="w-4 h-4 rounded-full border border-white/50 shadow-sm"
                style={{ backgroundColor: selectedMask.targetColor || '#3b82f6' }}
              />
            </div>
          )}

          {/* AI Object Hint */}
          {selectedMask.type === 'ai-object' && (
            <div className="flex items-center gap-2 text-xs text-violet-300">
              <Crosshair className="w-4 h-4 text-violet-400 animate-spin" />
              <span>Click on any object in photo to segment</span>
            </div>
          )}

          {/* Linear or Radial Gradient Hint */}
          {(selectedMask.type === 'linear' || selectedMask.type === 'radial') && (
            <div className="flex items-center gap-2 text-xs text-cyan-300">
              <span className="text-[11px] text-slate-400">Drag circle pins directly on photo to position</span>
            </div>
          )}
        </div>
      )}

      {/* Bottom Zoom & View Controls Toolbar */}
      <div className="absolute bottom-4 right-4 z-20 flex items-center gap-1 bg-slate-900/85 backdrop-blur-md border border-slate-800/80 p-1 rounded-xl shadow-xl">
        <button
          onClick={() => handleZoom(-0.15)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <button
          onClick={fitToScreen}
          className="px-2 py-1 rounded-lg text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 transition-colors"
          title="Fit to Screen"
        >
          {Math.round(scale * 100)}%
        </button>

        <button
          onClick={() => handleZoom(0.15)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <div className="h-4 w-[1px] bg-slate-800 mx-0.5" />

        <button
          onClick={() => setScale(1)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="100% Native Resolution"
        >
          <Crosshair className="w-4 h-4" />
        </button>

        <button
          onClick={fitToScreen}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="Fit View"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
