/**
 * Lumina Studio Pro — Final Visual Design System Tokens
 * Strict 3-Color Hierarchy:
 * 1. PRIMARY BLACK:   #050505 (Structure, Base Canvas, Panels, Navigation)
 * 2. DARK RED:        #7A0F18 (Single Action Accent, Active States, Selected, Sliders, Highlights)
 * 3. GREYISH WHITE:   #E6E3DE (Content, Typography, Icons, Dividers, Values)
 * 
 * Strict prohibition of Blue, Green, Cyan, Purple, Yellow, Orange, Pink, Pure White UI elements, or Bright Red.
 */

export const LUMINA_COLORS = {
  // 1. Primary Black
  black: '#050505',
  blackSurface: 'rgba(230, 227, 222, 0.03)',      // Subtle panel elevation (~#0c0c0b)
  blackSurfaceRaised: 'rgba(230, 227, 222, 0.06)',// Elevated card / modal (~#141312)
  blackSurfaceHover: 'rgba(230, 227, 222, 0.09)', // Hover state on dark surface
  blackSurfaceActive: 'rgba(122, 15, 24, 0.20)',  // Active selection with dark red tint

  // 2. Dark Red Accent (Action & Interaction)
  red: '#7A0F18',
  redHover: '#8F141E',
  redActive: '#650C13',
  redSubtle: 'rgba(122, 15, 24, 0.18)',
  redBorder: 'rgba(122, 15, 24, 0.65)',
  redGlow: 'rgba(122, 15, 24, 0.35)',

  // 3. Greyish White (Content & Information)
  white: '#E6E3DE',
  white90: 'rgba(230, 227, 222, 0.90)',
  white70: 'rgba(230, 227, 222, 0.70)', // Secondary text / icons
  white45: 'rgba(230, 227, 222, 0.45)', // Tertiary / hints / descriptions
  white25: 'rgba(230, 227, 222, 0.25)', // Disabled text / inactive glyphs
  white15: 'rgba(230, 227, 222, 0.15)', // Strong dividers
  white08: 'rgba(230, 227, 222, 0.08)', // Standard borders
  white04: 'rgba(230, 227, 222, 0.04)', // Hairline borders & subtle backgrounds
} as const;

export const LUMINA_THEME = {
  colors: {
    bgApp: LUMINA_COLORS.black,
    bgSurface: LUMINA_COLORS.blackSurface,
    bgSurfaceElevated: LUMINA_COLORS.blackSurfaceRaised,
    bgSurfaceActive: LUMINA_COLORS.redSubtle,
    borderSubtle: LUMINA_COLORS.white08,
    borderStrong: LUMINA_COLORS.white15,
    borderActive: LUMINA_COLORS.red,
    textPrimary: LUMINA_COLORS.white,
    textSecondary: LUMINA_COLORS.white70,
    textTertiary: LUMINA_COLORS.white45,
    textDisabled: LUMINA_COLORS.white25,
    accent: LUMINA_COLORS.red,
    accentHover: LUMINA_COLORS.redHover,
  },
  statusGlyphs: {
    READY: { glyph: '●', label: 'READY', className: 'text-[#E6E3DE]' },
    PROCESSING: { glyph: '◐', label: 'PROCESSING', className: 'text-[#7A0F18] animate-pulse' },
    SUCCESS: { glyph: '✓', label: 'SUCCESS', className: 'text-[#E6E3DE]' },
    WARNING: { glyph: '△', label: 'WARNING', className: 'text-[#E6E3DE]' },
    ERROR: { glyph: '✕', label: 'ERROR', className: 'text-[#7A0F18]' },
    OFFLINE: { glyph: '○', label: 'OFFLINE', className: 'text-[rgba(230,227,222,0.45)]' },
  }
} as const;

/**
 * Standard Tailwind Classes Mapping for Lumina Design System:
 * - App Background: bg-[#050505]
 * - Panel / Card Background: bg-[#0b0b0b] or bg-[rgba(230,227,222,0.03)]
 * - Panel Border: border-[rgba(230,227,222,0.08)]
 * - Active Item / Tab / Selection: bg-[#7A0F18] text-[#E6E3DE] or border-[#7A0F18]
 * - Primary Button: bg-[#7A0F18] text-[#E6E3DE] hover:bg-[#8F141E]
 * - Secondary Button: bg-[#050505] border border-[rgba(230,227,222,0.2)] text-[#E6E3DE] hover:border-[#7A0F18]
 * - Primary Text: text-[#E6E3DE]
 * - Secondary Text: text-[rgba(230,227,222,0.70)]
 * - Muted / Hint Text: text-[rgba(230,227,222,0.45)]
 * - Disabled Text: text-[rgba(230,227,222,0.25)]
 */
