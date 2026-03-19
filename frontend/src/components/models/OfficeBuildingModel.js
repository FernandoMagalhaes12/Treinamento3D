import React, { useMemo, useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Object3D } from 'three';
import useSimulationStore from '../../store/simulationStore';

const ENABLE_DEBUG_MOVEMENT = process.env.REACT_APP_ENABLE_DEBUG_MOVEMENT === 'true';

const WALL_THIN_POSITIONS = [
  // Corridor-facing walls (x = ±2.25)
  [-2.25, 0.8, -2],
  [-2.25, 0.8, 0],
  [-2.25, 0.8, 2],
  [-2.25, 0.8, 4],
  [2.25, 0.8, -2],
  [2.25, 0.8, 0],
  [2.25, 0.8, 2],
  [2.25, 0.8, 4],
  // Outer side walls (x = ±4.5)
  [-4.5, 0.8, -2],
  [-4.5, 0.8, 0],
  [-4.5, 0.8, 2],
  [-4.5, 0.8, 4],
  [4.5, 0.8, -2],
  [4.5, 0.8, 0],
  [4.5, 0.8, 2],
  [4.5, 0.8, 4],
];

const WALL_WIDE_POSITIONS = [
  // Left side (x = -3.5)
  [-3.5, 0.8, -3],
  [-3.5, 0.8, -1],
  [-3.5, 0.8, 1],
  [-3.5, 0.8, -1],
  [-3.5, 0.8, 3],
  [-3.5, 0.8, 1],
  [-3.5, 0.8, 5],
  [-3.5, 0.8, 3],
  // Right side (x = 3.5)
  [3.5, 0.8, -3],
  [3.5, 0.8, -1],
  [3.5, 0.8, 1],
  [3.5, 0.8, -1],
  [3.5, 0.8, 3],
  [3.5, 0.8, 1],
  [3.5, 0.8, 5],
  [3.5, 0.8, 3],
];

const DOOR_FILL_POSITIONS = [
  [-2.25, 0.5, -1.5],
  [-2.25, 0.5, 0.5],
  [-2.25, 0.5, 2.5],
  [-2.25, 0.5, 4.5],
  [2.25, 0.5, -1.5],
  [2.25, 0.5, 0.5],
  [2.25, 0.5, 2.5],
  [2.25, 0.5, 4.5],
];

