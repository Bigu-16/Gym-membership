import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';
import { THEME, MEMBERS, SESSIONS } from '../theme';
import { FeatureCallout } from '../components/FeatureCallout';

const GlassCard = ({ children, style = {} }) => (
  <div style={{
    background: THEME.glassBg,
    border: `1px solid ${THEME.glassBorder}`,
    borderRadius: 24,
    boxShadow: '0 8px 32px rgba(0,0,0,0.37)',
    ...style,
  }}>
    {children}
  </div>
);

const NAV_ITEMS = ['Overview', 'Members', 'Schedule', 'Analytics', 'Enrollment'];

const SidebarNav = ({ opacity, x }) => (
  <div style={{
    width: 210, display: 'flex', flexDirection: 'column', gap: 6,
    opacity, transform: `translateX(${x}px)`, flexShrink: 0,
  }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28, padding: '0 8px' }}>
      <div style={{
        width: 38, height: 38, borderRadius: 12,
        background: THEME.textPrimary,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={THEME.bgPrimary} strokeWidth="2.2" strokeLinecap="round">
          <path d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      </div>
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: THEME.textPrimary }}>Antigravity</div>
        <div style={{ fontSize: 8, letterSpacing: '0.2em', textTransform: 'uppercase', color: THEME.textSecondary, marginTop: 2 }}>Wellness Systems</div>
      </div>
    </div>
    {NAV_ITEMS.map((label, i) => (
      <div key={label} style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '11px 14px', borderRadius: 14,
        background: i === 0 ? THEME.textPrimary : 'transparent',
        color: i === 0 ? THEME.bgPrimary : THEME.textSecondary,
        fontSize: 9, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase',
      }}>
        <div style={{ width: 16, height: 16, borderRadius: 3, background: i === 0 ? `${THEME.bgPrimary}22` : THEME.glassBorder }} />
        {label}
      </div>
    ))}
    <div style={{ marginTop: 24 }}>
      <GlassCard style={{ padding: '12px 14px' }}>
        <div style={{ fontSize: 8, letterSpacing: '0.2em', textTransform: 'uppercase', color: THEME.textSecondary, marginBottom: 3 }}>Current Shift</div>
        <div style={{ fontSize: 10, fontWeight: 600, color: THEME.textPrimary }}>Morning Session</div>
        <div style={{ fontSize: 9, color: THEME.accent, marginTop: 3 }}>Ends in 2h 15m</div>
      </GlassCard>
    </div>
  </div>
);

const StatCard = ({ label, value, sub, subColor, opacity, y }) => (
  <GlassCard style={{
    padding: '22px 24px', flex: 1,
    opacity, transform: `translateY(${y}px)`,
    position: 'relative', overflow: 'hidden',
  }}>
    <div style={{ fontSize: 8, letterSpacing: '0.25em', textTransform: 'uppercase', color: THEME.textSecondary, marginBottom: 6 }}>{label}</div>
    <div style={{ fontSize: 36, fontWeight: 300, color: THEME.textPrimary, lineHeight: 1 }}>{value}</div>
    <div style={{ fontSize: 8, fontWeight: 700, color: subColor || THEME.accent, letterSpacing: '0.2em', textTransform: 'uppercase', marginTop: 8 }}>{sub}</div>
    <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: 26, opacity: 0.18 }}>
      <svg width="100%" height="100%" viewBox="0 0 100 20" preserveAspectRatio="none">
        <path d="M0 18 Q30 4, 60 14 T100 6 L100 20 L0 20 Z" fill={subColor || THEME.accent} />
      </svg>
    </div>
  </GlassCard>
);

