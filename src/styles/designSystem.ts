/**
 * Lumina Studio Pro — Monochrome Design System
 * 
 * Strict Grayscale Palette, Semantic Tokens, Typography, and Status Glyph Engine.
 * Formatted for precision workstations (DaVinci Resolve / Lightroom Classic / Capture One aesthetic).
 */

export const MONOCHROME_THEME = {
  colors: {
    // Canvas & Backgrounds
    bgApp: '#09090b',         // Pure dark workspace base (zinc-950)
    bgSecondary: '#121215',   // Sidebar / Sub-panel background
    bgSurface: '#18181b',     // Surface container (zinc-900)
    bgSurfaceElevated: '#202024', // Elevated modal / popover (zinc-850)
    bgSurfaceActive: '#27272a',   // Active / Pressed element (zinc-800)
    bgSurfaceHover: '#2a2a2e',    // Hovered element
    
    // Borders & Dividers
    borderSubtle: '#202024',  // Hairline subtle divider
    borderDefault: '#27272a', // Standard card / input border (zinc-800)
    borderStrong: '#3f3f46',  // Highlighted / focused border (zinc-700)
    borderActive: '#71717a',  // High contrast active border (zinc-500)
    borderWhite: '#ffffff',   // Maximum contrast selection

    // Typography
    textPrimary: '#fafafa',   // Heading, high-priority label (zinc-50)
    textSecondary: '#d4d4d8', // Body, parameters, values (zinc-300)
    textMuted: '#a1a1aa',     // Secondary descriptions (zinc-400)
    textDim: '#71717a',       // Hints, disabled states, key shortcuts (zinc-500)
    textDisabled: '#52525b',  // Inactive control text (zinc-600)
  },
  typography: {
    fontSans: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontMono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  },
  statusGlyphs: {
    READY: { glyph: '●', label: 'READY', text: 'text-zinc-100', symbol: '●' },
    IDLE: { glyph: '○', label: 'IDLE', text: 'text-zinc-400', symbol: '○' },
    PROCESSING: { glyph: '◐', label: 'PROCESSING', text: 'text-zinc-200 animate-pulse', symbol: '◐' },
    STOPPED: { glyph: '■', label: 'STOPPED', text: 'text-zinc-500', symbol: '■' },
    WARNING: { glyph: '△', label: 'WARNING', text: 'text-zinc-300', symbol: '△' },
    FAILED: { glyph: '✕', label: 'FAILED', text: 'text-zinc-400', symbol: '✕' },
    SUCCESS: { glyph: '✓', label: 'SUCCESS', text: 'text-zinc-100', symbol: '✓' },
  }
} as const;

export type StatusGlyphType = keyof typeof MONOCHROME_THEME.statusGlyphs;

/**
 * Reusable utility to render monochrome status pill without any color dependence.
 */
export function getStatusBadge(type: StatusGlyphType, customLabel?: string) {
  const config = MONOCHROME_THEME.statusGlyphs[type] || MONOCHROME_THEME.statusGlyphs.IDLE;
  return {
    symbol: config.glyph,
    label: customLabel || config.label,
    className: `inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-zinc-900 border border-zinc-700/80 text-zinc-200 tracking-wide`,
  };
}
