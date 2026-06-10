import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, spring, interpolateColors } from 'remotion';
import { THEME } from '../theme';

/**
 * Scene 7 — Outro / CTA  (local 0–90 = video 1710–1800, 57s–60s)
 *
 * Premium closing: brand center + all 6 features summarized + fade to black
 *
 * Timeline:
 *   0–15    fade in from black
 *   0–30    ambient glows expand
 *   10–50   logo + "LUXE WELLNESS" slides up
 *   40–65   "COLLECTIVE" + accent line
 *   50–82   6 feature pills stagger in (3×2 grid)
 *   62–82   CTA badge glows in
 *   72–82   tagline reappears
 *   82–90   fade to black
 */

const FEATURES = [
  { icon: '◈', label: 'Live Dashboard',     sub: 'KPIs at a glance'         },
  { icon: '◉', label: 'Member Directory',   sub: 'Search & status tracking'  },
  { icon: '◎', label: 'Smart Enrollment',   sub: 'Family & group registration'},
  { icon: '◈', label: 'Week Schedule',      sub: 'Templates & calendar view' },
  { icon: '◉', label: 'Business Analytics', sub: 'Revenue & heatmaps'        },
  { icon: '◎', label: 'Desk Check-In',      sub: 'Live attendance tracking'  },
];

