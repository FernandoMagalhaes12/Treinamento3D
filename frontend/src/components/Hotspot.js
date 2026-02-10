import React, { useRef, useState } from 'react';
import useSimulationStore from '../store/simulationStore';
import audioManager from '../utils/audioManager';

const Hotspot = ({ position, stepName, label }) => {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);
  const selectedTool = useSimulationStore(state => state.selectedTool);
  const performStep = useSimulationStore(state => state.performStep);
  const simulationActive = useSimulationStore(state => state.simulationActive);

  const handleClick = () => {
    if (!simulationActive) return;
    
    if (selectedTool === stepName) {
      audioManager.playClick();
      performStep(stepName);
    }
  };

  const handlePointerOver = () => {
    if (!simulationActive) return;
    setHovered(true);
    audioManager.playHover();
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = () => {
    setHovered(false);
    document.body.style.cursor = 'default';
  };

  return (
    <group position={position}>
      <mesh
        ref={meshRef}
        onClick={handleClick}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
      >
        <sphereGeometry args={[0.12, 16, 16]} />
        <meshStandardMaterial
          color={selectedTool === stepName ? "#22C55E" : "#EAB308"}
          emissive={selectedTool === stepName ? "#22C55E" : "#EAB308"}
          emissiveIntensity={hovered ? 1.5 : 0.8}
          transparent
          opacity={0.9}
        />
      </mesh>
      
      {hovered && (
        <Html center distanceFactor={5}>
          <div className="bg-black/80 backdrop-blur-sm text-white px-3 py-1 rounded-md text-xs font-mono uppercase tracking-wider border border-yellow-500/50">
            {label}
          </div>
        </Html>
      )}
      
      {/* Pulsing ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.15, 0.18, 32]} />
        <meshBasicMaterial
          color="#EAB308"
          transparent
          opacity={hovered ? 0.8 : 0.4}
        />
      </mesh>
    </group>
  );
};

export default Hotspot;