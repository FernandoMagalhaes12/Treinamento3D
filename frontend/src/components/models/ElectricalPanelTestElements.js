import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import useSimulationStore from '../../store/simulationStore';

const ENABLE_DEBUG_MOVEMENT = process.env.REACT_APP_ENABLE_DEBUG_MOVEMENT === 'true';

const TEST_ELEMENT_IDS = [
  'main',
  'left_0',
  'left_1',
  'left_2',
  'left_3',
  'right_0',
  'right_1',
  'right_2',
  'right_3',
];

// Componente para um único elemento de teste (texto + botão)
const TestElement = React.memo(function TestElement({ 
  id, 
  label, 
  position, 
  isSelected, 
  onSelect,
  testedBreaker,
  isPowerOff,
  onBreakerClick,
  fontSize = 0.035,
  textOffset = [-0.08, 0, 0],
  buttonOffset = [0.05, 0, 0]
}) {
  const textPosition = [position[0] + textOffset[0], position[1] + textOffset[1], position[2] + textOffset[2]];
  const buttonPosition = [position[0] + buttonOffset[0], position[1] + buttonOffset[1], position[2] + buttonOffset[2]];
  
  const buttonColor = testedBreaker === id ? '#FBBF24' : (isPowerOff ? '#EF4444' : '#22C55E');
  const buttonEmissive = testedBreaker === id ? '#FBBF24' : (isPowerOff ? '#EF4444' : '#22C55E');

  return (
    <group>
      {/* Texto TESTE */}
      <Text
        position={textPosition}
        fontSize={fontSize}
        color="#000000"
        outlineWidth={0.005}
        outlineColor="#FFFFFF"
        fontWeight="bold"
        anchorX="center"
        anchorY="middle"
        onClick={(e) => { e.stopPropagation(); onSelect(id); }}
        onPointerOver={() => document.body.style.cursor = 'pointer'}
        onPointerOut={() => document.body.style.cursor = 'default'}
      >
        {isSelected ? `► ${label}` : label}
      </Text>
      
      {/* Botão de teste */}
      <mesh 
        position={buttonPosition}
        onClick={(e) => { e.stopPropagation(); onBreakerClick(id); }}
        onPointerOver={() => document.body.style.cursor = 'crosshair'}
        onPointerOut={() => document.body.style.cursor = 'default'}
      >
        <circleGeometry args={[0.03, 16]} />
        <meshStandardMaterial 
          color={buttonColor}
          emissive={buttonEmissive}
          emissiveIntensity={0.6}
        />
      </mesh>
    </group>
  );
});

