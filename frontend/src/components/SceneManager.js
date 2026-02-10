import React from 'react';
import { Canvas } from '@react-three/fiber';
import GeneratorModel from './models/GeneratorModel';
import CompressorModel from './models/CompressorModel';
import ConveyorModel from './models/ConveyorModel';
import useSimulationStore from '../store/simulationStore';

const SceneManager = () => {
  const currentScenario = useSimulationStore(state => state.currentScenario);

  const renderModel = () => {
    if (!currentScenario) return null;
    
    switch (currentScenario.id) {
      case 'gen-diesel':
        return <GeneratorModel />;
      case 'compressor':
        return <CompressorModel />;
      case 'conveyor':
        return <ConveyorModel />;
      default:
        return <GeneratorModel />;
    }
  };

  return (
    <Canvas
      camera={{ position: [4, 3, 5], fov: 45 }}
      style={{ background: '#09090b' }}
    >
      {/* Lights */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 10, 5]} intensity={1.2} castShadow />
      <pointLight position={[-5, 5, -5]} intensity={0.5} color="#EAB308" />
      <hemisphereLight args={['#ffffff', '#444444', 0.6]} />
      
      {/* Model */}
      {renderModel()}
    </Canvas>
  );
};

export default SceneManager;