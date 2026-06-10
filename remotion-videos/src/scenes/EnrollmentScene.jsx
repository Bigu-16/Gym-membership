import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';
import { THEME } from '../theme';
import { FeatureCallout } from '../components/FeatureCallout';

/**
 * Scene 4 — New Registration / Enrollment Form  (local 0–300 = video 960–1260)
 *
 * Strategy: show the form in 3 "phases" that animate in sequentially,
 * as if someone is filling it out live.
 *
 * Timeline:
 *   0–15    fade in
 *   0–28    sidebar slides in
 *   10–45   header "New Registration" fades
 *   40–90   Training Type selector slides in (Group vs Personal cards)
 *   90–100  "Group Training" card highlights / activates
 *   90–170  Registration Details section slides up (parent info fields)
 *   140–200 Schedule section slides up (slot pills grid)
 *   195–250 Payment section slides up (fields row)
 *   250–290 Submit button pulses / glows
 *   60–190  Callout 1: "Smart Enrollment Wizard"
 *   200–295 Callout 2: "Flexible Payment & Schedule"
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
        background: i === 4 ? THEME.textPrimary : 'transparent',
        color: i === 4 ? THEME.bgPrimary : THEME.textSecondary,
        fontSize: 9, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase',
      }}>
        <div style={{ width: 16, height: 16, borderRadius: 3, background: i === 4 ? `${THEME.bgPrimary}22` : THEME.glassBorder }} />
        {label}
      </div>
    ))}
  </div>
);

/** A styled form field */
const Field = ({ label, value, placeholder }) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
    <span style={{ fontSize: 8, letterSpacing: '0.22em', textTransform: 'uppercase', color: THEME.textSecondary, fontWeight: 600 }}>{label}</span>
    <div style={{
      background: THEME.bgPrimary, border: `1px solid ${THEME.glassBorder}`,
      borderRadius: 12, padding: '10px 14px',
      fontSize: 11, color: value ? THEME.textPrimary : THEME.textSecondary,
      opacity: value ? 1 : 0.5,
    }}>
      {value || placeholder}
    </div>
  </div>
);

