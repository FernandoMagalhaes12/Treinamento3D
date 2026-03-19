import React from 'react';

const Lighting = ({ scenarioId, isPowerOff = false, isLowPower = false } = {}) => {
  const isGenerator = scenarioId === 'gen-diesel';
  const shadowMapSize = isLowPower ? 512 : (isGenerator ? 2048 : 1024);
  const ambientBase = isGenerator ? 0.14 : 0.4;
  const hemiIntensity = isGenerator ? 0.18 : 0.6;
  const sunIntensity = isGenerator ? 1.05 : 1.2;
  const warmFillIntensity = isGenerator ? 0.22 : 0.5;

  // Tighter shadow frustum on the generator scenario = higher effective shadow resolution.
  const shadowFrustum = isGenerator
    ? { near: 0.4, far: 35, left: -9, right: 9, top: 9, bottom: -9 }
    : { near: 0.5, far: 80, left: -25, right: 25, top: 25, bottom: -25 };

  return (
    <>
      <ambientLight intensity={isPowerOff ? Math.min(0.22, ambientBase) : ambientBase} />
      <directionalLight
        position={isGenerator ? [7, 11, 4] : [5, 10, 5]}
        intensity={isPowerOff ? Math.min(0.9, sunIntensity) : sunIntensity}
        color={isGenerator ? '#fff1db' : '#ffffff'}
        castShadow
        shadow-mapSize-width={shadowMapSize}
        shadow-mapSize-height={shadowMapSize}
        shadow-camera-near={shadowFrustum.near}
        shadow-camera-far={shadowFrustum.far}
        shadow-camera-left={shadowFrustum.left}
        shadow-camera-right={shadowFrustum.right}
        shadow-camera-top={shadowFrustum.top}
        shadow-camera-bottom={shadowFrustum.bottom}
        shadow-bias={isGenerator ? -0.00006 : -0.00008}
        shadow-normalBias={isGenerator ? 0.015 : 0.02}
        shadow-radius={isLowPower ? 1.5 : (isGenerator ? 2.25 : 2.75)}
      />
      <pointLight
        position={isGenerator ? [-6, 4.5, -5] : [-5, 5, -5]}
        intensity={isPowerOff ? 0.18 : warmFillIntensity}
        color={isGenerator ? '#ffd38a' : '#EAB308'}
      />
      {isGenerator && (
        <>
          {/* Cool rim light to add definition on edges (kept subtle for performance) */}
          <pointLight
            position={[4.5, 2.2, -4.5]}
            intensity={isLowPower ? 0.25 : (isPowerOff ? 0.25 : 0.45)}
            color="#bfe7ff"
          />
          {/* Slight fill from front to make panel details readable */}
          <pointLight
            position={[0, 1.8, 5]}
            intensity={isLowPower ? 0.18 : (isPowerOff ? 0.18 : 0.3)}
            color="#ffffff"
          />
          {/* Low bounce to help grounding on grass without washing the scene */}
          <pointLight
            position={[0, 0.25, 0]}
            intensity={isLowPower ? 0.05 : (isPowerOff ? 0.05 : 0.08)}
            color="#c7f9cc"
          />
        </>
      )}
      <hemisphereLight args={['#c7d2fe', '#0f172a', hemiIntensity]} />
    </>
  );
};

export default React.memo(Lighting);