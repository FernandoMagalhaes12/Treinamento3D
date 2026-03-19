import React, { useCallback, useMemo } from 'react';
import { Text } from '@react-three/drei';
import Hotspot from '../Hotspot';
import useSimulationStore from '../../store/simulationStore';
import ElectricalPanelTestElements from './ElectricalPanelTestElements';

const PanelShell = React.memo(function PanelShell() {
  return (
    <>
      {/* Main Panel Frame - Light Gray */}
      <mesh position={[0, 1.5, 0]} castShadow receiveShadow>
        <boxGeometry args={[2, 3.2, 0.1]} />
        <meshPhysicalMaterial
          color="#9ca3af"
          metalness={0.12}
          roughness={0.75}
          clearcoat={0.08}
          clearcoatRoughness={0.85}
          envMapIntensity={0.6}
          dithering
        />
      </mesh>

      {/* Inner Panel Background - Orange */}
      <mesh position={[0, 1.5, 0.06]}>
        <boxGeometry args={[1.85, 3, 0.02]} />
        <meshPhysicalMaterial
          color="#F97316"
          metalness={0.06}
          roughness={0.62}
          clearcoat={0.35}
          clearcoatRoughness={0.55}
          envMapIntensity={0.9}
          dithering
        />
      </mesh>

      {/* Header */}
      <mesh position={[0, 3.2, 0.08]}>
        <boxGeometry args={[1.8, 0.3, 0.02]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.0} roughness={0.95} envMapIntensity={0.25} dithering />
      </mesh>
    </>
  );
});

