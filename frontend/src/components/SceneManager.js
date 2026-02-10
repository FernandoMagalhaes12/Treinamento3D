import React from 'react';
import { Canvas } from '@react-three/fiber';
import GeneratorModelSimple from './models/GeneratorModelSimple';
import useSimulationStore from '../store/simulationStore';

const SceneManager = () => {
  const currentScenario = useSimulationStore(state => state.currentScenario);

  return (
    <Canvas
      camera={{ position: [4, 3, 5], fov: 45 }}
      style={{ background: '#09090b', width: '100%', height: '100%' }}
      onCreated={({ gl }) => {
        console.log('Canvas created, WebGL Renderer:', gl);
      }}
    >
      {/* Lights */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 10, 5]} intensity={1.2} />
      <pointLight position={[-3, 3, -3]} intensity={0.5} color="#EAB308" />
      
      {/* Model - always show for testing */}
      <GeneratorModelSimple />
    </Canvas>
  );
};

export default SceneManager;
