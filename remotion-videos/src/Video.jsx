import React from 'react';
import { AbsoluteFill, Sequence, Audio, staticFile } from 'remotion';
import { IntroScene } from './scenes/IntroScene';
import { DashboardScene } from './scenes/DashboardScene';
import { MembersScene } from './scenes/MembersScene';
import { EnrollmentScene } from './scenes/EnrollmentScene';
import { ScheduleScene } from './scenes/ScheduleScene';
import { AnalyticsScene } from './scenes/AnalyticsScene';
import { OutroScene } from './scenes/OutroScene';
import { LightModeWrapper } from './components/LightModeWrapper';
import { THEME } from './theme';

/**
 * Main 60-second video — scenes are added one by one after review.
 *
 *  ✅ Scene 1 — Intro        :    0 –  240  ( 0s –  8s)
 *  ✅ Scene 2 — Dashboard    :  240 –  600  ( 8s – 20s)
 *  ✅ Scene 3 — Members      :  600 –  960  (20s – 32s)
 *  ✅ Scene 4 — Enrollment   :  960 – 1260  (32s – 42s)
 *  ✅ Scene 5 — Schedule     : 1260 – 1560  (42s – 52s)
 *  ✅ Scene 6 — Analytics    : 1560 – 1710  (52s – 57s)
 *  ✅ Scene 7 — Outro        : 1710 – 1800  (57s – 60s)
 */
export const GymPromoVideo = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: THEME.bgPrimary }}>
      {/* Background Music */}
      <Audio src={staticFile('bg-music.mp3')} volume={0.5} />

      {/* Scene 1 — Intro (0–192) */}
      <Sequence from={0} durationInFrames={192}>
        <IntroScene />
      </Sequence>

      {/* Scene 2 — Dashboard (192–480) */}
      <Sequence from={192} durationInFrames={288}>
        <LightModeWrapper durationInFrames={288}>
          <DashboardScene />
        </LightModeWrapper>
      </Sequence>

      {/* Scene 3 — Members (480–768) */}
      <Sequence from={480} durationInFrames={288}>
        <LightModeWrapper durationInFrames={288}>
          <MembersScene />
        </LightModeWrapper>
      </Sequence>

      {/* Scene 4 — Enrollment (768–1008) */}
      <Sequence from={768} durationInFrames={240}>
        <LightModeWrapper durationInFrames={240}>
          <EnrollmentScene />
        </LightModeWrapper>
      </Sequence>

      {/* Scene 5 — Schedule (1008–1248) */}
      <Sequence from={1008} durationInFrames={240}>
        <LightModeWrapper durationInFrames={240}>
          <ScheduleScene />
        </LightModeWrapper>
      </Sequence>

      {/* Scene 6 — Analytics (1248–1368) */}
      <Sequence from={1248} durationInFrames={120}>
        <LightModeWrapper durationInFrames={120}>
          <AnalyticsScene />
        </LightModeWrapper>
      </Sequence>

      {/* Scene 7 — Outro (1368–1488) */}
      <Sequence from={1368} durationInFrames={120}>
        <LightModeWrapper durationInFrames={120}>
          <OutroScene />
        </LightModeWrapper>
      </Sequence>
    </AbsoluteFill>
  );
};
