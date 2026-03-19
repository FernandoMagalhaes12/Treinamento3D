import { create } from 'zustand';

let gameOverTimer = null;

const useSimulationStore = create((set, get) => ({
  // Language
  language: 'pt',
  setLanguage: (lang) => set({ language: lang }),

  // Scenarios
  scenarios: [],
  currentScenario: null,
  setScenarios: (scenarios) => set({ scenarios }),
  setCurrentScenario: (scenario) => set({
    currentScenario: scenario,
    currentStep: 0,
    stepsPerformed: [],
    simulationActive: true,
    tagData: {
      tagNumber: '',
      blockerName: '',
      company: '',
      dateTime: ''
    },
    // Reset generator fence gate lock each time a scenario starts
    generatorGateLocked: true,
    gateUnlockDialogOpen: false,
    generatorGateUnlockedWhilePowerOn: false,
    // Reset game over flash
    gameOver: false,
  }),

  // Simulation state
  simulationId: null,
  simulationActive: false,
  currentStep: 0,
  stepsPerformed: [],
  selectedTool: null,
  hoveredHotspot: null,
  
  // Original power/lock states (still needed for ElectricalPanel compatibility)
  isPowerOff: false,
  powerOffConfirmed: false,
  lockApplied: false,
  tagApplied: false,
  
  // LOTO 12-step states
  isIdentified: false,
  matrixConsulted: false,
  releaseRequested: false,
  tagFilled: false,
  tagDelivered: false,
  stopCertified: false,
  equipmentConfirmed: false,
  lockoutExecuted: false,
  residualEnergyEliminated: false,
  tagConfirmed: false,
  operationalStateConfirmed: false,
  effectivenessTested: false,

  setSimulationId: (id) => set({ simulationId: id }),
  setSimulationActive: (active) => set({ simulationActive: active }),
  setSelectedTool: (tool) => set({ selectedTool: tool }),
  setHoveredHotspot: (hotspot) => set({ hoveredHotspot: hotspot }),
  
  // Original setters (needed for compatibility)
  setPowerOff: (off) => set({ isPowerOff: off }),
  setPowerOffConfirmed: (confirmed) => set({ powerOffConfirmed: confirmed }),
  setLockApplied: (applied) => set({ lockApplied: applied }),
  setTagApplied: (applied) => set({ tagApplied: applied }),

  // LOTO step setters
  setIdentified: (val) => set({ isIdentified: val }),
  setMatrixConsulted: (val) => set({ matrixConsulted: val }),
  setReleaseRequested: (val) => set({ releaseRequested: val }),
  setTagFilled: (val) => set({ tagFilled: val }),
  setTagDelivered: (val) => set({ tagDelivered: val }),
  setStopCertified: (val) => set({ stopCertified: val }),
  setEquipmentConfirmed: (val) => set({ equipmentConfirmed: val }),
  setLockoutExecuted: (val) => set({ lockoutExecuted: val }),
  setResidualEnergyEliminated: (val) => set({ residualEnergyEliminated: val }),
  setTagConfirmed: (val) => set({ tagConfirmed: val }),
  setOperationalStateConfirmed: (val) => set({ operationalStateConfirmed: val }),
  setEffectivenessTested: (val) => set({ effectivenessTested: val }),

  // Perform step - LOTO 9-step NR10 procedure
  // Step 1 (identification) requires power to be off
  // Step 9 (eliminate_residual_energy) is free to use until all previous steps are completed
  performStep: (stepName, skipOrderCheck = false) => {
    const { currentScenario, stepsPerformed, currentStep, isPowerOff } = get();
    if (!currentScenario) return;

    const expectedSteps = currentScenario.steps;
    const expectedOrder = expectedSteps.indexOf(stepName);
    const actualOrder = stepsPerformed.length;

    // Special handling for certify_stop - can be done when power is off (regardless of order)
    // This allows user to certify stop by testing the breaker with multimeter showing 0V
    if (stepName === 'certify_stop' && isPowerOff) {
      // Always allow certify_stop when power is off, skip order check
      const newStep = {
        step_name: stepName,
        timestamp: new Date().toISOString(),
        correct: true,
        expected_order: expectedOrder,
        actual_order: actualOrder
      };
      set({
        stepsPerformed: [...stepsPerformed, newStep],
        currentStep: actualOrder + 1,
        stopCertified: true
      });
      return { correct: true, step: newStep };
    }

    // Special handling for step 1 (identification) - requires power to be off
    if (stepName === 'identification') {
      // If power is not off, this step should be marked as incorrect
      if (!isPowerOff) {
        const newStep = {
          step_name: stepName,
          timestamp: new Date().toISOString(),
          correct: false, // ERROR - power is still on!
          expected_order: expectedOrder,
          actual_order: actualOrder
        };
        set({
          stepsPerformed: [...stepsPerformed, newStep],
          currentStep: actualOrder + 1
        });
        return { correct: false, step: newStep };
      }
    }

    // Special handling for step 4 (eliminate_residual_energy)
    // Always validate when clicked - this is the test step for ground rod
    if (stepName === 'eliminate_residual_energy') {
      const newStep = {
        step_name: stepName,
        timestamp: new Date().toISOString(),
        correct: true,
        expected_order: expectedOrder,
        actual_order: actualOrder
      };
      // Always set as completed and show the ground rod
      set({ residualEnergyEliminated: true, currentStep: 4, stepsPerformed: [...stepsPerformed, newStep] });
      return { correct: true, step: newStep };
    }

    const correct = expectedOrder === actualOrder;

    const newStep = {
      step_name: stepName,
      timestamp: new Date().toISOString(),
      correct,
      expected_order: expectedOrder,
      actual_order: actualOrder
    };

    // Map step names to state setters
    const stepStateMap = {
      'identification': { key: 'isIdentified', setter: 'setIdentified' },
      'consult_matrix': { key: 'matrixConsulted', setter: 'setMatrixConsulted' },
      'request_release': { key: 'releaseRequested', setter: 'setReleaseRequested' },
      'fill_tag': { key: 'tagFilled', setter: 'setTagFilled' },
      'deliver_tag_lock': { key: 'tagDelivered', setter: 'setTagDelivered' },
      'certify_stop': { key: 'stopCertified', setter: 'setStopCertified' },
      'confirm_equipment_state': { key: 'equipmentConfirmed', setter: 'setEquipmentConfirmed' },
      'execute_lockout': { key: 'lockoutExecuted', setter: 'setLockoutExecuted', lockApplied: true },
      'eliminate_residual_energy': { key: 'residualEnergyEliminated', setter: 'setResidualEnergyEliminated' },
      'fill_tag_confirming': { key: 'tagConfirmed', setter: 'setTagConfirmed', tagApplied: true },
      'confirm_operational_state': { key: 'operationalStateConfirmed', setter: 'setOperationalStateConfirmed' },
      'test_effectiveness': { key: 'effectivenessTested', setter: 'setEffectivenessTested' }
    };

    const stateUpdate = stepStateMap[stepName] || {};
    
    // Build the update object
    const updateObj = {
      stepsPerformed: [...stepsPerformed, newStep],
      currentStep: actualOrder + 1
    };
    
    // Add the main state update if exists
    if (stateUpdate.key) {
      updateObj[stateUpdate.key] = true;
    }
    
    // Add lockApplied when execute_lockout is performed
    if (stepName === 'execute_lockout') {
      updateObj.lockApplied = true;
    }
    
    // Add tagApplied when fill_tag_confirming is performed
    if (stepName === 'fill_tag_confirming') {
      updateObj.tagApplied = true;
    }
    
    // Add lockApplied when request_release is performed (shows lock on panel)
    if (stepName === 'request_release') {
      updateObj.lockApplied = true;
      updateObj.tagApplied = true; // Show tag together with lock at step 3
    }
    
    set(updateObj);

    return { correct, step: newStep };
  },

  // Reset simulation
  resetSimulation: () => set({
    currentStep: 0,
    stepsPerformed: [],
    selectedTool: null,
    simulationActive: true,
    simulationId: null,
    // Original states
    isPowerOff: false,
    powerOffConfirmed: false,
    lockApplied: false,
    tagApplied: false,
    // LOTO 12-step states
    isIdentified: false,
    matrixConsulted: false,
    releaseRequested: false,
    tagFilled: false,
    tagDelivered: false,
    stopCertified: false,
    equipmentConfirmed: false,
    lockoutExecuted: false,
    residualEnergyEliminated: false,
    tagConfirmed: false,
    operationalStateConfirmed: false,
    effectivenessTested: false,
    // Reset generator fence gate lock
    generatorGateLocked: true,
    gateUnlockDialogOpen: false,
    generatorGateUnlockedWhilePowerOn: false,
    // Reset game over flash
    gameOver: false,
  }),

  // Game over flash (centralized so 3D interactions can trigger it)
  gameOver: false,
  triggerGameOver: (durationMs = 2000) => {
    if (gameOverTimer) clearTimeout(gameOverTimer);
    set({ gameOver: true });
    gameOverTimer = setTimeout(() => {
      set({ gameOver: false });
      gameOverTimer = null;
    }, durationMs);
  },

  // Generator fence gate lock + dialog
  generatorGateLocked: true,
  gateUnlockDialogOpen: false,
  generatorGateUnlockedWhilePowerOn: false,
  openGateUnlockDialog: () => set({ gateUnlockDialogOpen: true }),
  closeGateUnlockDialog: () => set({ gateUnlockDialogOpen: false }),
  unlockGeneratorGate: () => {
    const { isPowerOff } = get();
    set({
      generatorGateLocked: false,
      gateUnlockDialogOpen: false,
      // If user removes padlock while power is ON, opening the gate becomes unsafe
      generatorGateUnlockedWhilePowerOn: !isPowerOff,
    });
  },

  // Complete simulation
  completeSimulation: () => set({ simulationActive: false }),

  // Multimeter state - which breaker is being tested
  testedBreaker: null,
  setTestedBreaker: (breaker) => set({ testedBreaker: breaker }),
  
  // Tag visualization popup state
  showTagPopup: false,
  setShowTagPopup: (show) => set({ showTagPopup: show }),
  
  // Generator energy verification popup state
  showGeneratorEnergyPopup: false,
  setShowGeneratorEnergyPopup: (show) => set({ showGeneratorEnergyPopup: show }),

  // Centralized tag data shared across HUD and 3D panel interactions
  tagData: {
    tagNumber: '',
    blockerName: '',
    company: '',
    dateTime: ''
  },
  setTagData: (update) => set((state) => ({
    tagData: typeof update === 'function' ? update(state.tagData) : update
  })),
  
  // Breaker states for multimeter - all start ON
  leftSwitches: [true, true, true, true],
  rightSwitches: [true, true, true, true],
  setLeftSwitches: (switches) => set({ leftSwitches: switches }),
  setRightSwitches: (switches) => set({ rightSwitches: switches }),
}));

export default useSimulationStore;
