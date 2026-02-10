import { create } from 'zustand';

const useSimulationStore = create((set, get) => ({
  // Language
  language: 'pt',
  setLanguage: (lang) => set({ language: lang }),

  // Scenarios
  scenarios: [],
  currentScenario: null,
  setScenarios: (scenarios) => set({ scenarios }),
  setCurrentScenario: (scenario) => set({ currentScenario: scenario, currentStep: 0, stepsPerformed: [], simulationActive: true }),

  // Simulation state
  simulationId: null,
  simulationActive: false,
  currentStep: 0,
  stepsPerformed: [],
  selectedTool: null,
  hoveredHotspot: null,

  setSimulationId: (id) => set({ simulationId: id }),
  setSimulationActive: (active) => set({ simulationActive: active }),
  setSelectedTool: (tool) => set({ selectedTool: tool }),
  setHoveredHotspot: (hotspot) => set({ hoveredHotspot: hotspot }),

  // Perform step
  performStep: (stepName) => {
    const { currentScenario, stepsPerformed, currentStep } = get();
    if (!currentScenario) return;

    const expectedSteps = currentScenario.steps;
    const expectedOrder = expectedSteps.indexOf(stepName);
    const actualOrder = stepsPerformed.length;
    const correct = expectedOrder === actualOrder;

    const newStep = {
      step_name: stepName,
      timestamp: new Date().toISOString(),
      correct,
      expected_order: expectedOrder,
      actual_order: actualOrder
    };

    set({
      stepsPerformed: [...stepsPerformed, newStep],
      currentStep: actualOrder + 1
    });

    return { correct, step: newStep };
  },

  // Reset simulation
  resetSimulation: () => set({
    currentStep: 0,
    stepsPerformed: [],
    selectedTool: null,
    simulationActive: true,
    simulationId: null
  }),

  // Complete simulation
  completeSimulation: () => set({ simulationActive: false }),
}));

export default useSimulationStore;