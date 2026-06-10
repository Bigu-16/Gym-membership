import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';
import { THEME, MEMBERS, PLAN_COLOR } from '../theme';
import { FeatureCallout } from '../components/FeatureCallout';

/**
 * Scene 3 — Member Directory  (local frames 0–360 = video 600–960)
 *
 * Timeline:
 *   0–15    fade in
 *   0–28    sidebar slides in
 *   10–45   header + search bar fades down
 *   35–50   filter pills pop in
 *   50–200  6 member cards stagger in (grid 3×2)
 *   80–180  Callout 1: "Live Member Directory"
 *   190–340 Callout 2: "Membership Status Tracking"
 *   150–280 "selected" highlight pulses on Alexander Rossi card
 */

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
      <div style={{ width: 38, height: 38, borderRadius: 12, background: THEME.textPrimary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
        background: i === 1 ? THEME.textPrimary : 'transparent',
        color: i === 1 ? THEME.bgPrimary : THEME.textSecondary,
        fontSize: 9, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase',
      }}>
        <div style={{ width: 16, height: 16, borderRadius: 3, background: i === 1 ? `${THEME.bgPrimary}22` : THEME.glassBorder }} />
        {label}
      </div>
    ))}
  </div>
);

/** Status indicator color based on days left */
const statusColor = (days) => {
  if (days <= 2) return '#ef4444';   // rose
  if (days <= 6) return '#fbbf24';   // amber
  return THEME.accent;               // emerald
};

