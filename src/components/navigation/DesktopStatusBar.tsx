/**
 * Lumina Studio Pro - Desktop & Tablet Native Status Bar
 * Displays canvas dimensions, color depth, active tool, zoom controls, and comparison triggers.
 * 
 * Strict 3-Color Hierarchy: #050505 (Black), #7A0F18 (Dark Red), #E6E3DE (Greyish White).
 */

import React from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize,
  Eye,
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
      className="hidden md:flex items-center justify-between h-7 bg-[#050505] border-t border-[rgba(230,227,222,0.08)] px-3 select-none z-30 text-[11px] font-mono text-[rgba(230,227,222,0.45)]"
    >
      {/* Left: Resolution, Color Depth, Profile */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-1.5 text-[#E6E3DE]">
          <span>
            {width} × {height} px
          </span>
          <span className="text-[rgba(230,227,222,0.45)]">({megapixels} MP)</span>
        </div>

        <span className="text-[rgba(230,227,222,0.15)]">•</span>

        <div className="text-[rgba(230,227,222,0.70)]">
          {project.isRaw ? 'RAW Bayer (32-bit Float)' : 'sRGB (8-bit UNorm)'}
        </div>

        {project.cameraInfo && (
          <>
            <span className="text-[rgba(230,227,222,0.15)]">•</span>
            <div className="text-[rgba(230,227,222,0.45)] truncate max-w-[140px]">
              {project.cameraInfo.make} {project.cameraInfo.model}
            </div>
          </>
        )}
      </div>

      {/* Center: Active Tool / Status */}
      <div className="flex items-center space-x-2 text-[rgba(230,227,222,0.70)]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#7A0F18]" />
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
              ? 'bg-[#7A0F18] text-[#E6E3DE] border-[#7A0F18]'
              : 'bg-[rgba(230,227,222,0.04)] text-[rgba(230,227,222,0.70)] border-[rgba(230,227,222,0.10)] hover:text-[#E6E3DE] hover:border-[#7A0F18]'
          }`}
        >
          <Eye className="w-3 h-3" />
          <span className="text-[10px]">Compare</span>
        </button>

        <span className="text-[rgba(230,227,222,0.15)]">•</span>

        {/* Zoom Controls */}
        <div className="flex items-center space-x-1 bg-[rgba(230,227,222,0.04)] border border-[rgba(230,227,222,0.10)] rounded px-1 py-0.5 text-[rgba(230,227,222,0.70)]">
          <button
            onClick={onZoomOut}
            title="Zoom Out (-)"
            className="p-0.5 hover:text-[#E6E3DE] transition-colors"
          >
            <ZoomOut className="w-3 h-3" />
          </button>

          <button
            onClick={onZoomFit}
            title="Fit to Canvas"
            className="px-1.5 text-[10px] text-[#E6E3DE] hover:underline font-mono"
          >
            {Math.round(zoomLevel * 100)}%
          </button>

          <button
            onClick={onZoomIn}
            title="Zoom In (+)"
            className="p-0.5 hover:text-[#E6E3DE] transition-colors"
          >
            <ZoomIn className="w-3 h-3" />
          </button>
        </div>

        {/* Quick Zoom Presets */}
        <div className="hidden lg:flex items-center space-x-1 text-[10px]">
          <button
            onClick={onZoomFit}
            className="px-1 py-0.5 rounded hover:bg-[rgba(230,227,222,0.08)] hover:text-[#E6E3DE] text-[rgba(230,227,222,0.45)]"
          >
            Fit
          </button>
          <button
            onClick={() => onSetZoom(1.0)}
            className="px-1 py-0.5 rounded hover:bg-[rgba(230,227,222,0.08)] hover:text-[#E6E3DE] text-[rgba(230,227,222,0.45)]"
          >
            100%
          </button>
          <button
            onClick={() => onSetZoom(2.0)}
            className="px-1 py-0.5 rounded hover:bg-[rgba(230,227,222,0.08)] hover:text-[#E6E3DE] text-[rgba(230,227,222,0.45)]"
          >
            200%
          </button>
        </div>

        {/* Fullscreen Toggle */}
        <button
          onClick={onToggleFullscreen}
          title="Fullscreen (F)"
          className="p-1 rounded text-[rgba(230,227,222,0.45)] hover:text-[#E6E3DE] hover:bg-[rgba(230,227,222,0.06)] transition-colors"
        >
          <Maximize className="w-3 h-3" />
        </button>
      </div>
    </footer>
  );
};
