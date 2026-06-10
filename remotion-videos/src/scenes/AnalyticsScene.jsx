import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';
import { THEME } from '../theme';
import { FeatureCallout } from '../components/FeatureCallout';

/**
 * Scene 6 — Business Intelligence / Analytics  (local 0–150 = video 1560–1710)
 * Duration: 5s
 *
 * Layout matches real app: 4 KPI cards + (line chart + heatmap) | (donut + leaderboard)
 *
 * Timeline:
 *   0–12    fade in
 *   0–22    sidebar slides in
 *   8–40    header fades
 *   35–90   4 KPI cards stagger up
 *   68–105  Line chart draws (SVG path animate)
 *   85–125  Heatmap rows stagger in
 *   68–105  Donut ring draws in
 *   105–145 Leaderboard rows stagger in
 *   38–90   Callout 1: "Revenue & Growth Analytics"
 *   95–145  Callout 2: "Peak Hours & Class Leaderboard"
 */

const GlassCard = ({ children, style = {} }) => (
  <div style={{ background: THEME.glassBg, border: `1px solid ${THEME.glassBorder}`, borderRadius: 20, boxShadow: '0 8px 32px rgba(0,0,0,0.37)', ...style }}>
    {children}
  </div>
);

const NAV_ITEMS = ['Overview', 'Members', 'Schedule', 'Analytics', 'Enrollment'];

const SidebarNav = ({ opacity, x }) => (
  <div style={{ width: 200, display: 'flex', flexDirection: 'column', gap: 6, opacity, transform: `translateX(${x}px)`, flexShrink: 0 }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 24, padding: '0 6px' }}>
      <div style={{ width: 34, height: 34, borderRadius: 10, background: THEME.textPrimary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={THEME.bgPrimary} strokeWidth="2.2" strokeLinecap="round"><path d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
      </div>
      <div>
        <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: THEME.textPrimary }}>Antigravity</div>
        <div style={{ fontSize: 7, letterSpacing: '0.2em', textTransform: 'uppercase', color: THEME.textSecondary, marginTop: 2 }}>Wellness Systems</div>
      </div>
    </div>
    {NAV_ITEMS.map((label, i) => (
      <div key={label} style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12,
        background: i === 3 ? THEME.textPrimary : 'transparent',
        color: i === 3 ? THEME.bgPrimary : THEME.textSecondary,
        fontSize: 8, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase',
      }}>
        <div style={{ width: 14, height: 14, borderRadius: 3, background: i === 3 ? `${THEME.bgPrimary}22` : THEME.glassBorder }} />
        {label}
      </div>
    ))}
  </div>
);

// Revenue trajectory data (7 months)
const MONTHS = ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May'];
const REVENUES = [900, 980, 960, 1060, 1110, 1140, 1200];
const W = 420, H = 120, PAD = 20;
const maxR = Math.max(...REVENUES);
const minR = Math.min(...REVENUES);

const pts = REVENUES.map((r, i) => ({
  x: PAD + (i * (W - 2 * PAD)) / (REVENUES.length - 1),
  y: PAD + ((maxR - r) / (maxR - minR)) * (H - 2 * PAD),
}));

// Build cubic bezier path
let linePath = `M ${pts[0].x} ${pts[0].y}`;
for (let i = 0; i < pts.length - 1; i++) {
  const p0 = pts[i], p1 = pts[i + 1];
  const cx1 = p0.x + (p1.x - p0.x) / 3;
  const cx2 = p0.x + (2 * (p1.x - p0.x)) / 3;
  linePath += ` C ${cx1} ${p0.y}, ${cx2} ${p1.y}, ${p1.x} ${p1.y}`;
}
const areaPath = `${linePath} L ${pts[pts.length - 1].x} ${H} L ${pts[0].x} ${H} Z`;

