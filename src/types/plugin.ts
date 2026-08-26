export type PluginCategory =
  | 'filter'       // Custom JS / Canvas Pixel / WebGL Shaders
  | 'lut'          // 3D LUT Color Profiles (.cube / table)
  | 'ai-model'     // Custom Vision & AI Pipeline Modifiers
  | 'brush'        // Custom Procedural & Stamp Brushes
  | 'preset'       // Aesthetic Presets & Tone Curves Bundles
  | 'font'         // Web Fonts & Dynamic Typography
  | 'template'     // Layout & Social Media Templates
  | 'script'       // Automation Macros & JS Batch Scripts
  | 'integration'; // Third-Party Connectors (Figma, Unsplash, Webhooks)

export type ParameterType = 'slider' | 'color' | 'toggle' | 'select' | 'text' | 'number';

export interface PluginParameter {
  id: string;
  label: string;
  type: ParameterType;
  defaultValue: any;
  min?: number;
  max?: number;
  step?: number;
  options?: { label: string; value: any }[];
  unit?: string;
  description?: string;
}

export interface BrushTipConfig {
  tipType: 'circle' | 'square' | 'scatter' | 'star' | 'bokeh' | 'ink' | 'watercolor' | 'chalk';
  size: number;
  spacing: number;
  jitter: number;
  hardness: number;
  opacity: number;
  flow: number;
  scatterRadius: number;
  colorBlend: boolean;
}

export interface TemplateElementConfig {
  id: string;
  type: 'text' | 'badge' | 'frame' | 'overlay' | 'gradient' | 'sticker';
  text?: string;
  x: number; // percentage 0-100
  y: number; // percentage 0-100
  fontSize?: number;
  fontWeight?: string;
  fontFamily?: string;
  color?: string;
  backgroundColor?: string;
  width?: number;
  height?: number;
  borderRadius?: number;
  opacity?: number;
  rotation?: number;
}

export interface TemplateDataConfig {
  aspectRatio: string;
  name: string;
  category: 'story' | 'youtube' | 'cover' | 'product' | 'banner' | 'poster';
  elements: TemplateElementConfig[];
  backgroundOverlay?: {
    gradient?: string;
    opacity?: number;
    blendMode?: string;
  };
}

export interface FontConfig {
  fontFamily: string;
  category: 'serif' | 'sans-serif' | 'display' | 'handwriting' | 'monospace';
  googleFontName?: string;
  weights: number[];
  customFontUrl?: string;
  sampleText?: string;
}

export interface IntegrationConfig {
  serviceName: string;
  serviceType: 'stock_photo' | 'cloud_storage' | 'design_tool' | 'webhook';
  apiKey?: string;
  webhookUrl?: string;
  exportFormat?: 'png' | 'jpeg' | 'webp';
  targetCollection?: string;
  status: 'connected' | 'disconnected' | 'configuring';
}

export interface LuminaPlugin {
  id: string;
  name: string;
  category: PluginCategory;
  version: string;
  author: string;
  authorEmail?: string;
  authorId?: string;
  description: string;
  iconName: string; // Lucide icon name or emoji
  tags: string[];
  isBuiltin: boolean;
  isInstalled: boolean;
  isEnabled: boolean;
  rating: number;
  downloadsCount: number;
  updatedAt: number;
  createdAt: number;
  isPublic?: boolean;
  
  // Dynamic parameters configurable by the user
  parameters: PluginParameter[];
  currentParams: Record<string, any>;

  // Category specific payloads
  code?: string; // Executable JS code for filters or scripts
  lutData?: {
    format: 'cube' | 'hald' | 'table';
    size: number;
    cubeContent?: string;
    curveR?: number[];
    curveG?: number[];
    curveB?: number[];
  };
  aiConfig?: {
    systemPrompt: string;
    taskType: 'enhance' | 'relight' | 'stylize' | 'sky_replace' | 'cleanup';
    temperature?: number;
    recommendedStyle?: string;
  };
  brushConfig?: BrushTipConfig;
  presetData?: {
    adjustments?: Record<string, number>;
    toneCurves?: any;
    hsl?: any;
    presetStrength?: number;
  };
  fontConfig?: FontConfig;
  templateData?: TemplateDataConfig;
  integrationConfig?: IntegrationConfig;
  documentation?: string;
}

export interface PluginExecutionResult {
  success: boolean;
  message?: string;
  executionTimeMs?: number;
  logs?: string[];
  modifiedSettings?: Record<string, any>;
  data?: any;
}
