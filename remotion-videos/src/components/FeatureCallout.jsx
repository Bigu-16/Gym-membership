import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';
import { THEME } from '../theme';

/**
 * Reusable bottom-left feature callout.
 * Appears as content builds, slides up + fades in.
 * Shows: feature name + short description + accent bar.
 */
export const FeatureCallout = ({ label, title, description, startFrame, endFrame }) => {
  const frame = useCurrentFrame() * 1.25;

  const fadeIn  = interpolate(frame, [startFrame, startFrame + 20], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const fadeOut = endFrame ? interpolate(frame, [endFrame - 15, endFrame], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) : 1;
  const opacity = fadeIn * fadeOut;

  const slideSpring = spring({ frame: frame - startFrame, fps: 30, config: { damping: 22, stiffness: 100 } });
  const y = interpolate(slideSpring, [0, 1], [30, 0]);

  if (opacity <= 0) return null;

  return (
    <div style={{
      position: 'absolute',
      bottom: 56,
      left: 60,
      opacity,
      transform: `translateY(${y}px)`,
      zIndex: 100,
      display: 'flex',
      alignItems: 'flex-start',
      gap: 16,
      maxWidth: 460,
    }}>
      {/* Accent bar */}
      <div style={{
        width: 3,
        height: 'auto',
        alignSelf: 'stretch',
        background: `linear-gradient(180deg, ${THEME.accent}, transparent)`,
        borderRadius: 2,
        flexShrink: 0,
        minHeight: 56,
      }} />

      <div>
        {/* Label chip */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          padding: '3px 10px',
          borderRadius: 20,
          background: `${THEME.accent}18`,
          border: `1px solid ${THEME.accent}30`,
          marginBottom: 8,
        }}>
          <div style={{
            width: 5, height: 5, borderRadius: '50%',
            background: THEME.accent,
          }} />
          <span style={{
            fontSize: 8, fontWeight: 700,
            letterSpacing: '0.3em', textTransform: 'uppercase',
            color: THEME.accent,
            fontFamily: THEME.font,
          }}>{label}</span>
        </div>

        {/* Feature title */}
        <div style={{
          fontSize: 30,
          fontWeight: 700,
          color: THEME.textPrimary,
          letterSpacing: '0.04em',
          lineHeight: 1.1,
          fontFamily: THEME.font,
          marginBottom: 10,
        }}>{title}</div>

        {/* Description */}
        <div style={{
          fontSize: 20,
          color: '#f1f5f9',
          letterSpacing: '0.01em',
          lineHeight: 1.6,
          fontFamily: THEME.font,
          maxWidth: 480,
          fontWeight: 500,
          textShadow: '0 2px 12px rgba(0,0,0,0.6)',
        }}>{description}</div>
      </div>
    </div>
  );
};
