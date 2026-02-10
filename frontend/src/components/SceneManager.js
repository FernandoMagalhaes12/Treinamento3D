import React, { useRef, useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import TestModel from './models/TestModel';
import GeneratorModel from './models/GeneratorModel';
import CompressorModel from './models/CompressorModel';
import ConveyorModel from './models/ConveyorModel';
import Lighting from './Lighting';
import useSimulationStore from '../store/simulationStore';

const SceneManager = () => {
  const currentScenario = useSimulationStore(state => state.currentScenario);
  const [cameraPosition] = useState([4, 3, 5]);

  const renderModel = () => {
    if (!currentScenario) return <TestModel />;
    
    switch (currentScenario.id) {
      case 'gen-diesel':
        return <GeneratorModel />;
      case 'compressor':
        return <CompressorModel />;
      case 'conveyor':
        return <ConveyorModel />;
      default:
        return <TestModel />;
    }
  };

  return (
    <Canvas
      shadows
      gl={{ antialias: true, alpha: false }}
      style={{ background: '#09090b' }}
      onCreated={() => console.log('Canvas created successfully')}
    >
      <PerspectiveCamera makeDefault position={cameraPosition} fov={45} />
      <OrbitControls
        enablePan={true}
        enableZoom={true}
        enableRotate={true}
        minDistance={3}
        maxDistance={15}
        maxPolarAngle={Math.PI / 2}
        minPolarAngle={Math.PI / 6}
      />
      <Lighting />
      {renderModel()}
    </Canvas>
  );
};

export default SceneManager;