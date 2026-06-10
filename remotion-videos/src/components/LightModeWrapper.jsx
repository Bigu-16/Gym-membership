import React from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';

export const LightModeWrapper = ({ children, durationInFrames }) => {
  const frame = useCurrentFrame() * 1.25;
  const { fps } = useVideoConfig();
  
  // Calculate duration in scaled frames (since we multiplied by 1.25)
  const durationScaled = durationInFrames * 1.25;
  
  // Start transition 50 scaled frames before the end (gives ~1.5s in full light mode)
  const tStart = durationScaled - 50;
  
  const lightMode = interpolate(frame, [tStart, tStart + 15], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  
  // Dropdown animation for toggle appears 10 frames before transition
  const toggleY = interpolate(spring({ frame: frame - (tStart - 10), fps, config: { damping: 20, stiffness: 90 } }), [0, 1], [-20, 0]);
  const toggleOp = interpolate(frame, [tStart - 10, tStart - 2], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  
  // Switch flips precisely when transition starts
  const toggleSwitch = interpolate(spring({ frame: frame - tStart, fps, config: { damping: 18, stiffness: 120 } }), [0, 1], [3, 23]);

  // CSS Filter Magic: invert(1) + hue-rotate(180deg) perfectly converts a dark theme to a light theme
  // while preserving brand colors (like emerald green) since hue + 180 + invert roughly restores the original hue.
  const filter = lightMode > 0 ? `invert(${lightMode}) hue-rotate(${lightMode * 180}deg) brightness(${1 + lightMode * 0.05})` : 'none';

  return (
    <AbsoluteFill style={{ filter, backgroundColor: '#0a0a0a' }}>
      {children}
      
      {/* Light Mode Toggle Widget */}
      {toggleOp > 0 && (
        <div style={{
          position: 'absolute', top: 60, right: 60,
          opacity: toggleOp, transform: `translateY(${toggleY}px)`,
          display: 'flex', alignItems: 'center', gap: 10,
          zIndex: 9999,
        }}>
          <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#94a3b8' }}>Light Mode</span>
          <div style={{ width: 42, height: 22, borderRadius: 12, background: 'rgba(255,255,255,0.08)', position: 'relative', border: '1px solid rgba(255,255,255,0.15)' }}>
            <div style={{
              position: 'absolute', top: 2, left: toggleSwitch,
              width: 16, height: 16, borderRadius: '50%',
              background: '#ffffff', boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
            }} />
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};
