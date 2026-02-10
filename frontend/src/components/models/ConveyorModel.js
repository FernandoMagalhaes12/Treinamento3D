import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import Hotspot from '../Hotspot';

const ConveyorModel = () => {
  const beltRef = useRef();
  const [beltOffset, setBeltOffset] = useState(0);

  useFrame((state, delta) => {
    setBeltOffset(offset => (offset + delta * 0.3) % 1);
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Base Frame */}
      <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
        <boxGeometry args={[4, 0.1, 1]} />
        <meshStandardMaterial color="#525252" metalness={0.8} roughness={0.3} />
      </mesh>

      {/* Support Legs */}
      <mesh position={[-1.5, 0, 0.4]} castShadow>
        <boxGeometry args={[0.1, 0.6, 0.1]} />
        <meshStandardMaterial color="#3a3a3a" />
      </mesh>
      <mesh position={[-1.5, 0, -0.4]} castShadow>
        <boxGeometry args={[0.1, 0.6, 0.1]} />
        <meshStandardMaterial color="#3a3a3a" />
      </mesh>
      <mesh position={[1.5, 0, 0.4]} castShadow>
        <boxGeometry args={[0.1, 0.6, 0.1]} />
        <meshStandardMaterial color="#3a3a3a" />
      </mesh>
      <mesh position={[1.5, 0, -0.4]} castShadow>
        <boxGeometry args={[0.1, 0.6, 0.1]} />
        <meshStandardMaterial color="#3a3a3a" />
      </mesh>

      {/* Conveyor Belt */}
      <mesh position={[0, 0.36, 0]} ref={beltRef}>
        <boxGeometry args={[3.8, 0.02, 0.8]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.3} roughness={0.9} />
      </mesh>

      {/* Rollers */}
      <mesh position={[-1.8, 0.35, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.15, 1, 16]} />
        <meshStandardMaterial color="#737373" metalness={0.9} roughness={0.2} />
      </mesh>
      <mesh position={[1.8, 0.35, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
        <cylinderGeometry args={[0.15, 0.15, 1, 16]} />
        <meshStandardMaterial color="#737373" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Motor Unit */}
      <mesh position={[-2, 0.6, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.4, 0.4, 0.6]} />
        <meshStandardMaterial color="#3b82f6" metalness={0.7} roughness={0.4} />
      </mesh>

      {/* Control Box */}
      <group position={[2, 0.8, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.3, 0.4, 0.4]} />
          <meshStandardMaterial color="#1a1a1a" />
        </mesh>
        {/* Stop Button */}
        <mesh position={[0.16, 0.1, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 0.05, 16]} />
          <meshStandardMaterial color="#dc2626" emissive="#dc2626" emissiveIntensity={0.3} />
        </mesh>
        <Hotspot position={[0.2, 0.1, 0]} stepName="stop_belt" label="STOP" />
      </group>

      {/* Power Panel */}
      <group position={[2, 0.5, -0.6]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.25, 0.35, 0.1]} />
          <meshStandardMaterial color="#262626" />
        </mesh>
        <Hotspot position={[0, 0, 0.1]} stepName="power_off" label="POWER" />
      </group>

      {/* Test Point */}
      <Hotspot position={[2, 0.3, -0.4]} stepName="test_energy" label="TEST" />

      {/* Lock Point */}
      <Hotspot position={[2, 0.3, 0]} stepName="apply_lock" label="LOCK" />

      {/* Tag Point */}
      <Hotspot position={[2, 0.15, 0.3]} stepName="apply_tag" label="TAG" />

      {/* Access Cover */}
      <group position={[-1.8, 0.7, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.5, 0.3, 0.7]} />
          <meshStandardMaterial color="#fbbf24" metalness={0.6} roughness={0.4} />
        </mesh>
        <Hotspot position={[0, 0, 0.4]} stepName="open_panel" label="OPEN" />
      </group>

      {/* Warning Stripes on sides */}
      <mesh position={[0, 0.36, 0.5]}>
        <boxGeometry args={[3.8, 0.03, 0.1]} />
        <meshStandardMaterial color="#EAB308" emissive="#EAB308" emissiveIntensity={0.2} />
      </mesh>
      <mesh position={[0, 0.36, -0.5]}>
        <boxGeometry args={[3.8, 0.03, 0.1]} />
        <meshStandardMaterial color="#EAB308" emissive="#EAB308" emissiveIntensity={0.2} />
      </mesh>

      {/* Ground */}
      <mesh position={[0, -0.31, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#18181b" />
      </mesh>
    </group>
  );
};

export default ConveyorModel;