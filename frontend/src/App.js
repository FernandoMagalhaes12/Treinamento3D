import React, { useCallback, useEffect, useRef, useState } from 'react';
import axios from 'axios';
import SceneManager from './components/SceneManager';
import HUD from './components/HUD';
import MenuScreen from './components/MenuScreen';
import ResultsScreen from './components/ResultsScreen';
import WebGLWarmup from './components/WebGLWarmup';
import SimulationSideEffects from './components/SimulationSideEffects';
import useSimulationStore from './store/simulationStore';
import { API_BASE } from './lib/api';
import { Toaster } from 'sonner';
import './App.css';

function App() {
  const [screen, setScreen] = useState('menu'); // 'menu', 'simulation', 'results'
  const [webglWarmed, setWebglWarmed] = useState(false);
  const currentScenario = useSimulationStore(state => state.currentScenario);
  const setSimulationId = useSimulationStore(state => state.setSimulationId);
  const resetSimulation = useSimulationStore(state => state.resetSimulation);
  const completeSimulation = useSimulationStore(state => state.completeSimulation);

  const handleSimulationComplete = useCallback(async () => {
    completeSimulation();

    // Save to backend
    try {
      const state = useSimulationStore.getState();
      if (state.simulationId) {
        await axios.patch(`${API_BASE}/simulations/${state.simulationId}`, {
          steps_performed: state.stepsPerformed,
          completed: true
        });
      }
    } catch (error) {
      console.error('Error saving simulation:', error);
    }

    // Show results after a short delay
    setTimeout(() => {
      setScreen('results');
    }, 1500);
  }, [completeSimulation]);

  const handleStartSimulation = (scenario) => {
    const scenarioToUse = scenario || currentScenario;
    if (!scenarioToUse) {
      console.error('No scenario selected');
      return;
    }

    // Enter scenario immediately; backend persistence runs in the background.
    setScreen('simulation');

    void axios
      .post(`${API_BASE}/simulations`, {
        scenario_id: scenarioToUse.id,
        language: useSimulationStore.getState().language
      })
      .then((response) => {
        setSimulationId(response.data.id);
      })
      .catch((error) => {
        console.error('Error creating simulation:', error);
      });
  };

  const handleRestart = () => {
    resetSimulation();
    setScreen('simulation');
    handleStartSimulation();
  };

  const handleBackToMenu = () => {
    resetSimulation();
    setScreen('menu');
  };

  return (
    <div className="App">
      <Toaster 
        position="top-center" 
        theme="dark"
        toastOptions={{
          style: {
            background: '#18181b',
            color: '#f8fafc',
            border: '1px solid rgba(255, 255, 255, 0.1)',
          },
          className: 'font-mono uppercase text-sm',
        }}
      />

      {screen === 'menu' && (
        <>
          <MenuScreen onStart={handleStartSimulation} />
          {!webglWarmed && currentScenario && (
            <WebGLWarmup onReady={() => setWebglWarmed(true)} />
          )}
        </>
      )}

      {screen === 'simulation' && (
        <div className="w-full h-screen relative">
          <SimulationSideEffects onSimulationComplete={handleSimulationComplete} />
          <SceneManager />
          <HUD />
        </div>
      )}

      {screen === 'results' && (
        <ResultsScreen 
          onRestart={handleRestart} 
          onBackToMenu={handleBackToMenu}
        />
      )}
    </div>
  );
}

export default App;