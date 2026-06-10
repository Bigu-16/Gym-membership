import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';
import { THEME } from '../theme';
import { FeatureCallout } from '../components/FeatureCallout';

/**
 * Scene 5 — Training Schedule  (local 0–300 = video 1260–1560)
 *
 * Shows two sub-views that transition mid-scene:
 *   Phase A (0–160): Week Calendar view — grid builds column by column with session pills
 *   Phase B (160–300): Templates view — class template cards stagger in
 *
 * Timeline:
 *   0–15    fade in
 *   0–28    sidebar slides in
 *   10–45   header + view-mode tabs fade in
 *   40–55   view tab row pops in
 *   50–160  7 day columns build in left→right; sessions appear in each
 *   60–155  Callout 1: "Visual Week Calendar"
 *   158–162 cross-fade transition to Templates view
 *   165–280 template cards stagger up 3×2 grid
 *   170–295 Callout 2: "Class Template Manager"
 */

const GlassCard = ({ children, style = {} }) => (
  <div style={{ background: THEME.glassBg, border: `1px solid ${THEME.glassBorder}`, borderRadius: 24, boxShadow: '0 8px 32px rgba(0,0,0,0.37)', ...style }}>
    {children}
  </div>
);

const NAV_ITEMS = ['Overview', 'Members', 'Schedule', 'Analytics', 'Enrollment'];

const SidebarNav = ({ opacity, x }) => (
  <div style={{ width: 210, display: 'flex', flexDirection: 'column', gap: 6, opacity, transform: `translateX(${x}px)`, flexShrink: 0 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28, padding: '0 8px' }}>
      <div style={{ width: 38, height: 38, borderRadius: 12, background: THEME.textPrimary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={THEME.bgPrimary} strokeWidth="2.2" strokeLinecap="round"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
      </div>
      <div>
        <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: THEME.textPrimary }}>Antigravity</div>
        <div style={{ fontSize: 8, letterSpacing: '0.2em', textTransform: 'uppercase', color: THEME.textSecondary, marginTop: 2 }}>Wellness Systems</div>
      </div>
    </div>
    {NAV_ITEMS.map((label, i) => (
      <div key={label} style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderRadius: 14,
        background: i === 2 ? THEME.textPrimary : 'transparent',
        color: i === 2 ? THEME.bgPrimary : THEME.textSecondary,
        fontSize: 9, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase',
      }}>
        <div style={{ width: 16, height: 16, borderRadius: 3, background: i === 2 ? `${THEME.bgPrimary}22` : THEME.glassBorder }} />
        {label}
      </div>
    ))}
  </div>
);

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_DATES = ['9', '10', '11', '12', '13', '14', '15'];

// Sessions placed in the week grid (dayIndex, startHour, endHour, title, status)
const WEEK_SESSIONS = [
  { day: 0, start: 14, end: 15.5, title: 'Elite Performance', status: 'in-progress' },
  { day: 0, start: 16.5, end: 18,  title: 'Yoga Flow',         status: 'upcoming'    },
  { day: 2, start: 10, end: 11.5, title: 'Personal Training',  status: 'upcoming'    },
  { day: 2, start: 14, end: 15.5, title: 'Muay Thai',          status: 'upcoming'    },
  { day: 4, start: 9,  end: 10,   title: 'Fitness',            status: 'upcoming'    },
  { day: 4, start: 16, end: 17.5, title: 'Yoga Flow',          status: 'upcoming'    },
  { day: 6, start: 10, end: 11.5, title: 'Group Taekwondo',    status: 'upcoming'    },
];

const TEMPLATES = [
  { id: 1, name: 'Taekwondo',   days: 'Mon, Wed, Fri', time: '4:00 PM – 5:00 PM',  enrolled: 18, cap: 25 },
  { id: 2, name: 'Muay Thai',   days: 'Tue, Thu',      time: '6:00 PM – 7:00 PM',  enrolled: 22, cap: 25 },
  { id: 3, name: 'Yoga Flow',   days: 'Mon, Wed',      time: '7:00 AM – 8:00 AM',  enrolled: 10, cap: 20 },
  { id: 4, name: 'Fitness',     days: 'Tue, Thu, Sat', time: '9:00 AM – 10:00 AM', enrolled: 8,  cap: 20 },
  { id: 5, name: 'Kickboxing',  days: 'Sat, Sun',      time: '11:00 AM – 12:00 PM',enrolled: 14, cap: 20 },
  { id: 6, name: 'Elite Perf.', days: 'Mon–Fri',       time: '2:00 PM – 3:30 PM',  enrolled: 5,  cap: 10 },
];