// Componente principal com todos os elementos de teste do painel elétrico
const ElectricalPanelTestElements = ({ showLabels = false }) => {
  const [selectedElement, setSelectedElement] = useState(null);
  const keysRef = useRef({});
  
  // Estados do store
  const testedBreaker = useSimulationStore(state => state.testedBreaker);
  const setTestedBreaker = useSimulationStore(state => state.setTestedBreaker);
  const isPowerOff = useSimulationStore(state => state.isPowerOff);
  
  // Posições dos elementos - 0.15 abaixo das voltagens
  const [elementPositions, setElementPositions] = useState({
    // Main switch
    main: [0.31, 0.04, 0.00],
    // Lado esquerdo (LE) - 0.15 abaixo das voltagens [-0.82, Y, 0.15]
    left_0: [-0.75, -0.70, 0.00],  // LE1 - 0.15 abaixo de 1.90
    left_1: [-0.75, -1.13, 0.00],  // LE2 - 0.15 abaixo de 1.45
    left_2: [-0.75, -1.60, 0.00],  // LE3 - 0.15 abaixo de 1.00
    left_3: [-0.75, -2.05, 0.00],  // LE4 - 0.15 abaixo de 0.55
    // Lado direito (LD) - 0.15 abaixo das voltagens [0.82, Y, 0.15]
    right_0: [0.88, -0.70, 0.15],   // LD1 - 0.15 abaixo de 1.90
    right_1: [0.88, -1.13, 0.15],   // LD2 - 0.15 abaixo de 1.45
    right_2: [0.88, -1.60, 0.15],   // LD3 - 0.15 abaixo de 1.00
    right_3: [0.88, -2.05, 0.15],   // LD4 - 0.15 abaixo de 0.55
  });

  // Controles de teclado
  const handleKeyDown = useCallback((e) => {
    const key = e.key.toLowerCase();
    keysRef.current[key] = true;
    
    // Seleção com teclas numéricas
    const num = parseInt(e.key);
    if (num >= 1 && num <= TEST_ELEMENT_IDS.length) {
      setSelectedElement(TEST_ELEMENT_IDS[num - 1]);
    }
  }, []);

  const handleKeyUp = useCallback((e) => {
    const key = e.key.toLowerCase();
    keysRef.current[key] = false;
  }, []);

  useEffect(() => {
    if (!ENABLE_DEBUG_MOVEMENT) return;
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [handleKeyDown, handleKeyUp]);

  // Mover elemento selecionado com W,A,S,D,R,F (modo debug)
  useFrame((_, delta) => {
    if (!ENABLE_DEBUG_MOVEMENT) return;
    if (!showLabels || !selectedElement) return;

    const keys = keysRef.current;
    const hasInput = Boolean(keys.w || keys.a || keys.s || keys.d || keys.r || keys.f);
    if (!hasInput) return;

    // Mantém a mesma velocidade do timer antigo: 0.02 a cada 50ms => 0.4 unidades/segundo
    const step = 0.4 * delta;

    setElementPositions(prev => {
      const currentPos = prev[selectedElement];
      if (!currentPos) return prev;

      const newPos = [...currentPos];
      let changed = false;

      if (keys.w) { newPos[2] -= step; changed = true; }
      if (keys.s) { newPos[2] += step; changed = true; }
      if (keys.a) { newPos[0] -= step; changed = true; }
      if (keys.d) { newPos[0] += step; changed = true; }
      if (keys.r) { newPos[1] += step; changed = true; }
      if (keys.f) { newPos[1] -= step; changed = true; }

      if (!changed) return prev;
      return {
        ...prev,
        [selectedElement]: newPos
      };
    });
  });

  const handleBreakerClick = useCallback((breakerId) => {
    setTestedBreaker(breakerId);
  }, [setTestedBreaker]);

  const handleSelect = useCallback((elementId) => {
    setSelectedElement(elementId);
  }, []);

  // Renderizar elementos apenas quando showLabels for true
  if (!showLabels) return null;

  return (
    <group>
      {/* Main switch - botão e texto */}
      <TestElement
        id="main"
        label="TESTE"
        position={elementPositions.main}
        isSelected={selectedElement === 'main'}
        onSelect={handleSelect}
        testedBreaker={testedBreaker}
        isPowerOff={isPowerOff}
        onBreakerClick={handleBreakerClick}
        textOffset={[-0.08, 0, 0]}
        buttonOffset={[0, 0, 0]}
      />

      {/* Lado esquerdo - interruptores 1-4 */}
      {[0, 1, 2, 3].map((i) => (
        <TestElement
          key={`left_${i}`}
          id={`left_${i}`}
          label="TESTE"
          position={elementPositions[`left_${i}`]}
          isSelected={selectedElement === `left_${i}`}
          onSelect={handleSelect}
          testedBreaker={testedBreaker}
          isPowerOff={isPowerOff}
          onBreakerClick={handleBreakerClick}
          textOffset={[-0.08, 0, 0]}
          buttonOffset={[0, 0, 0]}
        />
      ))}

      {/* Lado direito - interruptores 1-4 */}
      {[0, 1, 2, 3].map((i) => (
        <TestElement
          key={`right_${i}`}
          id={`right_${i}`}
          label="TESTE"
          position={elementPositions[`right_${i}`]}
          isSelected={selectedElement === `right_${i}`}
          onSelect={handleSelect}
          testedBreaker={testedBreaker}
          isPowerOff={isPowerOff}
          onBreakerClick={handleBreakerClick}
          textOffset={[-0.08, 0, 0]}
          buttonOffset={[0, 0, 0]}
        />
      ))}

      {/* Coordenadas do elemento selecionado */}
      {selectedElement && (
        <Text
          position={[elementPositions[selectedElement][0], elementPositions[selectedElement][1] - 0.1, elementPositions[selectedElement][2]]}
          fontSize={0.025}
          color="#FF0000"
          anchorX="center"
          anchorY="middle"
        >
          {`[${selectedElement}: ${elementPositions[selectedElement][0].toFixed(2)}, ${elementPositions[selectedElement][1].toFixed(2)}, ${elementPositions[selectedElement][2].toFixed(2)}]`}
        </Text>
      )}
    </group>
  );
};

export default React.memo(ElectricalPanelTestElements);

