import "./index.css";
import { Composition } from "remotion";
import { GymPromoVideo } from "./Video";

/**
 * Scene map — 60s total @ 30fps = 1800 frames
 *
 *  Scene 1 — Intro        :    0 –  240  ( 0s –  8s)  ✅ done
 *  Scene 2 — Dashboard    :  240 –  600  ( 8s – 20s)  🔜 next
 *  Scene 3 — Members      :  600 –  960  (20s – 32s)
 *  Scene 4 — Enrollment   :  960 – 1260  (32s – 42s)
 *  Scene 5 — Schedule     : 1260 – 1560  (42s – 52s)
 *  Scene 6 — Analytics    : 1560 – 1710  (52s – 57s)
 *  Scene 7 — Outro        : 1710 – 1800  (57s – 60s)
 */
export const RemotionRoot = () => {
  return (
    <Composition
      id="GymPromo"
      component={GymPromoVideo}
      durationInFrames={1488}
      fps={30}
      width={1920}
      height={1080}
    />
  );
};