// Hour grid: 8am–8pm
const HOURS = Array.from({ length: 12 }, (_, i) => i + 8);
const GRID_H = 480; // px tall

const timeToY = (hour) => ((hour - 8) / 12) * GRID_H;

export const ScheduleScene = () => {
  const frame = useCurrentFrame() * 1.25;
  const { fps } = useVideoConfig();
  const ease = { damping: 22, stiffness: 110 };

  const bgOpacity  = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });
  const sidebarOp  = interpolate(frame, [0, 28], [0, 1], { extrapolateRight: 'clamp' });
  const sidebarX   = interpolate(spring({ frame, fps, config: ease }), [0, 1], [-80, 0]);
  const headerOp   = interpolate(frame, [10, 45], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const headerY    = interpolate(spring({ frame: frame - 10, fps, config: ease }), [0, 1], [-28, 0]);

  // Phase switch at frame 158
  const isTemplatePhase = frame >= 158;
  const phaseFade = isTemplatePhase
    ? interpolate(frame, [158, 172], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
    : interpolate(frame, [50, 64], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Week calendar: columns appear left→right
  const colOpacity = (dayIdx) =>
    interpolate(frame, [50 + dayIdx * 12, 50 + dayIdx * 12 + 20], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const colX = (dayIdx) => {
    const s = spring({ frame: frame - (50 + dayIdx * 12), fps, config: { damping: 20, stiffness: 100 } });
    return interpolate(s, [0, 1], [30, 0]);
  };

  // Template cards stagger
  const tCard = (i) => ({
    opacity: interpolate(frame, [168 + i * 14, 168 + i * 14 + 25], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
    y: interpolate(spring({ frame: frame - (168 + i * 14), fps, config: { damping: 20, stiffness: 95 } }), [0, 1], [45, 0]),
  });

  return (
    <div style={{
      width: '100%', height: '100%',
      backgroundColor: THEME.bgPrimary, opacity: bgOpacity,
      fontFamily: THEME.font,
      display: 'flex', gap: 44,
      padding: '44px 52px', boxSizing: 'border-box',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Glows */}
      <div style={{ position: 'absolute', top: -300, right: -200, width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle, rgba(139,92,246,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -200, left: -200, width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(251,191,36,0.04) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* Sidebar */}
      <SidebarNav opacity={sidebarOp} x={sidebarX} />

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 }}>

        {/* Header */}
        <div style={{ opacity: headerOp, transform: `translateY(${headerY}px)`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h1 style={{ fontSize: 44, fontWeight: 300, letterSpacing: '0.1em', textTransform: 'uppercase', color: THEME.textPrimary, margin: 0, lineHeight: 1 }}>
              Training <span style={{ fontWeight: 800 }}>Schedule</span>
            </h1>
            <p style={{ fontSize: 9, color: THEME.textSecondary, letterSpacing: '0.2em', textTransform: 'uppercase', marginTop: 7 }}>
              Managing <span style={{ color: THEME.textPrimary, opacity: 0.6 }}>Luxe Wellness Collective</span>
            </p>
          </div>

          {/* View tabs */}
          <div style={{
            display: 'flex', background: THEME.glassBg,
            border: `1px solid ${THEME.glassBorder}`, borderRadius: 16, padding: 4, gap: 2,
          }}>
            {['Day', 'Week', 'Month', 'Templates'].map((tab) => {
              const isActive = isTemplatePhase ? tab === 'Templates' : tab === 'Week';
              return (
                <div key={tab} style={{
                  padding: '7px 14px', borderRadius: 12,
                  background: isActive ? THEME.textPrimary : 'transparent',
                  color: isActive ? THEME.bgPrimary : THEME.textSecondary,
                  fontSize: 8, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase',
                }}>{tab}</div>
              );
            })}
          </div>
        </div>

        {/* ── Phase A: Week Calendar ─────────────────────────────── */}
        {!isTemplatePhase && (
          <div style={{ opacity: phaseFade }}>
            {/* Month label + nav */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 18, fontWeight: 300, letterSpacing: '0.12em', textTransform: 'uppercase', color: THEME.textPrimary }}>
                June 2026
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                {['←', 'This Week', '→'].map((t, i) => (
                  <div key={i} style={{
                    padding: i === 1 ? '6px 14px' : '6px 10px',
                    borderRadius: 10, background: THEME.glassBg,
                    border: `1px solid ${THEME.glassBorder}`,
                    fontSize: 9, color: THEME.textSecondary, fontWeight: 600,
                  }}>{t}</div>
                ))}
              </div>
            </div>

            <GlassCard style={{ overflow: 'hidden', padding: 0 }}>
              {/* Day header row */}
              <div style={{ display: 'grid', gridTemplateColumns: '50px repeat(7, 1fr)', borderBottom: `1px solid ${THEME.glassBorder}` }}>
                <div style={{ borderRight: `1px solid ${THEME.glassBorder}` }} />
                {DAYS.map((day, i) => (
                  <div key={day} style={{
                    padding: '12px 8px', textAlign: 'center',
                    borderRight: i < 6 ? `1px solid ${THEME.glassBorder}` : 'none',
                    opacity: colOpacity(i), transform: `translateX(${colX(i)}px)`,
                  }}>
                    <div style={{ fontSize: 8, letterSpacing: '0.15em', textTransform: 'uppercase', color: THEME.textSecondary, marginBottom: 4 }}>{day}</div>
                    <div style={{
                      width: 28, height: 28, borderRadius: '50%', margin: '0 auto',
                      background: i === 1 ? THEME.textPrimary : 'transparent',
                      color: i === 1 ? THEME.bgPrimary : THEME.textPrimary,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 12, fontWeight: i === 1 ? 700 : 400,
                    }}>{DAY_DATES[i]}</div>
                  </div>
                ))}
              </div>

              {/* Time grid */}
              <div style={{ position: 'relative', height: GRID_H, overflow: 'hidden', display: 'grid', gridTemplateColumns: '50px repeat(7, 1fr)' }}>
                {/* Hour labels */}
                <div style={{ position: 'relative', borderRight: `1px solid ${THEME.glassBorder}` }}>
                  {HOURS.map((h) => (
                    <div key={h} style={{
                      position: 'absolute', top: timeToY(h) - 8,
                      left: 0, right: 0, textAlign: 'right', paddingRight: 8,
                      fontSize: 8, color: THEME.textSecondary,
                    }}>{h > 12 ? `${h - 12}p` : `${h}a`}</div>
                  ))}
                </div>

                {/* Day columns */}
                {DAYS.map((day, dayIdx) => {
                  const daySessions = WEEK_SESSIONS.filter(s => s.day === dayIdx);
                  return (
                    <div key={day} style={{
                      position: 'relative',
                      borderRight: dayIdx < 6 ? `1px solid ${THEME.glassBorder}` : 'none',
                      opacity: colOpacity(dayIdx), transform: `translateX(${colX(dayIdx)}px)`,
                    }}>
                      {/* Hour dashes */}
                      {HOURS.map((h) => (
                        <div key={h} style={{ position: 'absolute', top: timeToY(h), left: 0, right: 0, borderTop: `1px dashed ${THEME.glassBorder}`, opacity: 0.4 }} />
                      ))}
                      {/* Sessions */}
                      {daySessions.map((sess, si) => {
                        const isLive = sess.status === 'in-progress';
                        const top = timeToY(sess.start);
                        const height = ((sess.end - sess.start) / 12) * GRID_H;
                        return (
                          <div key={si} style={{
                            position: 'absolute', left: 3, right: 3,
                            top, height,
                            borderRadius: 8,
                            background: isLive ? THEME.textPrimary : THEME.glassBg,
                            border: isLive ? 'none' : `1px solid ${THEME.glassBorder}`,
                            padding: '5px 7px', overflow: 'hidden',
                            boxShadow: isLive ? '0 4px 16px rgba(255,255,255,0.1)' : 'none',
                          }}>
                            <div style={{ fontSize: 8, fontWeight: 700, color: isLive ? THEME.bgPrimary : THEME.textPrimary, lineHeight: 1.2, overflow: 'hidden' }}>{sess.title}</div>
                            {isLive && (
                              <div style={{ marginTop: 4, height: 2, background: 'rgba(0,0,0,0.15)', borderRadius: 1 }}>
                                <div style={{ width: '65%', height: '100%', background: THEME.accent, borderRadius: 1 }} />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </GlassCard>
          </div>
        )}

        {/* ── Phase B: Templates view ───────────────────────────── */}
        {isTemplatePhase && (
          <div style={{ opacity: phaseFade }}>
            <GlassCard style={{ padding: '16px 22px', marginBottom: 18, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 15, fontWeight: 300, letterSpacing: '0.12em', textTransform: 'uppercase', color: THEME.textPrimary }}>Active Class Templates</div>
                <div style={{ fontSize: 9, color: THEME.textSecondary, letterSpacing: '0.15em', textTransform: 'uppercase', marginTop: 3 }}>Recurring schedule slots for group enrollment</div>
              </div>
              <div style={{
                padding: '9px 18px', borderRadius: 14, background: THEME.textPrimary,
                fontSize: 9, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase',
                color: THEME.bgPrimary, display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
                Create Template
              </div>
            </GlassCard>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              {TEMPLATES.map((t, i) => {
                const c = tCard(i);
                const pct = (t.enrolled / t.cap) * 100;
                const isFull = t.enrolled >= t.cap;
                return (
                  <div key={t.id} style={{
                    background: THEME.glassBg, border: `1px solid ${THEME.glassBorder}`,
                    borderRadius: 20, padding: '18px 20px',
                    opacity: c.opacity, transform: `translateY(${c.y}px)`,
                    position: 'relative', overflow: 'hidden',
                  }}>
                    {/* bg gradient accent */}
                    <div style={{ position: 'absolute', top: 0, right: 0, width: 100, height: 100, background: 'linear-gradient(135deg, rgba(255,255,255,0.04), transparent)', borderRadius: '0 20px 0 100%' }} />

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                      <span style={{ fontSize: 7, letterSpacing: '0.2em', textTransform: 'uppercase', color: THEME.textSecondary, background: THEME.glassBorder, padding: '2px 8px', borderRadius: 20 }}>Slot #{t.id}</span>
                    </div>

                    <div style={{ fontSize: 20, fontWeight: 700, color: THEME.textPrimary, marginBottom: 2 }}>{t.time}</div>
                    <div style={{ fontSize: 10, color: THEME.textSecondary, letterSpacing: '0.08em', marginBottom: 16 }}>{t.days}</div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 7, letterSpacing: '0.2em', textTransform: 'uppercase', color: THEME.textSecondary }}>Capacity</span>
                        <span style={{ fontSize: 8, fontWeight: 700, color: isFull ? '#ef4444' : THEME.accent }}>{t.enrolled}/{t.cap} {isFull ? '(FULL)' : ''}</span>
                      </div>
                      <div style={{ height: 4, background: THEME.glassBorder, borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${pct}%`, background: isFull ? '#ef4444' : THEME.accent, borderRadius: 2 }} />
                      </div>
                    </div>

                    <div style={{ marginTop: 12, paddingTop: 10, borderTop: `1px dashed ${THEME.glassBorder}`, fontSize: 8, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: THEME.textSecondary }}>
                      {t.name}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Feature Callouts */}
      <FeatureCallout
        label="Feature"
        title="Visual Week Calendar"
        description="A full 7-day grid view with time-blocked sessions — active classes shown live with progress bars."
        startFrame={60}
        endFrame={152}
      />
      <FeatureCallout
        label="Feature"
        title="Class Template Manager"
        description="Create and manage recurring class slots with capacity tracking, enrollment counts, and one-click deletion."
        startFrame={175}
        endFrame={295}
      />
    </div>
  );
};
