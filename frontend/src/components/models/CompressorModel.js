import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import Hotspot from '../Hotspot';

const CompressorModel = () => {
  const gaugeRef = useRef();

  useFrame((state, delta) => {
    if (gaugeRef.current) {
      gaugeRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 2) * 0.3;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Base */}
      <mesh position={[0, -0.1, 0]} castShadow receiveShadow>
        <boxGeometry args={[3, 0.2, 2]} />
        <meshStandardMaterial color="#3a3a3a" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Main Compressor Tank */}
      <mesh position={[0, 0.8, 0]} rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
        <cylinderGeometry args={[0.6, 0.6, 2.5, 32]} />
        <meshStandardMaterial color="#3b82f6" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Motor */}
      <mesh position={[-1.5, 0.5, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.35, 0.35, 0.8, 16]} />
        <meshStandardMaterial color="#525252" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Control Panel */}
      <group position={[1.4, 1, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.1, 0.5, 0.6]} />
          <meshStandardMaterial color="#1a1a1a" />
        </mesh>
        <Hotspot position={[0.1, 0, 0]} stepName="power_off" label="POWER" />
      </group>

      {/* Pressure Gauge */}
      <group position={[0.8, 1.2, 0.65]} ref={gaugeRef}>
        <mesh>
          <cylinderGeometry args={[0.15, 0.15, 0.05, 32]} />
          <meshStandardMaterial color="#f3f4f6" metalness={0.5} roughness={0.5} />
        </mesh>
        <mesh position={[0, 0, 0.04]}>
          <cylinderGeometry args={[0.02, 0.02, 0.1, 8]} />
          <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.5} />
        </mesh>
      </group>

      {/* Pressure Release Valve */}
      <group position={[0, 1.2, 0]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.1, 0.1, 0.3, 16]} />
          <meshStandardMaterial color="#dc2626" metalness={0.7} roughness={0.4} />
        </mesh>
        <Hotspot position={[0, 0.2, 0]} stepName="release_pressure" label="VALVE" />
      </group>

      {/* Air Hose */}
      <mesh position={[1.2, 0.8, 0.6]} rotation={[Math.PI / 4, 0, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 1, 16]} />
        <meshStandardMaterial color="#fbbf24" metalness={0.3} roughness={0.7} />
      </mesh>

      {/* Test Point */}
      <Hotspot position={[1.4, 0.7, 0.3]} stepName="test_energy" label="TEST" />

      {/* Lock Point */}
      <Hotspot position={[1.4, 0.4, 0]} stepName="apply_lock" label="LOCK" />

      {/* Tag Point */}
      <Hotspot position={[1.4, 0.2, -0.3]} stepName="apply_tag" label="TAG" />

      {/* Access Panel */}
      <group position={[0, 0.8, 0.65]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1.5, 0.6, 0.05]} />
          <meshStandardMaterial color="#262626" />
        </mesh>
        <Hotspot position={[0, 0, 0.1]} stepName="open_panel" label="OPEN" />
      </group>

      {/* Ground */}
      <mesh position={[0, -0.21, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#18181b" />
      </mesh>
    </group>
  );
};

export default CompressorModel;