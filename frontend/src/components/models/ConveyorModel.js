import React, { useLayoutEffect, useMemo, useRef } from 'react';
import { Object3D } from 'three';
import Hotspot from '../Hotspot';

const LEG_POSITIONS = [
  [-1.5, 0, 0.4],
  [-1.5, 0, -0.4],
  [1.5, 0, 0.4],
  [1.5, 0, -0.4],
];

const ROLLER_POSITIONS = [
  [-1.8, 0.35, 0],
  [1.8, 0.35, 0],
];

const STRIPE_POSITIONS = [
  [0, 0.36, 0.5],
  [0, 0.36, -0.5],
];

const ConveyorModel = () => {
  const legsRef = useRef(null);
  const rollersRef = useRef(null);
  const stripesRef = useRef(null);
  const dummy = useMemo(() => new Object3D(), []);

  useLayoutEffect(() => {
    if (legsRef.current) {
      LEG_POSITIONS.forEach((pos, idx) => {
        dummy.position.set(pos[0], pos[1], pos[2]);
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        legsRef.current.setMatrixAt(idx, dummy.matrix);
      });
      legsRef.current.instanceMatrix.needsUpdate = true;
    }

    if (rollersRef.current) {
      ROLLER_POSITIONS.forEach((pos, idx) => {
        dummy.position.set(pos[0], pos[1], pos[2]);
        dummy.rotation.set(Math.PI / 2, 0, 0);
        dummy.updateMatrix();
        rollersRef.current.setMatrixAt(idx, dummy.matrix);
      });
      rollersRef.current.instanceMatrix.needsUpdate = true;
    }

    if (stripesRef.current) {
      STRIPE_POSITIONS.forEach((pos, idx) => {
        dummy.position.set(pos[0], pos[1], pos[2]);
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        stripesRef.current.setMatrixAt(idx, dummy.matrix);
      });
      stripesRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [dummy]);

  return (
    <group position={[0, 0, 0]}>
      {/* Base Frame */}
      <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
        <boxGeometry args={[4, 0.1, 1]} />
        <meshPhysicalMaterial
          color="#525252"
          metalness={0.15}
          roughness={0.78}
          clearcoat={0.08}
          clearcoatRoughness={0.85}
          envMapIntensity={0.55}
          dithering
        />
      </mesh>

      {/* Support Legs */}
      <instancedMesh ref={legsRef} args={[null, null, LEG_POSITIONS.length]}>
        <boxGeometry args={[0.1, 0.6, 0.1]} />
        <meshStandardMaterial color="#3a3a3a" />
      </instancedMesh>

      {/* Conveyor Belt */}
      <mesh position={[0, 0.36, 0]}>
        <boxGeometry args={[3.8, 0.02, 0.8]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.3} roughness={0.9} />
      </mesh>

      {/* Rollers */}
      <instancedMesh ref={rollersRef} args={[null, null, ROLLER_POSITIONS.length]}>
        <cylinderGeometry args={[0.15, 0.15, 1, 16]} />
        <meshStandardMaterial color="#737373" metalness={1.0} roughness={0.45} envMapIntensity={0.8} dithering />
      </instancedMesh>

      {/* Motor Unit */}
      <mesh position={[-2, 0.6, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.4, 0.4, 0.6]} />
        <meshPhysicalMaterial
          color="#3b82f6"
          metalness={0.08}
          roughness={0.62}
          clearcoat={0.32}
          clearcoatRoughness={0.55}
          envMapIntensity={0.8}
          dithering
        />
      </mesh>

      {/* Control Box */}
      <group position={[2, 0.8, 0]}>
        <mesh receiveShadow>
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
        <mesh receiveShadow>
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
          <meshPhysicalMaterial
            color="#fbbf24"
            metalness={0.06}
            roughness={0.68}
            clearcoat={0.28}
            clearcoatRoughness={0.6}
            envMapIntensity={0.75}
            dithering
          />
        </mesh>
        <Hotspot position={[0, 0, 0.4]} stepName="open_panel" label="OPEN" />
      </group>

      {/* Warning Stripes on sides */}
      <instancedMesh ref={stripesRef} args={[null, null, STRIPE_POSITIONS.length]}>
        <boxGeometry args={[3.8, 0.03, 0.1]} />
        <meshStandardMaterial color="#EAB308" emissive="#EAB308" emissiveIntensity={0.2} />
      </instancedMesh>

      {/* Ground */}
      <mesh position={[0, -0.31, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
    </group>
  );
};

export default React.memo(ConveyorModel);