// Heatmap
const HEAT_DAYS  = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HEAT_HOURS = ['6a', '8a', '10a', '12p', '2p', '4p', '6p', '8p'];
const heatIntensity = (d, h) => {
  const base = [0.15, 0.7, 0.5, 0.3, 0.55, 0.8, 0.45, 0.2];
  const weekend = d >= 5 ? 0.15 : 0;
  return Math.min(0.95, base[h] + Math.sin(d + h) * 0.08 + weekend);
};

// Donut chart (3 plans)
const PLANS = [
  { name: 'Elite Performance', pct: 33, color: '#34d399' },
  { name: 'Wellness Pro',      pct: 40, color: '#60a5fa' },
  { name: 'Diamond Access',    pct: 27, color: '#a78bfa' },
];
const CIRC = 2 * Math.PI * 38; // r=38

// Leaderboard
const LEADERS = [
  { rank: 1, name: 'Taekwondo Elite',    trainer: 'Master Kim',    ratio: 93, rating: 4.98 },
  { rank: 2, name: 'Zen Yoga Flow',      trainer: 'Sophia Chen',   ratio: 90, rating: 4.95 },
  { rank: 3, name: 'Elite Performance',  trainer: 'Marcus Thorne', ratio: 80, rating: 4.90 },
  { rank: 4, name: 'Muay Thai Sparring', trainer: 'Coach Somchai', ratio: 75, rating: 4.92 },
];