const MainSwitchGroup = React.memo(function MainSwitchGroup({ showLightingLabels }) {
  const isPowerOff = useSimulationStore(state => state.isPowerOff);
  const currentStep = useSimulationStore(state => state.currentStep);
  const totalSteps = useSimulationStore(state => state.currentScenario?.steps?.length || 12);
  const powerOffConfirmed = useSimulationStore(state => state.powerOffConfirmed);
  const setPowerOff = useSimulationStore(state => state.setPowerOff);
  const setPowerOffConfirmed = useSimulationStore(state => state.setPowerOffConfirmed);
  const performStep = useSimulationStore(state => state.performStep);

  const isMaintenanceComplete = currentStep >= totalSteps;

  const handleMainSwitch = useCallback(() => {
    if (isPowerOff) {
      if (isMaintenanceComplete) {
        setPowerOff(false);
        setPowerOffConfirmed(false);
      }
      return;
    }
    setPowerOff(true);
  }, [isMaintenanceComplete, isPowerOff, setPowerOff, setPowerOffConfirmed]);

  const handleConfirmPowerOff = useCallback(() => {
    if (isPowerOff && !powerOffConfirmed) {
      if (currentStep >= 5) {
        setPowerOffConfirmed(true);
        try {
          performStep('certify_stop');
        } catch (e) {
          // Ignore duplicated certification attempts.
        }
      }
    }
  }, [currentStep, isPowerOff, performStep, powerOffConfirmed, setPowerOffConfirmed]);

  const mainSwitchColor = isPowerOff
    ? (powerOffConfirmed ? '#22C55E' : '#EF4444')
    : '#22C55E';
  const isLocked = isPowerOff && !powerOffConfirmed;

  return (
    <group position={[0, 2.5, 0.1]}>
      {/* Button base - more square */}
      <mesh>
        <boxGeometry args={[0.35, 0.45, 0.12]} />
        <meshStandardMaterial color="#2a2a2a" metalness={0.0} roughness={0.9} envMapIntensity={0.25} dithering />
      </mesh>
      {/* Button top - color changes with state - same animation as other buttons */}
      <mesh
        position={[0, isPowerOff ? 0.08 : -0.08, 0.07]}
        onClick={handleMainSwitch}
        onPointerOver={() => document.body.style.cursor = isLocked ? 'not-allowed' : 'pointer'}
        onPointerOut={() => document.body.style.cursor = 'default'}
      >
        <boxGeometry args={[0.28, 0.18, 0.03]} />
        <meshPhysicalMaterial
          color={mainSwitchColor}
          emissive={mainSwitchColor}
          emissiveIntensity={isLocked ? 0.1 : 0.5}
          metalness={0.0}
          roughness={0.55}
          clearcoat={0.25}
          clearcoatRoughness={0.6}
          envMapIntensity={0.55}
          dithering
        />
      </mesh>
      {/* I indicator (top) - Brighter and larger */}
      <mesh position={[0, 0.15, 0.08]}>
        <boxGeometry args={[0.04, 0.1, 0.008]} />
        <meshStandardMaterial color="#FFFFFF" emissive="#FFFFFF" emissiveIntensity={0.8} />
      </mesh>
      {/* O indicator (bottom) - Brighter and larger */}
      <mesh position={[0, -0.15, 0.08]}>
        <torusGeometry args={[0.035, 0.008, 8, 16]} />
        <meshStandardMaterial color="#FFFFFF" emissive="#FFFFFF" emissiveIntensity={0.8} />
      </mesh>

      {/* Elementos de teste usando componente separado */}
      <ElectricalPanelTestElements showLabels={showLightingLabels} />

      {/* Indicator light / Confirmation button */}
      <mesh
        position={[0.15, 0.2, 0.1]}
        onClick={handleConfirmPowerOff}
        onPointerOver={() => isPowerOff && !powerOffConfirmed ? document.body.style.cursor = 'pointer' : document.body.style.cursor = 'default'}
        onPointerOut={() => document.body.style.cursor = 'default'}
      >
        <circleGeometry args={[0.025, 16]} />
        <meshBasicMaterial color={isPowerOff ? (powerOffConfirmed ? '#22C55E' : '#EF4444') : '#22C55E'} />
      </mesh>

      {/* Lock indicator when maintenance is in progress */}
      {isLocked && (
        <mesh position={[0, 0.18, 0.1]}>
          <boxGeometry args={[0.1, 0.04, 0.01]} />
          <meshStandardMaterial color="#EF4444" />
        </mesh>
      )}
      {/* Ready indicator when maintenance is complete */}
      {isPowerOff && powerOffConfirmed && !isMaintenanceComplete && (
        <mesh position={[0, 0.18, 0.1]}>
          <boxGeometry args={[0.08, 0.03, 0.01]} />
          <meshStandardMaterial color="#FBBF24" />
        </mesh>
      )}
      {/* Ready to re-enable indicator */}
      {isPowerOff && isMaintenanceComplete && (
        <mesh position={[0, 0.18, 0.1]}>
          <boxGeometry args={[0.1, 0.04, 0.01]} />
          <meshStandardMaterial color="#22C55E" />
        </mesh>
      )}
    </group>
  );
});

