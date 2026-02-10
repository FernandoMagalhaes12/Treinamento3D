import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import Hotspot from '../Hotspot';

const GeneratorModel = () => {
  const groupRef = useRef();
  const [rotation, setRotation] = useState(0);

  useFrame((state, delta) => {
    if (groupRef.current) {
      setRotation(r => r + delta * 0.1);
    }
  });

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Base/Platform */}
      <mesh position={[0, -0.1, 0]} castShadow receiveShadow>
        <boxGeometry args={[3.5, 0.2, 2]} />
        <meshStandardMaterial color="#3a3a3a" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Main Generator Body */}
      <mesh position={[0, 0.8, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.5, 1.5, 1.5]} />
        <meshStandardMaterial color="#f97316" metalness={0.7} roughness={0.4} />
      </mesh>

      {/* Engine Block */}
      <mesh position={[-0.8, 0.8, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.8, 1.2, 1.2]} />
        <meshStandardMaterial color="#525252" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Control Panel - Interactive */}
      <group position={[1.3, 1.2, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.15, 0.6, 0.8]} />
          <meshStandardMaterial color="#1a1a1a" metalness={0.5} roughness={0.5} />
        </mesh>
        <Hotspot position={[0.1, 0, 0]} stepName="power_off" label="POWER" />
      </group>

      {/* Exhaust Pipes */}
      <mesh position={[-1.2, 1.8, 0.3]} rotation={[0, 0, Math.PI / 8]} castShadow>
        <cylinderGeometry args={[0.08, 0.08, 1.2, 16]} />
        <meshStandardMaterial color="#404040" metalness={0.9} roughness={0.3} />
      </mesh>
      <mesh position={[-1.2, 1.8, -0.3]} rotation={[0, 0, Math.PI / 8]} castShadow>
        <cylinderGeometry args={[0.08, 0.08, 1.2, 16]} />
        <meshStandardMaterial color="#404040" metalness={0.9} roughness={0.3} />
      </mesh>

      {/* Cooling Fan (animated) */}
      <mesh position={[0.8, 0.8, 0.8]} rotation={[0, rotation * 5, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 0.05, 6]} />
        <meshStandardMaterial color="#737373" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Test Point */}
      <Hotspot position={[1.3, 0.8, 0.5]} stepName="test_energy" label="TEST" />

      {/* Lock Point */}
      <Hotspot position={[1.3, 0.5, 0]} stepName="apply_lock" label="LOCK" />

      {/* Tag Point */}
      <Hotspot position={[1.3, 0.3, -0.4]} stepName="apply_tag" label="TAG" />

      {/* Access Panel */}
      <group position={[0, 0.4, 0.76]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1.5, 0.8, 0.05]} />
          <meshStandardMaterial color="#262626" metalness={0.6} roughness={0.5} />
        </mesh>
        <Hotspot position={[0, 0, 0.1]} stepName="open_panel" label="OPEN" />
      </group>

      {/* Fuel Tank */}
      <mesh position={[0.5, 0.3, -0.8]} castShadow receiveShadow>
        <cylinderGeometry args={[0.3, 0.3, 0.8, 16]} />
        <meshStandardMaterial color="#dc2626" metalness={0.7} roughness={0.4} />
      </mesh>

      {/* Warning Stripes */}
      <mesh position={[-1.25, 0.2, 0]} rotation={[0, 0, Math.PI / 4]}>
        <boxGeometry args={[0.1, 2, 0.05]} />
        <meshStandardMaterial color="#EAB308" emissive="#EAB308" emissiveIntensity={0.3} />
      </mesh>

      {/* Ground Plane */}
      <mesh position={[0, -0.21, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#18181b" metalness={0.2} roughness={0.9} />
      </mesh>
    </group>
  );
};

export default GeneratorModel;