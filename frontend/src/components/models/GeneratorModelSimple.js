import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';

const GeneratorModelSimple = () => {
  const fanRef = useRef();

  useFrame((state, delta) => {
    if (fanRef.current) {
      fanRef.current.rotation.y += delta * 2;
    }
  });

  return (
    <group position={[0, 0, 0]}>
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

      {/* Control Panel */}
      <mesh position={[1.3, 1.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.15, 0.6, 0.8]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.5} roughness={0.5} />
      </mesh>

      {/* Exhaust Pipes */}
      <mesh position={[-1.2, 1.8, 0.3]} rotation={[0, 0, Math.PI / 8]} castShadow>
        <cylinderGeometry args={[0.08, 0.08, 1.2, 16]} />
        <meshStandardMaterial color="#404040" metalness={0.9} roughness={0.3} />
      </mesh>

      {/* Cooling Fan (animated) */}
      <mesh ref={fanRef} position={[0.8, 0.8, 0.8]}>
        <cylinderGeometry args={[0.3, 0.3, 0.05, 6]} />
        <meshStandardMaterial color="#737373" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Ground Plane */}
      <mesh position={[0, -0.21, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color="#18181b" metalness={0.2} roughness={0.9} />
      </mesh>
    </group>
  );
};

export default GeneratorModelSimple;