/** Single member card */
const MemberCard = ({ member, opacity, y, isHighlighted, frame }) => {
  const color = statusColor(member.daysLeft);
  const barWidth = Math.min(100, (member.daysLeft / 30) * 100);
  const planColor = PLAN_COLOR[member.plan] || THEME.accent;

  // Pulse glow on highlighted card
  const glowStrength = isHighlighted
    ? 0.04 + 0.03 * Math.sin((frame / 30) * Math.PI * 2)
    : 0;

  return (
    <div style={{
      background: THEME.glassBg,
      border: `1px solid ${isHighlighted ? 'rgba(255,255,255,0.22)' : THEME.glassBorder}`,
      borderRadius: 24,
      padding: '22px 22px',
      boxShadow: isHighlighted
        ? `0 0 40px rgba(255,255,255,${glowStrength}), 0 8px 32px rgba(0,0,0,0.37)`
        : '0 8px 32px rgba(0,0,0,0.37)',
      opacity,
      transform: `translateY(${y}px)`,
      display: 'flex',
      flexDirection: 'column',
      gap: 16,
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* Plan color accent strip at top */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0,
        height: 2,
        background: `linear-gradient(90deg, ${planColor}80, transparent)`,
        borderRadius: '24px 24px 0 0',
      }} />

      {/* Member info row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* Avatar */}
          <div style={{
            width: 52, height: 52, borderRadius: '50%',
            background: `linear-gradient(135deg, ${planColor}30, ${THEME.glassBorder})`,
            border: `1.5px solid ${planColor}50`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, fontWeight: 700, color: planColor,
            flexShrink: 0,
          }}>{member.initials}</div>

          <div>
            <div style={{ fontSize: 15, fontWeight: 600, color: THEME.textPrimary, lineHeight: 1, marginBottom: 5 }}>{member.name}</div>
            <div style={{ fontSize: 8, letterSpacing: '0.2em', textTransform: 'uppercase', color: THEME.textSecondary, fontWeight: 600 }}>{member.plan}</div>
          </div>
        </div>

        {/* Status dot */}
        <div style={{
          width: 8, height: 8, borderRadius: '50%',
          background: color,
          boxShadow: `0 0 8px ${color}`,
          flexShrink: 0,
        }} />
      </div>

      {/* Membership progress */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
          <span style={{ fontSize: 8, letterSpacing: '0.2em', textTransform: 'uppercase', color: THEME.textSecondary }}>Membership Status</span>
          <span style={{ fontSize: 8, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, color }}>
            {member.daysLeft} Days Left
          </span>
        </div>
        <div style={{ width: '100%', height: 3, background: THEME.glassBorder, borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${barWidth}%`, background: color, borderRadius: 2 }} />
        </div>
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 8, letterSpacing: '0.15em', textTransform: 'uppercase', color: THEME.textSecondary }}>View Profile</span>
        <div style={{
          padding: '5px 14px', borderRadius: 20,
          background: THEME.glassBorder,
          fontSize: 8, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase',
          color: THEME.textSecondary,
        }}>Manage</div>
      </div>
    </div>
  );
};

export const MembersScene = () => {
  const frame = useCurrentFrame() * 1.25;
  const { fps } = useVideoConfig();
  const ease = { damping: 22, stiffness: 110 };

  const bgOpacity  = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });
  const sidebarOp  = interpolate(frame, [0, 28], [0, 1], { extrapolateRight: 'clamp' });
  const sidebarX   = interpolate(spring({ frame, fps, config: ease }), [0, 1], [-80, 0]);

  const headerOp   = interpolate(frame, [10, 45], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const headerY    = interpolate(spring({ frame: frame - 10, fps, config: ease }), [0, 1], [-28, 0]);

  const pillsOp    = interpolate(frame, [35, 55], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Stagger 6 member cards — 3 per row
  const memberCard = (sf) => ({
    opacity: interpolate(frame, [sf, sf + 28], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
    y: interpolate(spring({ frame: frame - sf, fps, config: { damping: 20, stiffness: 100 } }), [0, 1], [55, 0]),
  });

  const cards = [
    memberCard(52),
    memberCard(68),
    memberCard(84),
    memberCard(100),
    memberCard(116),
    memberCard(132),
  ];

  // "Selected" highlight on card 0 (Alexander Rossi) from frame 160–300
  const isHighlighted = frame >= 160 && frame <= 300;

  // Search bar typing animation (frame 50–120)
  const searchProgress = interpolate(frame, [50, 120], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const searchText = 'Search name or phone...'.slice(0, Math.floor(searchProgress * 23));

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
      {/* Glows */}
      <div style={{ position: 'absolute', top: -300, right: -200, width: 700, height: 700, borderRadius: '50%', background: 'radial-gradient(circle, rgba(167,139,250,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -200, left: -200, width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(52,211,153,0.04) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* Sidebar */}
      <SidebarNav opacity={sidebarOp} x={sidebarX} />

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 24, minWidth: 0 }}>

        {/* Header */}
        <div style={{ opacity: headerOp, transform: `translateY(${headerY}px)` }}>
          <h1 style={{ fontSize: 44, fontWeight: 300, letterSpacing: '0.1em', textTransform: 'uppercase', color: THEME.textPrimary, margin: 0, lineHeight: 1 }}>
            Member <span style={{ fontWeight: 800 }}>Directory</span>
          </h1>
          <p style={{ fontSize: 9, color: THEME.textSecondary, letterSpacing: '0.2em', textTransform: 'uppercase', marginTop: 7 }}>
            Managing <span style={{ color: THEME.textPrimary, opacity: 0.6 }}>Luxe Wellness Collective</span>
          </p>
        </div>

        {/* Toolbar: search + filters */}
        <div style={{
          opacity: headerOp,
          transform: `translateY(${headerY}px)`,
          display: 'flex', alignItems: 'center', gap: 16,
        }}>
          <span style={{ fontSize: 8, letterSpacing: '0.25em', textTransform: 'uppercase', color: THEME.textSecondary, fontWeight: 600, whiteSpace: 'nowrap' }}>
            Live Member Stream
          </span>
          <div style={{ flex: 1, height: 1, background: THEME.glassBorder }} />

          {/* Search box */}
          <div style={{
            position: 'relative',
            background: THEME.bgPrimary,
            border: `1px solid ${THEME.glassBorder}`,
            borderRadius: 40, padding: '8px 16px 8px 32px',
            fontSize: 10, color: THEME.textSecondary,
            minWidth: 220,
          }}>
            <svg style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={THEME.textSecondary} strokeWidth="2" strokeLinecap="round">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            {searchText || 'Search name or phone...'}
          </div>

          {/* Filter pills */}
          <div style={{ display: 'flex', gap: 8, opacity: pillsOp }}>
            {['All', 'Expiring'].map((f, i) => (
              <div key={f} style={{
                padding: '7px 16px', borderRadius: 40,
                fontSize: 8, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase',
                background: i === 0 ? THEME.textPrimary : 'transparent',
                color: i === 0 ? THEME.bgPrimary : THEME.textSecondary,
                border: `1px solid ${i === 0 ? THEME.textPrimary : THEME.glassBorder}`,
              }}>{f}</div>
            ))}
          </div>
        </div>

        {/* Member card grid — 3 columns */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: 18,
          flex: 1,
        }}>
          {MEMBERS.map((member, i) => (
            <MemberCard
              key={member.id}
              member={member}
              opacity={cards[i].opacity}
              y={cards[i].y}
              isHighlighted={i === 0 && isHighlighted}
              frame={frame}
            />
          ))}
        </div>
      </div>

      {/* Feature Callouts — 2 per scene */}
      <FeatureCallout
        label="Feature"
        title="Live Member Directory"
        description="View all registered members with their plan, status, and expiry at a glance — with real-time search and filtering."
        startFrame={80}
        endFrame={185}
      />
      <FeatureCallout
        label="Feature"
        title="Membership Status Tracking"
        description="Color-coded expiry indicators instantly flag members who are expiring soon — so you never miss a renewal."
        startFrame={200}
        endFrame={355}
      />
    </div>
  );
};