/** Section header with icon */
const SectionLabel = ({ icon, title }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
    <div style={{ width: 30, height: 30, borderRadius: 9, background: THEME.textPrimary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={THEME.bgPrimary} strokeWidth="2" strokeLinecap="round">{icon}</svg>
    </div>
    <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.25em', textTransform: 'uppercase', color: THEME.textPrimary }}>{title}</span>
  </div>
);

export const EnrollmentScene = () => {
  const frame = useCurrentFrame() * 1.25;
  const { fps } = useVideoConfig();
  const ease = { damping: 22, stiffness: 110 };

  const bgOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });
  const sidebarOp = interpolate(frame, [0, 28], [0, 1], { extrapolateRight: 'clamp' });
  const sidebarX  = interpolate(spring({ frame, fps, config: ease }), [0, 1], [-80, 0]);

  const headerOp  = interpolate(frame, [10, 45], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const headerY   = interpolate(spring({ frame: frame - 10, fps, config: ease }), [0, 1], [-28, 0]);

  // Section animations
  const section = (sf) => ({
    opacity: interpolate(frame, [sf, sf + 30], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
    y: interpolate(spring({ frame: frame - sf, fps, config: { damping: 20, stiffness: 90 } }), [0, 1], [50, 0]),
  });

  const trainingTypeSec = section(42);
  const registrationSec = section(95);
  const scheduleSec     = section(148);
  const paymentSec      = section(205);

  // "Group Training" card activates at frame 100
  const groupActive = frame >= 100;

  // Typing animation on name field (frame 110–180)
  const typedName = 'Alexander Rossi'.slice(0, Math.floor(
    interpolate(frame, [110, 175], [0, 15], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  ));

  // Submit button glow pulse
  const btnGlow = frame >= 250
    ? 0.15 + 0.1 * Math.sin(((frame - 250) / fps) * Math.PI * 4)
    : 0;

  // Slot pills — which one is "selected"
  const slotSelected = frame >= 165;

  const SLOTS = [
    { days: 'Mon / Wed / Fri', time: '4:00 PM – 5:00 PM', fill: 18, cap: 25 },
    { days: 'Tue / Thu',       time: '6:00 PM – 7:00 PM', fill: 22, cap: 25 },
    { days: 'Sat / Sun',       time: '10:00 AM – 11:00 AM', fill: 10, cap: 25 },
  ];

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
      <div style={{ position: 'absolute', bottom: -200, right: -200, width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(52,211,153,0.05) 0%, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: -200, left: -200, width: 600, height: 600, borderRadius: '50%', background: 'radial-gradient(circle, rgba(251,191,36,0.04) 0%, transparent 70%)', pointerEvents: 'none' }} />

      {/* Sidebar */}
      <SidebarNav opacity={sidebarOp} x={sidebarX} />

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 22, minWidth: 0, overflowY: 'hidden' }}>

        {/* Header */}
        <div style={{ opacity: headerOp, transform: `translateY(${headerY}px)` }}>
          <h1 style={{ fontSize: 44, fontWeight: 300, letterSpacing: '0.1em', textTransform: 'uppercase', color: THEME.textPrimary, margin: 0, lineHeight: 1 }}>
            New <span style={{ fontWeight: 800 }}>Registration</span>
          </h1>
          <p style={{ fontSize: 9, color: THEME.textSecondary, letterSpacing: '0.2em', textTransform: 'uppercase', marginTop: 7 }}>
            Managing <span style={{ color: THEME.textPrimary, opacity: 0.6 }}>Luxe Wellness Collective</span>
          </p>
        </div>

        {/* ── Section 1: Training Type ── */}
        <div style={{ opacity: trainingTypeSec.opacity, transform: `translateY(${trainingTypeSec.y}px)` }}>
          <SectionLabel icon={<path d="M13 10V3L4 14h7v7l9-11h-7z" />} title="Select Training Program" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* Group */}
            <div style={{
              border: `1px solid ${groupActive ? THEME.textPrimary : THEME.glassBorder}`,
              borderRadius: 20, padding: '20px 22px',
              background: groupActive ? THEME.textPrimary : THEME.glassBg,
              color: groupActive ? THEME.bgPrimary : THEME.textSecondary,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
              transform: groupActive ? 'scale(1.02)' : 'scale(1)',
              transition: 'all 0.4s',
              boxShadow: groupActive ? '0 20px 40px -10px rgba(0,0,0,0.3)' : 'none',
            }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: groupActive ? 'rgba(0,0,0,0.15)' : THEME.cardHover, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 4 }}>Group Training</div>
                <div style={{ fontSize: 9, opacity: 0.65 }}>Standard classes at the gym facility</div>
              </div>
            </div>
            {/* Personal */}
            <div style={{
              border: `1px solid ${THEME.glassBorder}`,
              borderRadius: 20, padding: '20px 22px',
              background: THEME.glassBg, color: THEME.textSecondary,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
            }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: THEME.cardHover, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 4 }}>Personal Training</div>
                <div style={{ fontSize: 9, opacity: 0.65 }}>Tailored sessions & flexible timing</div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Section 2: Registration Details ── */}
        <div style={{ opacity: registrationSec.opacity, transform: `translateY(${registrationSec.y}px)` }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(255,255,255,0.03), transparent)',
            border: `1px solid ${THEME.glassBorder}`,
            borderRadius: 24, padding: '20px 24px',
            position: 'relative',
          }}>
            {/* Family badge */}
            <div style={{
              position: 'absolute', top: -12, left: 24,
              background: THEME.textPrimary, color: THEME.bgPrimary,
              fontSize: 8, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase',
              padding: '3px 12px', borderRadius: 20,
            }}>Family #1</div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
              <Field label="Parent Full Name"   value={typedName}      placeholder="e.g. John Doe" />
              <Field label="Phone Number"       value="+971 50 123 4567" placeholder="+971..." />
              <Field label="Email Address"      value="alex@luxe.com"   placeholder="john@example.com" />
            </div>

            {/* Trainee row */}
            <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${THEME.glassBorder}` }}>
              <div style={{ fontSize: 8, letterSpacing: '0.2em', textTransform: 'uppercase', color: THEME.textSecondary, fontWeight: 700, marginBottom: 10 }}>Kids / Trainees</div>
              <GlassCard style={{ padding: '14px 18px', display: 'flex', gap: 16, alignItems: 'center' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 120px', gap: 12, flex: 1 }}>
                  <Field label="Kid's Full Name" value="Leo Rossi"  placeholder="e.g. Leo Smith" />
                  <Field label="Age"             value="9"          placeholder="Age" />
                  <Field label="Gender"          value="Male"       placeholder="Gender" />
                </div>
              </GlassCard>
            </div>
          </div>
        </div>

        {/* ── Section 3: Schedule ── */}
        <div style={{ opacity: scheduleSec.opacity, transform: `translateY(${scheduleSec.y}px)` }}>
          <GlassCard style={{ padding: '18px 22px' }}>
            <SectionLabel icon={<path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />} title="Training Schedule" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {SLOTS.map((slot, i) => {
                const isSelected = slotSelected && i === 0;
                const fillPct = (slot.fill / slot.cap) * 100;
                return (
                  <div key={i} style={{
                    border: `1px solid ${isSelected ? THEME.textPrimary : THEME.glassBorder}`,
                    background: isSelected ? THEME.textPrimary : THEME.bgPrimary,
                    borderRadius: 12, padding: '14px 14px',
                    textAlign: 'center',
                    boxShadow: isSelected ? '0 10px 24px -5px rgba(0,0,0,0.3)' : 'none',
                    transform: isSelected ? 'translateY(-2px)' : 'none',
                  }}>
                    <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', color: isSelected ? THEME.bgPrimary : THEME.textPrimary, marginBottom: 3 }}>{slot.days}</div>
                    <div style={{ fontSize: 10, fontWeight: 300, color: isSelected ? `${THEME.bgPrimary}cc` : THEME.textSecondary, marginBottom: 10 }}>{slot.time}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ flex: 1, height: 3, background: isSelected ? 'rgba(0,0,0,0.15)' : THEME.glassBorder, borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${fillPct}%`, background: isSelected ? THEME.bgPrimary : THEME.accent, borderRadius: 2 }} />
                      </div>
                      <span style={{ fontSize: 7, fontWeight: 700, color: isSelected ? `${THEME.bgPrimary}99` : THEME.textSecondary }}>{slot.fill}/{slot.cap}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </GlassCard>
        </div>

        {/* ── Section 4: Payment + Submit ── */}
        <div style={{ opacity: paymentSec.opacity, transform: `translateY(${paymentSec.y}px)`, display: 'flex', gap: 20, alignItems: 'flex-end' }}>
          <GlassCard style={{ padding: '18px 22px', flex: 1 }}>
            <SectionLabel icon={<path d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />} title="Payment Details" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
              <Field label="Duration"  value="1 Month"  placeholder="1 Month" />
              <Field label="Currency"  value="AED"      placeholder="AED" />
              <Field label="Amount"    value="AED 1,200" placeholder="0.00" />
              <Field label="Method"    value="Cash"     placeholder="Cash" />
              <Field label="Status"    value="Paid"     placeholder="Paid" />
            </div>
          </GlassCard>

          {/* Submit button */}
          <div style={{
            padding: '16px 36px', borderRadius: 20,
            background: THEME.textPrimary,
            fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase',
            color: THEME.bgPrimary, whiteSpace: 'nowrap',
            boxShadow: `0 0 ${30 + btnGlow * 200}px rgba(255,255,255,${btnGlow}), 0 20px 40px -10px rgba(0,0,0,0.4)`,
            flexShrink: 0,
          }}>
            Confirm Enrollment
          </div>
        </div>
      </div>

      {/* Feature Callouts */}
      <FeatureCallout
        label="Feature"
        title="Smart Enrollment Wizard"
        description="Register individual members or entire families — with group / personal training type selection and kid-level details."
        startFrame={60}
        endFrame={195}
      />
      <FeatureCallout
        label="Feature"
        title="Flexible Payment & Scheduling"
        description="Choose from preset class slots or custom schedules, then log payment method, duration, and status in one unified form."
        startFrame={210}
        endFrame={295}
      />
    </div>
  );
};