export const OutroScene = () => {
  const frame = useCurrentFrame() * 1.25;
  const { fps } = useVideoConfig();
  const ease = { damping: 20, stiffness: 90 };

  // Background
  const bgOp = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });

  // Glow expand
  const glowScale   = interpolate(frame, [0, 40], [0.4, 1.3], { extrapolateRight: 'clamp' });
  const glowOpacity = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: 'clamp' });

  // Logo block
  const logoSpring  = spring({ frame: frame - 10, fps, config: ease });
  const logoOp      = interpolate(frame, [10, 45], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const logoY       = interpolate(logoSpring, [0, 1], [50, 0]);

  // Headline wipe
  const headlineClip = interpolate(frame, [28, 65], [0, 100], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // "COLLECTIVE" sub
  const subOp = interpolate(frame, [42, 62], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const subY  = interpolate(spring({ frame: frame - 42, fps, config: ease }), [0, 1], [18, 0]);

  // Accent line draw
  const lineW = interpolate(frame, [48, 68], [0, 100], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Feature pills stagger
  const pill = (i) => ({
    op: interpolate(frame, [52 + i * 4, 52 + i * 4 + 12], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
    y:  interpolate(spring({ frame: frame - (52 + i * 4), fps, config: { damping: 22, stiffness: 120 } }), [0, 1], [22, 0]),
  });

  // CTA badge
  const ctaOp    = interpolate(frame, [64, 78], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const ctaGlow  = frame >= 64 ? 0.08 + 0.06 * Math.sin(((frame - 64) / fps) * Math.PI * 3) : 0;
  const ctaScale = interpolate(spring({ frame: frame - 64, fps, config: { damping: 16, stiffness: 140 } }), [0, 1], [0.85, 1]);

  // Tagline
  const tagOp = interpolate(frame, [72, 82], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Final fade to black
  const fadeOut = interpolate(frame, [115, 125], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <div style={{
      width: '100%', height: '100%',
      backgroundColor: THEME.bgPrimary,
      opacity: bgOp,
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: THEME.font,
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Grid */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `linear-gradient(rgba(255,255,255,0.016) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.016) 1px, transparent 1px)`,
        backgroundSize: '80px 80px', pointerEvents: 'none',
      }} />

      {/* Glows */}
      <div style={{ position: 'absolute', width: 1000, height: 1000, borderRadius: '50%', background: `radial-gradient(circle, ${THEME.accentDim} 0%, transparent 60%)`, opacity: glowOpacity * 0.7, transform: `scale(${glowScale})`, pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: -300, left: -300, width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.07) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -300, right: -300, width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle, rgba(251,191,36,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* ── Main content ── */}
      <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0 }}>

        {/* Logo */}
        <div style={{ opacity: logoOp, transform: `translateY(${logoY}px)`, display: 'flex', alignItems: 'center', gap: 18, marginBottom: 36 }}>
          <div style={{ width: 60, height: 60, borderRadius: 18, background: THEME.textPrimary, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 40px rgba(255,255,255,0.1)' }}>
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke={THEME.bgPrimary} strokeWidth="2.2" strokeLinecap="round">
              <path d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase', color: THEME.textPrimary, lineHeight: 1 }}>Antigravity</div>
            <div style={{ fontSize: 9, letterSpacing: '0.25em', textTransform: 'uppercase', color: THEME.textSecondary, marginTop: 4 }}>Wellness Center</div>
          </div>
        </div>

        {/* GYM MANAGEMENT */}
        <div style={{ overflow: 'hidden', marginBottom: 10 }}>
          <h1 style={{
            fontSize: 90, fontWeight: 300, letterSpacing: '0.14em', textTransform: 'uppercase',
            color: THEME.textPrimary, margin: 0, lineHeight: 1,
            clipPath: `inset(0 ${100 - headlineClip}% 0 0)`,
          }}>
            GYM <span style={{ fontWeight: 800 }}>MANAGEMENT</span>
          </h1>
        </div>

        {/* OPERATIONS & ANALYTICS */}
        <div style={{ opacity: subOp, transform: `translateY(${subY}px)`, marginBottom: 28 }}>
          <span style={{ fontSize: 15, fontWeight: 400, letterSpacing: '0.45em', textTransform: 'uppercase', color: THEME.textSecondary }}>
            OPERATIONS & ANALYTICS
          </span>
        </div>

        {/* Accent line */}
        <div style={{ width: 560, height: 1.5, background: THEME.glassBorder, borderRadius: 2, marginBottom: 36, position: 'relative' }}>
          <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: `${lineW}%`, background: `linear-gradient(90deg, ${THEME.accent}, transparent)`, borderRadius: 2, boxShadow: `0 0 12px ${THEME.accent}55` }} />
        </div>

        {/* Feature pills grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px 20px', marginBottom: 42, width: 700 }}>
          {FEATURES.map((f, i) => {
            const p = pill(i);
            return (
              <div key={f.label} style={{
                display: 'flex', alignItems: 'center', gap: 14,
                padding: '14px 20px', borderRadius: 16,
                background: THEME.glassBg,
                border: `1px solid ${THEME.glassBorder}`,
                opacity: p.op,
                transform: `translateY(${p.y}px)`,
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  background: `${THEME.accent}15`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, color: THEME.accent,
                }}>{f.icon}</div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: THEME.textPrimary, lineHeight: 1, marginBottom: 4 }}>{f.label}</div>
                  <div style={{ fontSize: 9, color: THEME.textSecondary, letterSpacing: '0.08em' }}>{f.sub}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* CTA badge */}
        <div style={{
          opacity: ctaOp,
          transform: `scale(${ctaScale})`,
          display: 'flex', alignItems: 'center', gap: 20,
          marginBottom: 28,
        }}>
          <div style={{
            padding: '16px 44px', borderRadius: 22,
            background: THEME.textPrimary,
            fontSize: 11, fontWeight: 700, letterSpacing: '0.3em', textTransform: 'uppercase',
            color: THEME.bgPrimary,
            boxShadow: `0 0 ${30 + ctaGlow * 300}px rgba(255,255,255,${ctaGlow}), 0 24px 50px -10px rgba(0,0,0,0.5)`,
          }}>
            Full Stack Dashboard
          </div>
          <div style={{
            padding: '16px 36px', borderRadius: 22,
            background: 'transparent',
            border: `1px solid ${THEME.glassBorder}`,
            fontSize: 11, fontWeight: 600, letterSpacing: '0.3em', textTransform: 'uppercase',
            color: THEME.textSecondary,
          }}>
            View Live Demo
          </div>
        </div>

        {/* Tagline */}
        <div style={{ opacity: tagOp, display: 'flex', alignItems: 'center', gap: 22 }}>
          {[
            { text: 'Manage', color: THEME.textSecondary },
            { text: '·',     color: THEME.accent, size: 24 },
            { text: 'Grow',  color: THEME.textSecondary },
            { text: '·',     color: THEME.accent, size: 24 },
            { text: 'Thrive',color: THEME.textSecondary },
          ].map(({ text, color, size }, i) => (
            <span key={i} style={{
              fontSize: size || 11, fontWeight: size ? 300 : 600,
              letterSpacing: size ? 0 : '0.35em', textTransform: 'uppercase',
              color, lineHeight: 1,
            }}>{text}</span>
          ))}
        </div>
      </div>

      {/* Fade to black overlay */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundColor: '#000',
        opacity: fadeOut,
        pointerEvents: 'none',
      }} />
    </div>
  );
};
