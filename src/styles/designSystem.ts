/**
 * Lumina Studio Pro — Final Visual Design System
 * Strict 3-Color Hierarchy:
 * 1. PRIMARY BLACK:   #050505
 * 2. DARK RED:        #7A0F18
 * 3. GREYISH WHITE:   #E6E3DE
 */

import { LUMINA_COLORS, LUMINA_THEME } from './designTokens';

export { LUMINA_COLORS, LUMINA_THEME };

export const MONOCHROME_THEME = {
  colors: {
    bgApp: '#050505',
    bgSecondary: '#0a0a0a',
    bgSurface: '#111111',
    bgSurfaceElevated: '#171717',
    bgSurfaceActive: 'rgba(122, 15, 24, 0.25)',
    bgSurfaceHover: 'rgba(230, 227, 222, 0.06)',
    
    borderSubtle: 'rgba(230, 227, 222, 0.08)',
    borderDefault: 'rgba(230, 227, 222, 0.12)',
    borderStrong: 'rgba(230, 227, 222, 0.20)',
    borderActive: '#7A0F18',
    borderWhite: '#E6E3DE',

    textPrimary: '#E6E3DE',
    textSecondary: 'rgba(230, 227, 222, 0.70)',
    textMuted: 'rgba(230, 227, 222, 0.45)',
    textDim: 'rgba(230, 227, 222, 0.35)',
    textDisabled: 'rgba(230, 227, 222, 0.25)',

    accentRed: '#7A0F18',
    accentRedHover: '#8F141E',
  },
  typography: {
    fontSans: 'ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontMono: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  },
  statusGlyphs: {
    READY: { glyph: '●', label: 'READY', text: 'text-[#E6E3DE]', symbol: '●' },
    IDLE: { glyph: '○', label: 'IDLE', text: 'text-[rgba(230,227,222,0.45)]', symbol: '○' },
    PROCESSING: { glyph: '◐', label: 'PROCESSING', text: 'text-[#7A0F18] animate-pulse', symbol: '◐' },
    STOPPED: { glyph: '■', label: 'STOPPED', text: 'text-[rgba(230,227,222,0.35)]', symbol: '■' },
    WARNING: { glyph: '△', label: 'WARNING', text: 'text-[#E6E3DE]', symbol: '△' },
    FAILED: { glyph: '✕', label: 'FAILED', text: 'text-[#7A0F18]', symbol: '✕' },
    SUCCESS: { glyph: '✓', label: 'SUCCESS', text: 'text-[#E6E3DE]', symbol: '✓' },
  }
} as const;

export type StatusGlyphType = keyof typeof MONOCHROME_THEME.statusGlyphs;

export function getStatusBadge(type: StatusGlyphType, customLabel?: string) {
  const config = MONOCHROME_THEME.statusGlyphs[type] || MONOCHROME_THEME.statusGlyphs.IDLE;
  return {
    symbol: config.glyph,
    label: customLabel || config.label,
    className: `inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] font-mono font-medium bg-[#0b0b0b] border border-[rgba(230,227,222,0.12)] text-[#E6E3DE] tracking-wide`,
  };
}
