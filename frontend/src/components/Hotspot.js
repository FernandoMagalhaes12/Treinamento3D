import React, { useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import useSimulationStore from '../store/simulationStore';
import audioManager from '../utils/audioManager';

const Hotspot = ({ position, stepName, label, onClick, disabled = false }) => {
  const meshRef = useRef();
  const [hovered, setHovered] = useState(false);
  const { selectedTool, performStep, simulationActive } = useSimulationStore(
    useShallow((state) => ({
      selectedTool: state.selectedTool,
      performStep: state.performStep,
      simulationActive: state.simulationActive,
    }))
  );

  const handleClick = () => {
    if (!simulationActive || disabled) return;
    
    // If custom onClick is provided, use it
    if (onClick) {
      audioManager.playClick();
      onClick();
      return;
    }
    
    // Otherwise use the tool-based logic
    if (selectedTool === stepName) {
      audioManager.playClick();
      performStep(stepName);
    }
  };

  const handlePointerOver = () => {
    if (!simulationActive || disabled) return;
    setHovered(true);
    audioManager.playHover();
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = () => {
    setHovered(false);
    document.body.style.cursor = 'default';
  };

  // Determine color based on state
  const isActive = onClick ? !disabled : (selectedTool === stepName);
  const baseColor = disabled ? '#6B7280' : (isActive ? '#22C55E' : '#EAB308');
  const emissiveColor = disabled ? '#6B7280' : (isActive ? '#22C55E' : '#EAB308');

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
          color={baseColor}
          emissive={emissiveColor}
          emissiveIntensity={hovered && !disabled ? 1.5 : 0.8}
          transparent
          opacity={disabled ? 0.4 : 0.9}
        />
      </mesh>
      
      {/* Pulsing ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.15, 0.18, 32]} />
        <meshBasicMaterial
          color={disabled ? '#6B7280' : '#EAB308'}
          transparent
          opacity={hovered && !disabled ? 0.8 : 0.4}
        />
      </mesh>
    </group>
  );
};

export default React.memo(Hotspot);