const SwitchBank = React.memo(function SwitchBank({ side }) {
  const isPowerOff = useSimulationStore(state => state.isPowerOff);

  const storeLeftSwitches = useSimulationStore(state => state.leftSwitches);
  const storeRightSwitches = useSimulationStore(state => state.rightSwitches);
  const setLeftSwitches = useSimulationStore(state => state.setLeftSwitches);
  const setRightSwitches = useSimulationStore(state => state.setRightSwitches);

  const switches = useMemo(() => {
    const fallback = [true, true, true, true];
    const raw = side === 'left' ? storeLeftSwitches : storeRightSwitches;
    return raw && Array.isArray(raw) ? raw : fallback;
  }, [side, storeLeftSwitches, storeRightSwitches]);

  const voltages = useMemo(() => ['220V', '220V', '220V', '127V'], []);
  const bankPosition = side === 'left' ? [-0.6, 1.85, 0.1] : [0.6, 1.85, 0.1];
  const labelPosition = side === 'left' ? [-0.22, 0.05, 0.05] : [0.22, 0.05, 0.05];

  const handleToggle = useCallback((index) => {
    if (isPowerOff) return;
    if (side === 'left') {
      const next = switches.map((state, i) => i === index ? !state : state);
      setLeftSwitches(next);
      return;
    }
    const next = switches.map((state, i) => i === index ? !state : state);
    setRightSwitches(next);
  }, [isPowerOff, setLeftSwitches, setRightSwitches, side, switches]);

  return (
    <group position={bankPosition}>
      {switches.map((isOn, i) => (
        <group key={i} position={[0, -i * 0.45, 0]}>
          <mesh
            onClick={() => handleToggle(i)}
            onPointerOver={() => document.body.style.cursor = 'pointer'}
            onPointerOut={() => document.body.style.cursor = 'default'}
          >
            <boxGeometry args={[0.15, 0.35, 0.08]} />
            <meshStandardMaterial color="#2a2a2a" metalness={0.0} roughness={0.9} envMapIntensity={0.25} dithering />
          </mesh>
          <mesh position={[0, isOn ? 0.08 : -0.08, 0.05]}>
            <boxGeometry args={[0.12, 0.15, 0.02]} />
            <meshPhysicalMaterial
              color={isOn ? '#22C55E' : '#EF4444'}
              emissive={isOn ? '#22C55E' : '#EF4444'}
              emissiveIntensity={0.3}
              metalness={0.0}
              roughness={0.55}
              clearcoat={0.22}
              clearcoatRoughness={0.6}
              envMapIntensity={0.55}
              dithering
            />
          </mesh>
          <mesh position={[0, 0.12, 0.07]}>
            <boxGeometry args={[0.04, 0.1, 0.008]} />
            <meshStandardMaterial color="#FFFFFF" emissive="#FFFFFF" emissiveIntensity={0.8} />
          </mesh>
          <mesh position={[0, -0.12, 0.07]}>
            <torusGeometry args={[0.035, 0.008, 8, 16]} />
            <meshStandardMaterial color="#FFFFFF" emissive="#FFFFFF" emissiveIntensity={0.8} />
          </mesh>
          <Text
            position={labelPosition}
            fontSize={0.045}
            color="#000000"
            outlineWidth={0.006}
            outlineColor="#FFFFFF"
            fontWeight="bold"
            anchorX="center"
            anchorY="middle"
          >
            {isPowerOff ? '0V' : (isOn ? voltages[i] : '0V')}
          </Text>
        </group>
      ))}
    </group>
  );
});

