import React from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import useSimulationStore from '../store/simulationStore';

function Box() {
  const meshRef = React.useRef();
  
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.01;
    }
  });
  
  return (
    <mesh ref={meshRef} position={[0, 1, 0]}>
      <boxGeometry args={[2, 2, 2]} />
      <meshStandardMaterial color="#f97316" />
    </mesh>
  );
}

function Ground() {
  return (
    <mesh position={[0, -0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[10, 10]} />
      <meshStandardMaterial color="#18181b" />
    </mesh>
  );
}

const SceneManagerSimple = () => {
  return (
    <Canvas
      camera={{ position: [4, 3, 5], fov: 45 }}
      style={{ background: '#09090b' }}
    >
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 10, 5]} intensity={1} />
      <Box />
      <Ground />
    </Canvas>
  );
};

export default SceneManagerSimple;
