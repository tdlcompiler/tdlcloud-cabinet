/**
 * Theme-aware glass morphism color tokens.
 * Provides consistent colors for the glassmorphic card components
 * that work on both dark and light backgrounds.
 */
export function getGlassColors(isDark: boolean) {
  return {
    // Card container
    cardBg: isDark
      ? 'linear-gradient(180deg, rgba(255,255,255,0.05) 0%, transparent 34%), linear-gradient(145deg, rgba(15,23,42,0.94) 0%, rgba(8,15,28,0.88) 100%)'
      : 'linear-gradient(180deg, rgba(255,255,255,0.92) 0%, rgba(255,255,255,0.72) 100%), linear-gradient(145deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.9) 100%)',
    cardBorder: isDark ? 'rgba(148,163,184,0.14)' : 'rgba(15,23,42,0.08)',

    // Inner sections (cards within cards)
    innerBg: isDark
      ? 'linear-gradient(180deg, rgba(255,255,255,0.035), rgba(255,255,255,0.015))'
      : 'linear-gradient(180deg, rgba(255,255,255,0.78), rgba(255,255,255,0.52))',
    innerBorder: isDark ? 'rgba(148,163,184,0.09)' : 'rgba(15,23,42,0.06)',

    // Hover states
    hoverBg: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.74)',
    hoverBorder: isDark ? 'rgba(148,163,184,0.16)' : 'rgba(15,23,42,0.1)',

    // Text
    text: isDark ? '#f8fafc' : '#0f172a',
    textSecondary: isDark ? 'rgba(226,232,240,0.48)' : 'rgba(15,23,42,0.54)',
    textMuted: isDark ? 'rgba(226,232,240,0.34)' : 'rgba(15,23,42,0.38)',
    textFaint: isDark ? 'rgba(226,232,240,0.26)' : 'rgba(15,23,42,0.28)',
    textGhost: isDark ? 'rgba(226,232,240,0.1)' : 'rgba(15,23,42,0.08)',

    // Progress bar track
    trackBg: isDark ? 'rgba(8,15,28,0.75)' : 'rgba(226,232,240,0.72)',
    trackBorder: isDark ? 'rgba(148,163,184,0.08)' : 'rgba(15,23,42,0.06)',

    // Code blocks
    codeBg: isDark ? 'rgba(255,255,255,0.035)' : 'rgba(255,255,255,0.74)',
    codeBorder: isDark ? 'rgba(148,163,184,0.08)' : 'rgba(15,23,42,0.06)',

    // Glow effects — reduced in light mode
    glowAlpha: isDark ? '15' : '08',

    // Shadows for light mode depth
    shadow: isDark
      ? '0 24px 56px rgba(2,6,23,0.28), inset 0 1px 0 rgba(255,255,255,0.05)'
      : '0 22px 52px rgba(148,163,184,0.14), inset 0 1px 0 rgba(255,255,255,0.86)',
  };
}
