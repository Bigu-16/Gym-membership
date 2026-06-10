import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';
import { THEME } from '../theme';

/**
 * Scene 1 — Brand Intro  (frames 0–240 = 0s–8s)
 *
 * Faster timeline:
 *   0–12    bg fade in
 *   15–55   ambient glow grows
 *   18–55   logo slides down
 *   40–110  "LUXE WELLNESS" wipes left→right
 *   80–120  "COLLECTIVE" fades + slides up
 *   110–160 emerald accent line draws
 *   140–200 tagline words stagger in
 *   185–215 "Gym Management Platform" callout at bottom-left
 *   205–225 scroll hint fades
 */
export const IntroScene = () => {
  const frame = useCurrentFrame() * 1.25;
  const { fps } = useVideoConfig();

  const bgOpacity = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: 'clamp' });

  const glowOpacity = interpolate(frame, [15, 55], [0, 1], { extrapolateRight: 'clamp' });
  const glowScale   = interpolate(frame, [15, 80], [0.5, 1.2], { extrapolateRight: 'clamp' });

  const logoSpring  = spring({ frame: frame - 18, fps, config: { damping: 18, stiffness: 90 } });
  const logoOpacity = interpolate(frame, [18, 50], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const logoY       = interpolate(logoSpring, [0, 1], [-65, 0]);

  const headlineClip = interpolate(frame, [40, 110], [0, 100], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const subSpring  = spring({ frame: frame - 80, fps, config: { damping: 22, stiffness: 95 } });
  const subOpacity = interpolate(frame, [80, 120], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const subY       = interpolate(subSpring, [0, 1], [24, 0]);

  const lineWidth = interpolate(frame, [110, 160], [0, 100], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const tagline = (sf) => {
    const s = spring({ frame: frame - sf, fps, config: { damping: 20, stiffness: 120 } });
    return {
      opacity: interpolate(frame, [sf, sf + 20], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
      y: interpolate(s, [0, 1], [15, 0]),
    };
  };
  const t1 = tagline(145);
  const t2 = tagline(160);
  const t3 = tagline(175);

  // Bottom-left callout
  const calloutOpacity = interpolate(frame, [185, 210], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const calloutY = interpolate(spring({ frame: frame - 185, fps, config: { damping: 22, stiffness: 100 } }), [0, 1], [28, 0]);

  const arrowOpacity = interpolate(frame, [205, 225], [0, 0.45], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <div style={{
      width: '100%', height: '100%',
      backgroundColor: THEME.bgPrimary,
      opacity: bgOpacity,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: THEME.font,
      position: 'relative', overflow: 'hidden',
    }}>

      {/* Grid */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)`,
        backgroundSize: '80px 80px', pointerEvents: 'none',
      }} />

      {/* Glows */}
      <div style={{ position: 'absolute', width: 900, height: 900, borderRadius: '50%', background: `radial-gradient(circle, ${THEME.accentDim} 0%, transparent 65%)`, opacity: glowOpacity, transform: `scale(${glowScale})`, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: -250, left: -250, width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.08) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -250, right: -250, width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(251,191,36,0.06) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* Main content */}
      <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

        {/* Logo */}
        <div style={{ opacity: logoOpacity, transform: `translateY(${logoY}px)`, marginBottom: 40, display: 'flex', alignItems: 'center', gap: 18 }}>
          <div style={{ width: 62, height: 62, borderRadius: 18, background: THEME.textPrimary, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 40px rgba(255,255,255,0.08)' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={THEME.bgPrimary} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase', color: THEME.textPrimary, lineHeight: 1 }}>Antigravity</span>
            <span style={{ fontSize: 10, marginTop: 5, letterSpacing: '0.25em', textTransform: 'uppercase', color: THEME.textSecondary }}>Wellness Center</span>
          </div>
        </div>

        {/* GYM MANAGEMENT wipe */}
        <div style={{ overflow: 'hidden' }}>
          <h1 style={{ fontSize: 100, fontWeight: 300, letterSpacing: '0.16em', textTransform: 'uppercase', color: THEME.textPrimary, margin: 0, lineHeight: 1, clipPath: `inset(0 ${100 - headlineClip}% 0 0)` }}>
            GYM <span style={{ fontWeight: 800 }}>MANAGEMENT</span>
          </h1>
        </div>

        {/* OPERATIONS & ANALYTICS */}
        <div style={{ opacity: subOpacity, transform: `translateY(${subY}px)`, marginTop: 10 }}>
          <span style={{ fontSize: 18, fontWeight: 400, letterSpacing: '0.45em', textTransform: 'uppercase', color: THEME.textSecondary }}>OPERATIONS & ANALYTICS</span>
        </div>

        {/* Accent line */}
        <div style={{ width: 700, height: 2, background: THEME.glassBorder, borderRadius: 2, marginTop: 34, position: 'relative' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${lineWidth}%`, background: `linear-gradient(90deg, ${THEME.accent}, transparent)`, borderRadius: 2, boxShadow: `0 0 14px ${THEME.accent}55` }} />
        </div>

        {/* Tagline */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 26, marginTop: 36 }}>
          {[
            { text: 'Manage', anim: t1 }, { text: '·', anim: t1, dot: true },
            { text: 'Grow',   anim: t2 }, { text: '·', anim: t2, dot: true },
            { text: 'Thrive', anim: t3 },
          ].map(({ text, anim, dot }, i) => (
            <span key={i} style={{
              fontSize: dot ? 28 : 14, fontWeight: dot ? 300 : 600,
              letterSpacing: dot ? 0 : '0.35em', textTransform: 'uppercase',
              color: dot ? THEME.accent : THEME.textSecondary,
              opacity: anim.opacity, transform: `translateY(${anim.y}px)`, lineHeight: 1,
            }}>{text}</span>
          ))}
        </div>
      </div>

      {/* Bottom-left callout */}
      <div style={{
        position: 'absolute', bottom: 56, left: 60,
        opacity: calloutOpacity, transform: `translateY(${calloutY}px)`,
        zIndex: 100, display: 'flex', alignItems: 'flex-start', gap: 14,
      }}>
        <div style={{ width: 3, minHeight: 54, alignSelf: 'stretch', background: `linear-gradient(180deg, ${THEME.accent}, transparent)`, borderRadius: 2, flexShrink: 0 }} />
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 10px', borderRadius: 20, background: `${THEME.accent}18`, border: `1px solid ${THEME.accent}30`, marginBottom: 8 }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: THEME.accent }} />
            <span style={{ fontSize: 7, fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase', color: THEME.accent }}>Gym Management Platform</span>
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: THEME.textPrimary, letterSpacing: '0.03em', lineHeight: 1.1, marginBottom: 10 }}>Premium Club OS</div>
          <div style={{ fontSize: 20, color: '#f1f5f9', lineHeight: 1.6, maxWidth: 480, fontWeight: 500, textShadow: '0 2px 12px rgba(0,0,0,0.6)' }}>
            A luxury gym management dashboard — from member enrollment to live session tracking.
          </div>
        </div>
      </div>

      {/* Scroll hint */}
      <div style={{ position: 'absolute', bottom: 56, right: 60, opacity: arrowOpacity, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7 }}>
        <span style={{ fontSize: 8, letterSpacing: '0.4em', textTransform: 'uppercase', color: THEME.textSecondary }}>Explore</span>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={THEME.textSecondary} strokeWidth="1.5" strokeLinecap="round">
          <path d="M12 5v14M5 12l7 7 7-7" />
        </svg>
      </div>
    </div>
  );
};
