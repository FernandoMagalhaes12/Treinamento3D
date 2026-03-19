import React, { useEffect, useRef } from 'react';
import { toast } from 'sonner';
import { useShallow } from 'zustand/react/shallow';
import useSimulationStore from '../store/simulationStore';
import audioManager from '../utils/audioManager';
import { useTranslation } from '../utils/translations';

const SimulationSideEffects = ({ onSimulationComplete }) => {
  const lastNotifiedStepCountRef = useRef(0);

  const { language, currentScenario, stepsPerformed, simulationActive } = useSimulationStore(
    useShallow((state) => ({
      language: state.language,
      currentScenario: state.currentScenario,
      stepsPerformed: state.stepsPerformed,
      simulationActive: state.simulationActive,
    }))
  );

  const t = useTranslation(language);

  // Monitor steps and provide feedback (identical behavior to previous App.js logic)
  useEffect(() => {
    if (stepsPerformed.length < lastNotifiedStepCountRef.current) {
      lastNotifiedStepCountRef.current = stepsPerformed.length;
      return;
    }

    if (stepsPerformed.length === 0 || stepsPerformed.length === lastNotifiedStepCountRef.current) {
      return;
    }

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

    lastNotifiedStepCountRef.current = stepsPerformed.length;
  }, [stepsPerformed, t]);

  // Auto complete when all steps are performed (same behavior as previous App.js effect)
  useEffect(() => {
    if (!currentScenario) return;
    if (!simulationActive) return;

    if (stepsPerformed.length === currentScenario.steps.length) {
      onSimulationComplete();
    }
  }, [currentScenario, onSimulationComplete, simulationActive, stepsPerformed.length]);

  return null;
};

export default React.memo(SimulationSideEffects);
