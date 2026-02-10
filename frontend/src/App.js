import React, { useEffect, useState } from 'react';
import axios from 'axios';
import SceneManager from './components/SceneManager';
import HUD from './components/HUD';
import MenuScreen from './components/MenuScreen';
import ResultsScreen from './components/ResultsScreen';
import useSimulationStore from './store/simulationStore';
import audioManager from './utils/audioManager';
import { useTranslation } from './utils/translations';
import { toast, Toaster } from 'sonner';
import './App.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function App() {
  const [screen, setScreen] = useState('menu'); // 'menu', 'simulation', 'results'
  const currentScenario = useSimulationStore(state => state.currentScenario);
  const language = useSimulationStore(state => state.language);
  const stepsPerformed = useSimulationStore(state => state.stepsPerformed);
  const simulationActive = useSimulationStore(state => state.simulationActive);
  const setSimulationId = useSimulationStore(state => state.setSimulationId);
  const resetSimulation = useSimulationStore(state => state.resetSimulation);
  const completeSimulation = useSimulationStore(state => state.completeSimulation);
  const t = useTranslation(language);

  // Monitor steps and provide feedback
  useEffect(() => {
    if (stepsPerformed.length > 0) {
      const lastStep = stepsPerformed[stepsPerformed.length - 1];
      
      if (lastStep.correct) {
        audioManager.playCorrect();
        toast.success(t('correct'), {
          description: t('correctMessage'),
          duration: 2000,
        });
      } else {
        audioManager.playIncorrect();
        toast.error(t('incorrect'), {
          description: t('incorrectMessage'),
          duration: 3000,
        });
      }
    }
  }, [stepsPerformed.length]);

  // Check if simulation is complete
  useEffect(() => {
    if (currentScenario && stepsPerformed.length === currentScenario.steps.length && simulationActive) {
      handleSimulationComplete();
    }
  }, [stepsPerformed.length, currentScenario]);

  const handleSimulationComplete = async () => {
    completeSimulation();
    
    // Save to backend
    try {
      const simId = useSimulationStore.getState().simulationId;
      if (simId) {
        await axios.patch(`${API}/simulations/${simId}`, {
          steps_performed: stepsPerformed,
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
  };

  const handleStartSimulation = async (scenario) => {
    const scenarioToUse = scenario || currentScenario;
    if (!scenarioToUse) {
      console.error('No scenario selected');
      return;
    }
    
    try {
      // Create simulation in backend
      const response = await axios.post(`${API}/simulations`, {
        scenario_id: scenarioToUse.id,
        language: language
      });
      setSimulationId(response.data.id);
    } catch (error) {
      console.error('Error creating simulation:', error);
    }
    
    setScreen('simulation');
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
        <MenuScreen onStart={handleStartSimulation} />
      )}

      {screen === 'simulation' && (
        <div className="w-full h-screen relative">
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