const LockoutSection = React.memo(function LockoutSection() {
  const equipmentConfirmed = useSimulationStore(state => state.equipmentConfirmed);
  const residualEnergyEliminated = useSimulationStore(state => state.residualEnergyEliminated);
  const lockoutExecuted = useSimulationStore(state => state.lockoutExecuted);
  const tagConfirmed = useSimulationStore(state => state.tagConfirmed);
  const setLockoutExecuted = useSimulationStore(state => state.setLockoutExecuted);
  const setLockApplied = useSimulationStore(state => state.setLockApplied);
  const setTagConfirmed = useSimulationStore(state => state.setTagConfirmed);
  const setTagApplied = useSimulationStore(state => state.setTagApplied);
  const performStep = useSimulationStore(state => state.performStep);

  const handleExecuteLockout = useCallback(() => {
    if (equipmentConfirmed && !lockoutExecuted) {
      performStep('execute_lockout');
      setLockoutExecuted(true);
      setLockApplied(true);
    }
  }, [equipmentConfirmed, lockoutExecuted, performStep, setLockApplied, setLockoutExecuted]);

  const handleFillTagConfirming = useCallback(() => {
    if (residualEnergyEliminated && !tagConfirmed) {
      performStep('fill_tag_confirming');
      setTagConfirmed(true);
      setTagApplied(true);
    }
  }, [performStep, residualEnergyEliminated, setTagApplied, setTagConfirmed, tagConfirmed]);

  return (
    <group position={[0, -0.8, 0.1]}>
      <mesh>
        <boxGeometry args={[1.6, 0.15, 0.04]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      <mesh position={[-0.5, 0, 0.03]}>
        <cylinderGeometry args={[0.04, 0.04, 0.03, 16]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      <mesh position={[0.5, 0, 0.03]}>
        <cylinderGeometry args={[0.04, 0.04, 0.03, 16]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      <Hotspot
        position={[-0.5, 0.1, 0.03]}
        stepName="execute_lockout"
        label="BLOQUEIO"
        onClick={handleExecuteLockout}
        disabled={!equipmentConfirmed}
      />
      <Hotspot
        position={[0.5, 0.1, 0.03]}
        stepName="fill_tag_confirming"
        label="ETIQUETA"
        onClick={handleFillTagConfirming}
        disabled={!residualEnergyEliminated}
      />
    </group>
  );
});

const VisualLockTag = React.memo(function VisualLockTag() {
  const releaseRequested = useSimulationStore(state => state.releaseRequested);
  const lockApplied = useSimulationStore(state => state.lockApplied);
  const tagApplied = useSimulationStore(state => state.tagApplied);
  const setShowTagPopup = useSimulationStore(state => state.setShowTagPopup);

  const handleLockTagClick = useCallback(() => {
    setShowTagPopup(true);
  }, [setShowTagPopup]);

  if (!(releaseRequested || lockApplied || tagApplied)) return null;

  return (
    <group
      position={[0, 2.5, 0.12]}
      onClick={handleLockTagClick}
      onPointerOver={() => document.body.style.cursor = 'pointer'}
      onPointerOut={() => document.body.style.cursor = 'default'}
    >
      {(releaseRequested || lockApplied) && (
        <group position={[0.5, 0, -0.02]}>
          <mesh>
            <boxGeometry args={[0.35, 0.45, 0.016]} />
            <meshStandardMaterial color="#FACC15" metalness={0.1} roughness={0.5} />
          </mesh>
          <mesh position={[0, 0, 0.01]}>
            <boxGeometry args={[0.28, 0.38, 0.004]} />
            <meshStandardMaterial color="#FFFFFF" />
          </mesh>
          <mesh position={[0, 0.12, 0.015]}>
            <boxGeometry args={[0.25, 0.04, 0.002]} />
            <meshStandardMaterial color="#000000" />
          </mesh>
          <mesh position={[0, 0.04, 0.015]}>
            <boxGeometry args={[0.25, 0.04, 0.002]} />
            <meshStandardMaterial color="#000000" />
          </mesh>
          <mesh position={[0, -0.04, 0.015]}>
            <boxGeometry args={[0.25, 0.04, 0.002]} />
            <meshStandardMaterial color="#000000" />
          </mesh>
          <mesh position={[0, -0.12, 0.015]}>
            <boxGeometry args={[0.25, 0.04, 0.002]} />
            <meshStandardMaterial color="#000000" />
          </mesh>
          <Text
            position={[0, 0.18, 0.02]}
            fontSize={0.03}
            fontWeight="bold"
            color="#DC2626"
            anchorX="center"
            anchorY="middle"
          >
            PERIGO
          </Text>
        </group>
      )}

      {(releaseRequested || lockApplied) && (
        <group position={[0.5, 0, 0.02]}>
          <mesh>
            <boxGeometry args={[0.24, 0.2, 0.08]} />
            <meshStandardMaterial color="#DC2626" metalness={0.3} roughness={0.4} />
          </mesh>
          <mesh position={[0, 0.2, 0]}>
            <torusGeometry args={[0.07, 0.024, 8, 16, Math.PI]} />
            <meshStandardMaterial color="#1a1a1a" metalness={0.1} roughness={0.8} />
          </mesh>
        </group>
      )}
    </group>
  );
});

const ElectricalPanel = ({ showLightingLabels = false }) => {
  return (
    <group position={[-1.2, 0, 2]} rotation={[0, 0.4, 0]}>
      <PanelShell />
      
      <MainSwitchGroup showLightingLabels={showLightingLabels} />
      <SwitchBank side="left" />
      <SwitchBank side="right" />
      <LockoutSection />
      <VisualLockTag />


    </group>
  );
};

export default React.memo(ElectricalPanel);

