import { Suspense, lazy, useEffect, useState } from 'react';
import { appKindFromServer, rememberedAppKind } from './appKind';

// Each tenant (gym) has its own app. They share nothing but this loader and the sign-in API:
// the server says which tenant the signed-in account belongs to, and only that app is loaded.
const GymRoot = lazy(() => import('./GymRoot.jsx'));
const TkdRoot = lazy(() => import('./tkd/TkdRoot.jsx'));

function Loading() {
  return <div role="status" style={{ padding: '3rem', textAlign: 'center', fontFamily: 'system-ui, sans-serif' }}>Loading…</div>;
}

export default function Root() {
  const [kind, setKind] = useState(null);
  useEffect(() => {
    let alive = true;
    appKindFromServer().then((fromServer) => {
      // Not signed in yet: show the login screen of the app last used on this computer.
      if (alive) setKind(fromServer || rememberedAppKind());
    });
    return () => { alive = false; };
  }, []);
  if (!kind) return <Loading />;
  return (
    <Suspense fallback={<Loading />}>
      {kind === 'taekwondo' ? <TkdRoot /> : <GymRoot />}
    </Suspense>
  );
}
