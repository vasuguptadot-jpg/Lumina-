/**
 * Lumina Studio Pro - Desktop & Tablet Native Status Bar
 * Displays canvas dimensions, color depth, active tool, zoom controls, and comparison triggers.
 */

import React from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize,
  Eye,
  Sliders,
  Sparkles,
  Layers,
  Activity,
  Check,
} from 'lucide-react';
import { Project } from '../../types/editor';

interface DesktopStatusBarProps {
  project: Project;
  activeToolTab?: string;
  zoomLevel: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomFit: () => void;
  onSetZoom: (zoom: number) => void;
  isComparing: boolean;
  onToggleCompare: () => void;
  onToggleFullscreen: () => void;
}

export const DesktopStatusBar: React.FC<DesktopStatusBarProps> = ({
  project,
  activeToolTab,
  zoomLevel,
  onZoomIn,
  onZoomOut,
  onZoomFit,
  onSetZoom,
  isComparing,
  onToggleCompare,
  onToggleFullscreen,
}) => {
  const width = project.image.width || 1920;
  const height = project.image.height || 1080;
  const megapixels = ((width * height) / 1_000_000).toFixed(1);

  return (
    <footer
      id="lumina-desktop-statusbar"
      className="hidden md:flex items-center justify-between h-7 bg-[#000000] border-t border-[#222222] px-3 select-none z-30 text-[11px] font-mono text-[#888888]"
    >
      {/* Left: Resolution, Color Depth, Profile */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-1.5 text-[#CCCCCC]">
          <span>
            {width} × {height} px
          </span>
          <span className="text-[#555555]">({megapixels} MP)</span>
        </div>

        <span className="text-[#333333]">•</span>

        <div className="text-[#999999]">
          {project.isRaw ? 'RAW Bayer (32-bit Float)' : 'sRGB (8-bit UNorm)'}
        </div>

        {project.cameraInfo && (
          <>
            <span className="text-[#333333]">•</span>
            <div className="text-[#777777] truncate max-w-[140px]">
              {project.cameraInfo.make} {project.cameraInfo.model}
            </div>
          </>
        )}
      </div>

      {/* Center: Active Tool / Status */}
      <div className="flex items-center space-x-2 text-[#AAAAAA]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#888888]" />
        <span className="capitalize">
          {activeToolTab ? `Active Tool: ${activeToolTab.replace('-', ' ')}` : 'Ready'}
        </span>
      </div>

      {/* Right: Compare + Zoom Controls */}
      <div className="flex items-center space-x-2.5">
        {/* Compare button */}
        <button
          onClick={onToggleCompare}
          title="Toggle Before/After Comparison (\)"
          className={`flex items-center space-x-1 px-1.5 py-0.5 rounded border transition-colors ${
            isComparing
              ? 'bg-white text-black border-white'
              : 'bg-[#111111] text-[#AAAAAA] border-[#2B2B2B] hover:text-white hover:border-[#444444]'
          }`}
        >
          <Eye className="w-3 h-3" />
          <span className="text-[10px]">Compare</span>
        </button>

        <span className="text-[#333333]">•</span>

        {/* Zoom Controls */}
        <div className="flex items-center space-x-1 bg-[#111111] border border-[#2B2B2B] rounded px-1 py-0.5">
          <button
            onClick={onZoomOut}
            title="Zoom Out (-)"
            className="p-0.5 hover:text-white transition-colors"
          >
            <ZoomOut className="w-3 h-3" />
          </button>

          <button
            onClick={onZoomFit}
            title="Fit to Canvas"
            className="px-1.5 text-[10px] text-white hover:underline"
          >
            {Math.round(zoomLevel * 100)}%
          </button>

          <button
            onClick={onZoomIn}
            title="Zoom In (+)"
            className="p-0.5 hover:text-white transition-colors"
          >
            <ZoomIn className="w-3 h-3" />
          </button>
        </div>

        {/* Quick Zoom Presets */}
        <div className="hidden lg:flex items-center space-x-1 text-[10px]">
          <button
            onClick={onZoomFit}
            className="px-1 py-0.5 rounded hover:bg-[#222222] hover:text-white text-[#777777]"
          >
            Fit
          </button>
          <button
            onClick={() => onSetZoom(1.0)}
            className="px-1 py-0.5 rounded hover:bg-[#222222] hover:text-white text-[#777777]"
          >
            100%
          </button>
          <button
            onClick={() => onSetZoom(2.0)}
            className="px-1 py-0.5 rounded hover:bg-[#222222] hover:text-white text-[#777777]"
          >
            200%
          </button>
        </div>

        {/* Fullscreen Toggle */}
        <button
          onClick={onToggleFullscreen}
          title="Fullscreen (F)"
          className="p-1 rounded text-[#777777] hover:text-white hover:bg-[#1A1A1A] transition-colors"
        >
          <Maximize className="w-3 h-3" />
        </button>
      </div>
    </footer>
  );
};