export const AnalyticsScene = () => {
  const frame = useCurrentFrame() * 1.25;
  const { fps } = useVideoConfig();
  const ease = { damping: 22, stiffness: 120 };

  const bgOp     = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: 'clamp' });
  const sideOp   = interpolate(frame, [0, 22], [0, 1], { extrapolateRight: 'clamp' });
  const sideX    = interpolate(spring({ frame, fps, config: ease }), [0, 1], [-80, 0]);
  const headerOp = interpolate(frame, [8, 40], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const headerY  = interpolate(spring({ frame: frame - 8, fps, config: ease }), [0, 1], [-24, 0]);

  // KPI cards
  const kpi = (sf) => ({
    op: interpolate(frame, [sf, sf + 20], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
    y:  interpolate(spring({ frame: frame - sf, fps, config: { damping: 20, stiffness: 100 } }), [0, 1], [40, 0]),
  });
  const k1 = kpi(36), k2 = kpi(48), k3 = kpi(60), k4 = kpi(72);

  // Line chart draw (SVG stroke-dashoffset trick)
  const lineProgress = interpolate(frame, [68, 115], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const pathLen = 600; // approximate
  const lineDashOffset = pathLen * (1 - lineProgress);

  // Heatmap rows
  const heatRow = (ri) =>
    interpolate(frame, [88 + ri * 5, 88 + ri * 5 + 15], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Donut segments
  const donutProgress = interpolate(frame, [68, 118], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Leaderboard rows
  const lRow = (ri) =>
    interpolate(frame, [108 + ri * 8, 108 + ri * 8 + 18], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // KPI data
  const KPIS = [
    { label: 'Monthly Run Rate', value: '$1,200', badge: '+14% MoM', badgeColor: THEME.accent },
    { label: 'Avg Check-Ins / Day', value: '4.3', badge: '+8.2%', badgeColor: THEME.accent },
    { label: 'Member Retention', value: '98.2%', badge: 'Stable', badgeColor: THEME.accent },
    { label: 'Trainer Feedback', value: '4.94', badge: '98% Positive', badgeColor: '#fbbf24' },
  ];

  const kpis = [k1, k2, k3, k4];

  return (
    <div style={{
      width: '100%', height: '100%',
      backgroundColor: THEME.bgPrimary, opacity: bgOp,
      fontFamily: THEME.font,
      display: 'flex', gap: 36,
      padding: '38px 46px', boxSizing: 'border-box',
      position: 'relative', overflow: 'hidden',
    }}>
      {/* Glows */}
      <div style={{ position: 'absolute', top: -250, right: -200, width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(96,165,250,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -200, left: -200, width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(52,211,153,0.04) 0%, transparent 70%)', pointerEvents: 'none' }} />

      <SidebarNav opacity={sideOp} x={sideX} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16, minWidth: 0 }}>

        {/* Header */}
        <div style={{ opacity: headerOp, transform: `translateY(${headerY}px)`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div>
            <h1 style={{ fontSize: 40, fontWeight: 300, letterSpacing: '0.1em', textTransform: 'uppercase', color: THEME.textPrimary, margin: 0, lineHeight: 1 }}>
              Business <span style={{ fontWeight: 800 }}>Intelligence</span>
            </h1>
            <p style={{ fontSize: 8, color: THEME.textSecondary, letterSpacing: '0.2em', textTransform: 'uppercase', marginTop: 6 }}>
              Analytics · Trends · Performance
            </p>
          </div>
          {/* Zone filter pills */}
          <div style={{ display: 'flex', background: THEME.glassBg, border: `1px solid ${THEME.glassBorder}`, borderRadius: 12, padding: 3, gap: 2 }}>
            {['All', 'Main Floor', 'Zen Garden', 'VIP Zone'].map((z, i) => (
              <div key={z} style={{
                padding: '5px 10px', borderRadius: 9,
                background: i === 0 ? THEME.textPrimary : 'transparent',
                color: i === 0 ? THEME.bgPrimary : THEME.textSecondary,
                fontSize: 7, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase',
              }}>{z}</div>
            ))}
          </div>
        </div>

        {/* KPI row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          {KPIS.map((kp, i) => (
            <GlassCard key={i} style={{ padding: '16px 18px', opacity: kpis[i].op, transform: `translateY(${kpis[i].y}px)`, position: 'relative', overflow: 'hidden' }}>
              <div style={{ fontSize: 7, letterSpacing: '0.22em', textTransform: 'uppercase', color: THEME.textSecondary, marginBottom: 5 }}>{kp.label}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                <span style={{ fontSize: 26, fontWeight: 300, color: THEME.textPrimary, lineHeight: 1 }}>{kp.value}</span>
                <span style={{ fontSize: 7, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: kp.badgeColor }}>{kp.badge}</span>
              </div>
              {/* sparkline deco */}
              <div style={{ position: 'absolute', bottom: 0, left: 0, width: '100%', height: 20, opacity: 0.12 }}>
                <svg width="100%" height="100%" viewBox="0 0 100 20" preserveAspectRatio="none">
                  <path d="M0 18 Q25 6, 50 12 T100 5 L100 20 L0 20 Z" fill={kp.badgeColor} />
                </svg>
              </div>
            </GlassCard>
          ))}
        </div>

        {/* Main two-column row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 0.55fr', gap: 16, flex: 1, minHeight: 0 }}>

          {/* Left: Line chart + Heatmap */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>

            {/* Line chart */}
            <GlassCard style={{ padding: '14px 18px', flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div>
                  <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: THEME.textSecondary }}>Enrollment & Revenue Trajectory</div>
                  <div style={{ fontSize: 7, color: THEME.textSecondary, letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.6, marginTop: 2 }}>Month-over-month performance</div>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  {[{ label: 'Revenue', color: THEME.textPrimary }, { label: 'Members', color: THEME.accent }].map(({ label, color }) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 7, color: THEME.textSecondary, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                      <div style={{ width: 16, height: 2, borderRadius: 1, background: color }} />
                      {label}
                    </div>
                  ))}
                </div>
              </div>

              <svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ overflow: 'visible' }}>
                <defs>
                  <linearGradient id="aG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={THEME.textPrimary} stopOpacity="0.12" />
                    <stop offset="100%" stopColor={THEME.textPrimary} stopOpacity="0" />
                  </linearGradient>
                </defs>
                {/* grid lines */}
                {[25, 72, H].map((y) => (
                  <line key={y} x1={PAD} y1={y} x2={W - PAD} y2={y} stroke={THEME.glassBorder} strokeWidth="0.5" strokeDasharray="4 4" />
                ))}
                {/* area fill */}
                <path d={areaPath} fill="url(#aG)" opacity={lineProgress} />
                {/* line — animates with dashoffset */}
                <path
                  d={linePath}
                  fill="none"
                  stroke={THEME.textPrimary}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeDasharray={pathLen}
                  strokeDashoffset={lineDashOffset}
                />
                {/* dots */}
                {pts.map((p, i) => (
                  <g key={i} opacity={interpolate(frame, [68 + i * 7, 75 + i * 7], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}>
                    <circle cx={p.x} cy={p.y} r="3.5" fill={THEME.bgPrimary} stroke={THEME.textPrimary} strokeWidth="1.8" />
                    <circle cx={p.x} cy={p.y + 6} r="2" fill={THEME.accent} opacity="0.7" />
                  </g>
                ))}
              </svg>

              {/* X axis */}
              <div style={{ display: 'flex', justifyContent: 'space-between', paddingInline: PAD, marginTop: 6 }}>
                {MONTHS.map((m) => (
                  <span key={m} style={{ fontSize: 7, letterSpacing: '0.12em', textTransform: 'uppercase', color: THEME.textSecondary, fontWeight: 700 }}>{m}</span>
                ))}
              </div>
            </GlassCard>

            {/* Heatmap */}
            <GlassCard style={{ padding: '12px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: THEME.textSecondary }}>Peak Gym Occupancy Grid</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 7, color: THEME.textSecondary, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  <span>Quieter</span>
                  {[0.12, 0.3, 0.6, 0.9].map((o, i) => (
                    <div key={i} style={{ width: 10, height: 10, borderRadius: 3, background: THEME.textPrimary, opacity: o }} />
                  ))}
                  <span>Busiest</span>
                </div>
              </div>
              {/* Hour header */}
              <div style={{ display: 'grid', gridTemplateColumns: '28px repeat(8, 1fr)', gap: 4, marginBottom: 4 }}>
                <div />
                {HEAT_HOURS.map((h) => (
                  <div key={h} style={{ fontSize: 6, textAlign: 'center', letterSpacing: '0.1em', textTransform: 'uppercase', color: THEME.textSecondary, fontWeight: 700 }}>{h}</div>
                ))}
              </div>
              {HEAT_DAYS.map((day, di) => (
                <div key={day} style={{ display: 'grid', gridTemplateColumns: '28px repeat(8, 1fr)', gap: 4, marginBottom: 4, opacity: heatRow(di) }}>
                  <div style={{ fontSize: 7, color: THEME.textSecondary, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', display: 'flex', alignItems: 'center' }}>{day}</div>
                  {HEAT_HOURS.map((_, hi) => {
                    const intensity = heatIntensity(di, hi);
                    return (
                      <div key={hi} style={{
                        height: 14, borderRadius: 4,
                        background: THEME.textPrimary,
                        opacity: Math.max(0.12, intensity),
                      }} />
                    );
                  })}
                </div>
              ))}
            </GlassCard>
          </div>

          {/* Right: Donut + Leaderboard */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>

            {/* Donut ring */}
            <GlassCard style={{ padding: '14px 16px' }}>
              <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: THEME.textSecondary, marginBottom: 2 }}>Membership Distribution</div>
              <div style={{ fontSize: 7, color: THEME.textSecondary, letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.6, marginBottom: 12 }}>Share of membership tiers</div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                {/* SVG Donut */}
                <svg width={110} height={110} viewBox="0 0 100 100" style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
                  <circle cx="50" cy="50" r="38" fill="none" stroke={THEME.glassBorder} strokeWidth="8" />
                  {(() => {
                    let acc = 0;
                    return PLANS.map((plan) => {
                      const pct = plan.pct * donutProgress;
                      const dashArray = CIRC;
                      const dashOffset = CIRC - (pct / 100) * CIRC;
                      const rotateOffset = (acc / 100) * 360;
                      acc += plan.pct;
                      return (
                        <circle
                          key={plan.name}
                          cx="50" cy="50" r="38"
                          fill="none"
                          stroke={plan.color}
                          strokeWidth="8"
                          strokeDasharray={dashArray}
                          strokeDashoffset={dashOffset}
                          transform={`rotate(${rotateOffset} 50 50)`}
                          strokeLinecap="round"
                        />
                      );
                    });
                  })()}
                  {/* Center text rendered via foreignObject workaround — use text element */}
                  <text x="50" y="47" textAnchor="middle" style={{ transform: 'rotate(90deg)', transformOrigin: '50px 50px' }}
                    fill={THEME.textPrimary} fontSize="8" fontFamily="inherit">Total</text>
                  <text x="50" y="60" textAnchor="middle" style={{ transform: 'rotate(90deg)', transformOrigin: '50px 50px' }}
                    fill={THEME.textPrimary} fontSize="14" fontWeight="300" fontFamily="inherit">6</text>
                </svg>

                {/* Legend */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
                  {PLANS.map((plan) => (
                    <div key={plan.name} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: plan.color, flexShrink: 0 }} />
                        <span style={{ fontSize: 8, color: THEME.textSecondary, lineHeight: 1.2 }}>{plan.name.split(' ')[0]}</span>
                      </div>
                      <span style={{ fontSize: 9, fontWeight: 700, color: THEME.textPrimary }}>{plan.pct}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </GlassCard>

            {/* Leaderboard */}
            <GlassCard style={{ padding: '14px 16px', flex: 1 }}>
              <div style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: THEME.textSecondary, marginBottom: 2 }}>Class Leaderboard</div>
              <div style={{ fontSize: 7, color: THEME.textSecondary, letterSpacing: '0.12em', textTransform: 'uppercase', opacity: 0.6, marginBottom: 12 }}>Enrollment ratios & ratings</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {LEADERS.map((item, i) => (
                  <div key={item.rank} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '9px 12px', borderRadius: 12,
                    border: `1px solid ${THEME.glassBorder}`,
                    background: THEME.glassBg,
                    opacity: lRow(i),
                    transform: `translateY(${interpolate(spring({ frame: frame - (108 + i * 8), fps, config: { damping: 20, stiffness: 95 } }), [0, 1], [20, 0])}px)`,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 22, height: 22, borderRadius: 7, background: THEME.textPrimary, color: THEME.bgPrimary, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 8, fontWeight: 700, flexShrink: 0 }}>
                        #{item.rank}
                      </div>
                      <div>
                        <div style={{ fontSize: 9, fontWeight: 700, color: THEME.textPrimary, lineHeight: 1, marginBottom: 2 }}>{item.name}</div>
                        <div style={{ fontSize: 7, letterSpacing: '0.12em', textTransform: 'uppercase', color: THEME.textSecondary }}>{item.trainer}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 10, fontWeight: 700, color: THEME.textPrimary, lineHeight: 1, marginBottom: 2 }}>{item.ratio}%</div>
                      <div style={{ fontSize: 8, color: '#fbbf24', fontWeight: 700 }}>★ {item.rating}</div>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </div>
        </div>
      </div>

      {/* Feature Callouts */}
      <FeatureCallout
        label="Feature"
        title="Revenue & Growth Analytics"
        description="Track monthly run rate, member retention, and check-in trends with beautiful bezier line charts and KPI cards."
        startFrame={38}
        endFrame={95}
      />
      <FeatureCallout
        label="Feature"
        title="Peak Hours & Class Leaderboard"
        description="A live occupancy heatmap and trainer leaderboard reveal your busiest hours and highest-performing classes at a glance."
        startFrame={100}
        endFrame={145}
      />
    </div>
  );
};