const SessionCard = ({ session, opacity, x }) => {
  const isLive = session.status === 'in-progress';
  return (
    <GlassCard style={{
      padding: '18px 22px',
      border: `1px solid ${isLive ? 'rgba(255,255,255,0.16)' : THEME.glassBorder}`,
      opacity, transform: `translateX(${x}px)`,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
            <span style={{ fontSize: 16, fontWeight: 300, color: THEME.textPrimary }}>{session.title}</span>
            <span style={{
              padding: '2px 9px', borderRadius: 20,
              fontSize: 7, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase',
              background: isLive ? 'rgba(52,211,153,0.1)' : 'rgba(251,191,36,0.1)',
              color: isLive ? THEME.accent : '#fbbf24',
            }}>{isLive ? 'In Progress' : 'Upcoming'}</span>
          </div>
          <div style={{ fontSize: 9, color: THEME.textSecondary, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
            {session.trainer} · {session.location}
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 7, letterSpacing: '0.2em', textTransform: 'uppercase', color: THEME.textSecondary }}>Session Slot</div>
          <div style={{ fontSize: 10, fontWeight: 600, color: THEME.textPrimary, marginTop: 2 }}>{session.time}</div>
        </div>
      </div>
      <div style={{ borderTop: `1px solid ${THEME.glassBorder}`, paddingTop: 10 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          {['Warm-up', 'Core sequence', 'Cool-down'].map((task, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{
                width: 12, height: 12, borderRadius: 3, flexShrink: 0,
                border: `1.5px solid ${i === 0 && isLive ? THEME.accent : THEME.glassBorder}`,
                background: i === 0 && isLive ? THEME.accent : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {i === 0 && isLive && (
                  <svg width="7" height="7" viewBox="0 0 12 12" fill="none" stroke={THEME.bgPrimary} strokeWidth="2.5" strokeLinecap="round">
                    <path d="M2 6l3 3 5-5" />
                  </svg>
                )}
              </div>
              <span style={{ fontSize: 9, color: THEME.textSecondary, opacity: i === 0 && isLive ? 0.5 : 1 }}>{task}</span>
            </div>
          ))}
        </div>
        <div style={{ width: '100%', height: 2, background: THEME.glassBorder, borderRadius: 2, marginTop: 10 }}>
          <div style={{ height: '100%', width: isLive ? '33%' : '0%', background: THEME.textPrimary, borderRadius: 2 }} />
        </div>
      </div>
    </GlassCard>
  );
};

/**
 * Scene 2 — Dashboard Overview  (local frames 0–360 = video 240–600)
 *
 * FASTER timeline:
 *   0–15    fade in
 *   0–30    sidebar slides in
 *   10–45   header fades down
 *   35–100  3 KPI cards stagger up       → Callout 1: "Real-Time KPI Dashboard"
 *   90–160  3 session cards slide in     → Callout 2: "Live Session Control"
 *   155–200 check-in panel slides in     → Callout 3: "Desk Check-In System"
 */
export const DashboardScene = () => {
  const frame = useCurrentFrame() * 1.25;
  const { fps } = useVideoConfig();
  const ease = { damping: 22, stiffness: 110 };

  const bgOpacity    = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });

  const sidebarSpring = spring({ frame, fps, config: ease });
  const sidebarX      = interpolate(sidebarSpring, [0, 1], [-80, 0]);
  const sidebarOp     = interpolate(frame, [0, 30], [0, 1], { extrapolateRight: 'clamp' });

  const headerOp = interpolate(frame, [10, 45], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const headerY  = interpolate(spring({ frame: frame - 10, fps, config: ease }), [0, 1], [-28, 0]);

  const kpiCard = (sf) => ({
    opacity: interpolate(frame, [sf, sf + 25], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
    y: interpolate(spring({ frame: frame - sf, fps, config: { damping: 20, stiffness: 100 } }), [0, 1], [50, 0]),
  });
  const kpi1 = kpiCard(38);
  const kpi2 = kpiCard(52);
  const kpi3 = kpiCard(66);

  const sess = (sf) => ({
    opacity: interpolate(frame, [sf, sf + 30], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
    x: interpolate(spring({ frame: frame - sf, fps, config: ease }), [0, 1], [-50, 0]),
  });
  const s1 = sess(95);
  const s2 = sess(118);
  const s3 = sess(141);

  const panelOp = interpolate(frame, [160, 200], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const panelX  = interpolate(spring({ frame: frame - 160, fps, config: ease }), [0, 1], [70, 0]);

  const pulseScale = 1 + 0.3 * Math.sin((frame / fps) * Math.PI * 2.5);

  return (
    <div style={{
      width: '100%', height: '100%',
      backgroundColor: THEME.bgPrimary,
      opacity: bgOpacity,
      fontFamily: THEME.font,
      display: 'flex', gap: 44,
      padding: '44px 52px',
      boxSizing: 'border-box',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Ambient glows */}
      <div style={{ position: 'absolute', top: -300, left: -200, width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle, rgba(52,211,153,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -200, right: -200, width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* Sidebar */}
      <SidebarNav opacity={sidebarOp} x={sidebarX} />

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 28, minWidth: 0 }}>

        {/* Header */}
        <div style={{ opacity: headerOp, transform: `translateY(${headerY}px)`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h1 style={{ fontSize: 44, fontWeight: 300, letterSpacing: '0.1em', textTransform: 'uppercase', color: THEME.textPrimary, margin: 0, lineHeight: 1 }}>
              Club <span style={{ fontWeight: 800 }}>Overview</span>
            </h1>
            <p style={{ fontSize: 9, color: THEME.textSecondary, letterSpacing: '0.2em', textTransform: 'uppercase', marginTop: 7 }}>
              Managing <span style={{ color: THEME.textPrimary, opacity: 0.6 }}>Luxe Wellness Collective</span>
            </p>
          </div>
          <div style={{ display: 'flex', gap: 14 }}>
            {[{ label: 'Total Members', value: '6' }, { label: 'Active Now', value: '2', vc: THEME.accent }].map(({ label, value, vc }) => (
              <GlassCard key={label} style={{ padding: '9px 18px', textAlign: 'center' }}>
                <div style={{ fontSize: 8, letterSpacing: '0.2em', textTransform: 'uppercase', color: THEME.textSecondary, marginBottom: 2 }}>{label}</div>
                <div style={{ fontSize: 22, fontWeight: 600, color: vc || THEME.textPrimary }}>{value}</div>
              </GlassCard>
            ))}
          </div>
        </div>

        {/* KPI Cards */}
        <div style={{ display: 'flex', gap: 20 }}>
          <StatCard label="Active Directory"  value="6"    sub="+8% this week"             subColor={THEME.accent}  opacity={kpi1.opacity} y={kpi1.y} />
          <StatCard label="Live Occupancy"    value="2"    sub="~7% Capacity reached"       subColor={THEME.accent}  opacity={kpi2.opacity} y={kpi2.y} />
          <StatCard label="Today's Sessions"  value="3"    sub="1 in-progress · 2 upcoming" subColor="#fbbf24"       opacity={kpi3.opacity} y={kpi3.y} />
        </div>

        {/* Two-column layout */}
        <div style={{ display: 'flex', gap: 24, flex: 1, minHeight: 0 }}>

          {/* Session cards */}
          <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: THEME.accent, transform: `scale(${pulseScale})`, display: 'inline-block' }} />
              <span style={{ fontSize: 8, letterSpacing: '0.25em', textTransform: 'uppercase', color: THEME.textSecondary, fontWeight: 600 }}>
                Live Session Control Center
              </span>
            </div>
            <SessionCard session={SESSIONS[0]} opacity={s1.opacity} x={s1.x} />
            <SessionCard session={SESSIONS[1]} opacity={s2.opacity} x={s2.x} />
            <SessionCard session={SESSIONS[2]} opacity={s3.opacity} x={s3.x} />
          </div>

          {/* Check-in panel */}
          <div style={{ flex: 1, opacity: panelOp, transform: `translateX(${panelX}px)`, minWidth: 0 }}>
            <GlassCard style={{ padding: '20px 22px', height: '100%', boxSizing: 'border-box' }}>
              <div style={{ fontSize: 8, letterSpacing: '0.22em', textTransform: 'uppercase', color: THEME.textSecondary, fontWeight: 700, marginBottom: 14 }}>
                Desk Check-In Center
              </div>
              <div style={{ background: THEME.cardHover, border: `1px solid ${THEME.glassBorder}`, borderRadius: 10, padding: '9px 12px', fontSize: 10, color: THEME.textSecondary, marginBottom: 14 }}>
                Search member name...
              </div>
              <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
                {['All', 'Elite', 'Yoga', 'Muay Thai'].map((cat, i) => (
                  <div key={cat} style={{
                    padding: '4px 10px', borderRadius: 20,
                    fontSize: 7, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase',
                    background: i === 0 ? THEME.textPrimary : THEME.cardHover,
                    color: i === 0 ? THEME.bgPrimary : THEME.textSecondary,
                    border: `1px solid ${i === 0 ? THEME.textPrimary : THEME.glassBorder}`,
                  }}>{cat}</div>
                ))}
              </div>
              <div style={{ borderTop: `1px solid ${THEME.glassBorder}`, paddingTop: 12 }}>
                <div style={{ fontSize: 7, letterSpacing: '0.2em', textTransform: 'uppercase', color: THEME.textSecondary, fontWeight: 700, marginBottom: 10 }}>
                  Checked-In Members (2)
                </div>
                {MEMBERS.slice(0, 2).map((m) => (
                  <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 0', borderBottom: `1px solid ${THEME.glassBorder}` }}>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%',
                      background: `linear-gradient(135deg, ${THEME.glassBorder}, ${THEME.cardHover})`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 9, fontWeight: 700, color: THEME.textPrimary,
                      border: `1px solid ${THEME.glassBorder}`, flexShrink: 0,
                    }}>{m.initials}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 10, fontWeight: 600, color: THEME.textPrimary }}>{m.name}</div>
                      <div style={{ fontSize: 7, letterSpacing: '0.1em', textTransform: 'uppercase', color: THEME.textSecondary }}>{m.plan}</div>
                    </div>
                    <span style={{
                      fontSize: 7, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
                      color: THEME.accent, background: 'rgba(52,211,153,0.08)',
                      padding: '3px 7px', borderRadius: 20, border: `1px solid rgba(52,211,153,0.15)`,
                    }}>In Club</span>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>

        </div>
      </div>

      {/* ── Feature Callouts — 2 per scene ───────────────────── */}
      {/* Callout 1: Session Control — shown while session cards build */}
      <FeatureCallout
        label="Feature"
        title="Live Session Control Center"
        description="Monitor active and upcoming training sessions with trainer protocols, real-time checklists, and progress tracking."
        startFrame={95}
        endFrame={195}
      />

      {/* Callout 2: Check-In System — shown while check-in panel is visible */}
      <FeatureCallout
        label="Feature"
        title="Desk Check-In System"
        description="Check members in instantly by name search or class category — with live occupancy and attendance tracking."
        startFrame={210}
        endFrame={355}
      />
    </div>
  );
};
