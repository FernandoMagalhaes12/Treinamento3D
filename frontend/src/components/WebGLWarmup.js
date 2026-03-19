import React from 'react';
import { Canvas } from '@react-three/fiber';

const WebGLWarmup = ({ onReady }) => {
  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        width: 1,
        height: 1,
        opacity: 0,
        pointerEvents: 'none',
        overflow: 'hidden',
        zIndex: -1,
      }}
    >
      <Canvas
        dpr={1}
        gl={{ antialias: false, alpha: false, powerPreference: 'high-performance' }}
        camera={{ position: [0, 0, 3], fov: 50 }}
        onCreated={() => {
          // Delay one frame so the renderer has time to initialize.
          requestAnimationFrame(() => {
            if (onReady) onReady();
          });
        }}
      >
        <ambientLight intensity={0.5} />
        <mesh>
          <boxGeometry args={[0.1, 0.1, 0.1]} />
          <meshBasicMaterial color="#111111" />
        </mesh>
      </Canvas>
    </div>
  );
};

export default WebGLWarmup;