const OfficeBuildingStatic = React.memo(function OfficeBuildingStatic({
  wallColor,
  floorColor,
  doorColor,
  corridorColor,
}) {
  const thinWallsRef = useRef(null);
  const wideWallsRef = useRef(null);
  const doorFillRef = useRef(null);
  const dummy = useMemo(() => new Object3D(), []);

  useLayoutEffect(() => {
    if (thinWallsRef.current) {
      WALL_THIN_POSITIONS.forEach((pos, idx) => {
        dummy.position.set(pos[0], pos[1], pos[2]);
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        thinWallsRef.current.setMatrixAt(idx, dummy.matrix);
      });
      thinWallsRef.current.instanceMatrix.needsUpdate = true;
    }
    if (wideWallsRef.current) {
      WALL_WIDE_POSITIONS.forEach((pos, idx) => {
        dummy.position.set(pos[0], pos[1], pos[2]);
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        wideWallsRef.current.setMatrixAt(idx, dummy.matrix);
      });
      wideWallsRef.current.instanceMatrix.needsUpdate = true;
    }
    if (doorFillRef.current) {
      DOOR_FILL_POSITIONS.forEach((pos, idx) => {
        dummy.position.set(pos[0], pos[1], pos[2]);
        dummy.rotation.set(0, 0, 0);
        dummy.updateMatrix();
        doorFillRef.current.setMatrixAt(idx, dummy.matrix);
      });
      doorFillRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [dummy]);

  return (
    <>
      {/* Floor - Gray concrete */}
      <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[12, 8]} />
        <meshStandardMaterial color={floorColor} metalness={0.1} roughness={0.9} />
      </mesh>

      {/* Corridor Floor Marking */}
      <mesh position={[0, 0.01, 1]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[1.5, 6]} />
        <meshStandardMaterial color={corridorColor} metalness={0.1} roughness={0.9} />
      </mesh>

      {/* Opaque repeated walls/doors are instanced to reduce draw calls */}
      <instancedMesh
        ref={thinWallsRef}
        args={[null, null, WALL_THIN_POSITIONS.length]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[0.1, 1.6, 2]} />
        <meshStandardMaterial color={wallColor} metalness={0.1} roughness={0.8} />
      </instancedMesh>

      <instancedMesh
        ref={wideWallsRef}
        args={[null, null, WALL_WIDE_POSITIONS.length]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[2.5, 1.6, 0.1]} />
        <meshStandardMaterial color={wallColor} metalness={0.1} roughness={0.8} />
      </instancedMesh>

      <instancedMesh ref={doorFillRef} args={[null, null, DOOR_FILL_POSITIONS.length]}>
        <boxGeometry args={[0.1, 1, 0.8]} />
        <meshStandardMaterial color={doorColor} metalness={0.2} roughness={0.7} />
      </instancedMesh>

      {/* LEFT SIDE - 4 Rooms - Internal walls with doors to corridor */}
      {/* Ground/Grass outside - now gray */}
      <mesh position={[0, -0.06, 1]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[20, 20]} />
        <meshStandardMaterial color={floorColor} metalness={0.1} roughness={0.9} />
      </mesh>

      {/* Controls info */}
      <group position={[0, 3, 0]}>
        {/* This is just a placeholder - in real app would show UI */}
      </group>
    </>
  );
});

const OfficeBuildingWindows = React.memo(function OfficeBuildingWindows({
  positions,
}) {
  const windowsRef = useRef(null);
  const dummy = useMemo(() => new Object3D(), []);

  useLayoutEffect(() => {
    if (!windowsRef.current) return;
    if (!positions || positions.length === 0) return;

    positions.forEach((pos, idx) => {
      dummy.position.set(pos[0], pos[1], pos[2]);
      dummy.rotation.set(0, 0, 0);
      dummy.updateMatrix();
      windowsRef.current.setMatrixAt(idx, dummy.matrix);
    });

    windowsRef.current.instanceMatrix.needsUpdate = true;
  }, [positions, dummy]);

  if (!positions || positions.length === 0) return null;

  return (
    <>
      <instancedMesh ref={windowsRef} args={[null, null, positions.length]}>
        <boxGeometry args={[0.1, 0.5, 0.8]} />
        <meshStandardMaterial
          color="#93c5fd"
          metalness={0.0}
          roughness={0.12}
          transparent
          opacity={0.55}
          envMapIntensity={0.9}
          dithering
        />
      </instancedMesh>
    </>
  );
});

const OfficeBuildingLamps = React.memo(function OfficeBuildingLamps({ roomLights }) {
  return (
    <>
      {/* LÂMPADAS DAS SALAS - Uma em cada sala, controladas pelos disjuntores left */}
      <mesh position={[-3.375, 1.5, -2]}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial
          color={roomLights[0] ? '#FFEB3B' : '#333333'}
          emissive={roomLights[0] ? '#FFEB3B' : '#000000'}
          emissiveIntensity={roomLights[0] ? 1.5 : 0}
        />
      </mesh>
      <mesh position={[-3.375, 1.5, 0]}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial
          color={roomLights[1] ? '#FFEB3B' : '#333333'}
          emissive={roomLights[1] ? '#FFEB3B' : '#000000'}
          emissiveIntensity={roomLights[1] ? 1.5 : 0}
        />
      </mesh>
      <mesh position={[-3.375, 1.5, 2]}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial
          color={roomLights[2] ? '#FFEB3B' : '#333333'}
          emissive={roomLights[2] ? '#FFEB3B' : '#000000'}
          emissiveIntensity={roomLights[2] ? 1.5 : 0}
        />
      </mesh>
      <mesh position={[-3.375, 1.5, 4]}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial
          color={roomLights[3] ? '#FFEB3B' : '#333333'}
          emissive={roomLights[3] ? '#FFEB3B' : '#000000'}
          emissiveIntensity={roomLights[3] ? 1.5 : 0}
        />
      </mesh>
      <mesh position={[3.375, 1.5, -2]}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial
          color={roomLights[4] ? '#FFEB3B' : '#333333'}
          emissive={roomLights[4] ? '#FFEB3B' : '#000000'}
          emissiveIntensity={roomLights[4] ? 1.5 : 0}
        />
      </mesh>
      <mesh position={[3.375, 1.5, 0]}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial
          color={roomLights[5] ? '#FFEB3B' : '#333333'}
          emissive={roomLights[5] ? '#FFEB3B' : '#000000'}
          emissiveIntensity={roomLights[5] ? 1.5 : 0}
        />
      </mesh>
      <mesh position={[3.375, 1.5, 2]}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial
          color={roomLights[6] ? '#FFEB3B' : '#333333'}
          emissive={roomLights[6] ? '#FFEB3B' : '#000000'}
          emissiveIntensity={roomLights[6] ? 1.5 : 0}
        />
      </mesh>
      <mesh position={[3.375, 1.5, 4]}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial
          color={roomLights[7] ? '#FFEB3B' : '#333333'}
          emissive={roomLights[7] ? '#FFEB3B' : '#000000'}
          emissiveIntensity={roomLights[7] ? 1.5 : 0}
        />
      </mesh>
    </>
  );
});

const OfficeBuildingModel = () => {
  // Cores definidas pelo usuário
  const wallColor = "#007E7A";  // R0 G126 B122
  const floorColor = "#555555"; // R85 G85 B85
  const doorColor = "#FFFFFF";  // R255 G255 B255
  const corridorColor = "#555555"; // R85 G85 B85 (cinza)
  
  // Estado dos disjuntores do painel elétrico
  const storeLeftSwitches = useSimulationStore(state => state.leftSwitches);
  const isPowerOff = useSimulationStore(state => state.isPowerOff);
  
  // Com segurança: se não houver store, assume disjuntores ligado
  const leftSwitches = useMemo(() => {
    return storeLeftSwitches && Array.isArray(storeLeftSwitches)
      ? storeLeftSwitches
      : [true, true, true, true];
  }, [storeLeftSwitches]);
  
  // Mapeamento: left_0 = salas 1-4 (esquerda), left_1 = salas 5-8 (direita)
  const roomLights = useMemo(() => {
    if (isPowerOff) return [false, false, false, false, false, false, false, false];
    const leftOn = Boolean(leftSwitches[0]);
    const rightOn = Boolean(leftSwitches[1]);
    return [leftOn, leftOn, leftOn, leftOn, rightOn, rightOn, rightOn, rightOn];
  }, [isPowerOff, leftSwitches]);

  // Estado para mover as janelas (cada janela com offset independente)
  // Window 1-4: Rooms left side, Window 5-8: Rooms right side
  const [windowOffsets, setWindowOffsets] = useState({
    w1: { x: 0, y: 0, z: 0 },
    w2: { x: 0, y: 0, z: 0 },
    w3: { x: 0, y: 0, z: 0 },
    w4: { x: 0, y: 0, z: 0 },
    w5: { x: 0, y: 0, z: 0 },
    w6: { x: 0, y: 0, z: 0 },
    w7: { x: 0, y: 0, z: 0 },
    w8: { x: 0, y: 0, z: 0 },
  });
  
  // Janela selecionada para mover (1-8)
  const [selectedWindow, setSelectedWindow] = useState(1);
  const keysRef = useRef({});

  const handleKeyDown = useCallback((e) => {
    if (!ENABLE_DEBUG_MOVEMENT) return;
    const key = e.key.toLowerCase();
    keysRef.current[key] = true;
    // Selecionar janela com teclas 1-8
    if (e.key >= '1' && e.key <= '8') {
      setSelectedWindow(parseInt(e.key, 10));
    }
  }, []);

  const handleKeyUp = useCallback((e) => {
    if (!ENABLE_DEBUG_MOVEMENT) return;
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

  // Mover janela selecionada (modo de ajuste) com IJKL + U/O
  useFrame((_, delta) => {
    if (!ENABLE_DEBUG_MOVEMENT) return;
    const keys = keysRef.current;
    const hasInput = Boolean(keys.i || keys.j || keys.k || keys.l || keys.u || keys.o);
    if (!hasInput) return;

    // Mantém a mesma velocidade do timer antigo: 0.1 a cada 50ms => 2.0 unidades/segundo
    const step = 2.0 * delta;
    const windowKey = 'w' + selectedWindow;

    setWindowOffsets(prev => {
      const currentOffset = prev[windowKey] || { x: 0, y: 0, z: 0 };
      const newOffset = { ...currentOffset };
      let changed = false;

      if (keys.i) { newOffset.z -= step; changed = true; }
      if (keys.k) { newOffset.z += step; changed = true; }
      if (keys.j) { newOffset.x -= step; changed = true; }
      if (keys.l) { newOffset.x += step; changed = true; }
      if (keys.u) { newOffset.y += step; changed = true; }
      if (keys.o) { newOffset.y -= step; changed = true; }

      if (!changed) return prev;
      return { ...prev, [windowKey]: newOffset };
    });
  });

  const windowPositions = useMemo(() => {
    const getOffset = (windowNum) => {
      const windowKey = 'w' + windowNum;
      return windowOffsets[windowKey] || { x: 0, y: 0, z: 0 };
    };

    const pos = (baseX, baseY, baseZ, windowNum) => {
      const offset = getOffset(windowNum);
      return [baseX + offset.x, baseY + offset.y, baseZ + offset.z];
    };

    return [
      pos(-4.5, 0.9, -2, 1),
      pos(-4.5, 0.9, 0, 2),
      pos(-4.5, 0.9, 2, 3),
      pos(-4.5, 0.9, 4, 4),
      pos(4.5, 0.9, -2, 5),
      pos(4.5, 0.9, 0, 6),
      pos(4.5, 0.9, 2, 7),
      pos(4.5, 0.9, 4, 8),
    ];
  }, [windowOffsets]);

  return (
    <group position={[0, 0, 0]} scale={[1.3, 1.3, 1.3]}>
      {/* Instrução: Use 1-8 para selecionar janela, IJKL para mover, U/O para subir/descer */}
      <group position={[0, 2.5, 0]}>
        <mesh>
          <boxGeometry args={[0.1, 0.1, 0.1]} />
          <meshBasicMaterial visible={false} />
        </mesh>
      </group>
      
      <OfficeBuildingStatic
        wallColor={wallColor}
        floorColor={floorColor}
        doorColor={doorColor}
        corridorColor={corridorColor}
      />

      <OfficeBuildingWindows positions={windowPositions} />

      <OfficeBuildingLamps roomLights={roomLights} />
    </group>
  );
};

export default React.memo(OfficeBuildingModel);
