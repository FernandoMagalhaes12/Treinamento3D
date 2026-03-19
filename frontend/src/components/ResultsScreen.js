import React, { useCallback, useEffect, useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { RotateCcw, Home, AlertTriangle, CheckCircle } from 'lucide-react';
import useSimulationStore from '../store/simulationStore';
import { useTranslation } from '../utils/translations';
import audioManager from '../utils/audioManager';
import { API_BASE } from '../lib/api';

const ResultsScreen = ({ onRestart, onBackToMenu }) => {
  const language = useSimulationStore(state => state.language);
  const simulationId = useSimulationStore(state => state.simulationId);
  const currentScenario = useSimulationStore(state => state.currentScenario);
  const stepsPerformed = useSimulationStore(state => state.stepsPerformed);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const t = useTranslation(language);

  const calculateLocalResults = useCallback(() => {
    const correctSteps = stepsPerformed.filter(s => s.correct).length;
    const incorrectSteps = stepsPerformed.length - correctSteps;
    const score = stepsPerformed.length > 0 ? (correctSteps / stepsPerformed.length * 100) : 0;

    const violations = stepsPerformed
      .filter(s => !s.correct)
      .map((s) => `${language === 'pt' ? 'Etapa' : 'Step'} ${s.actual_order + 1}: ${t(s.step_name)} ${language === 'pt' ? 'executado fora de ordem' : 'executed out of order'}`);

    setResults({
      total_steps: stepsPerformed.length,
      correct_steps: correctSteps,
      incorrect_steps: incorrectSteps,
      score: Math.round(score),
      safety_violations: violations
    });
    setLoading(false);
  }, [stepsPerformed, language, t]);

  const fetchResults = useCallback(async () => {
    try {
      const response = await axios.get(`${API_BASE}/simulations/${simulationId}/results`);
      setResults(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching results:', error);
      calculateLocalResults();
    }
  }, [simulationId, calculateLocalResults]);

  useEffect(() => {
    if (simulationId) {
      fetchResults();
    } else {
      calculateLocalResults();
    }
  }, [simulationId, fetchResults, calculateLocalResults]);

  const handleRestart = () => {
    audioManager.playClick();
    onRestart();
  };

  const handleBackToMenu = () => {
    audioManager.playClick();
    onBackToMenu();
  };

  if (loading || !results) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" style={{ background: '#09090b' }}>
        <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  const isPerfect = results.score === 100;
  const hasCriticalFailures = results.score < 60;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6" style={{ background: '#09090b' }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-3xl"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="inline-block mb-4"
          >
            {isPerfect ? (
              <CheckCircle className="w-20 h-20 text-green-400" />
            ) : hasCriticalFailures ? (
              <AlertTriangle className="w-20 h-20 text-red-500" />
            ) : (
              <AlertTriangle className="w-20 h-20 text-yellow-500" />
            )}
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-4xl md:text-5xl font-bold uppercase tracking-tight text-primary mb-2"
            style={{ fontFamily: '"Barlow Condensed", sans-serif' }}
          >
            {t('simulationComplete')}
          </motion.h1>
          
          {currentScenario && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="text-lg text-slate-400 uppercase tracking-wider font-mono"
            >
              {language === 'pt' ? currentScenario.name_pt : currentScenario.name_en}
            </motion.p>
          )}
        </div>

        {/* Score Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-zinc-900/70 backdrop-blur-xl border-2 border-primary/30 rounded-2xl p-8 mb-6 shadow-[0_0_50px_rgba(234,179,8,0.2)]"
        >
          <div className="text-center mb-6">
            <p className="text-sm font-mono uppercase tracking-widest text-slate-400 mb-2">{t('yourScore')}</p>
            <div className="text-7xl font-bold text-primary" style={{ fontFamily: '"Barlow Condensed", sans-serif' }}>
              {results.score}%
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4 text-center">
              <p className="text-sm font-mono uppercase tracking-widest text-slate-400 mb-1">{t('correctSteps')}</p>
              <p className="text-3xl font-bold text-green-400">{results.correct_steps}</p>
            </div>
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-center">
              <p className="text-sm font-mono uppercase tracking-widest text-slate-400 mb-1">{t('incorrectSteps')}</p>
              <p className="text-3xl font-bold text-red-400">{results.incorrect_steps}</p>
            </div>
          </div>
        </motion.div>

        {/* Safety Violations */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-zinc-900/70 backdrop-blur-xl border border-white/10 rounded-xl p-6 mb-6"
          data-testid="safety-violations-panel"
        >
          <h3 className="text-xl font-semibold uppercase tracking-wide text-primary mb-4" style={{ fontFamily: '"Barlow Condensed", sans-serif' }}>
            {t('safetyViolations')}
          </h3>
          
          {results.safety_violations.length === 0 ? (
            <div className="flex items-center gap-3 text-green-400 bg-green-500/10 border border-green-500/30 rounded-lg p-4">
              <CheckCircle className="w-6 h-6" />
              <p className="text-sm font-medium">{t('noViolations')}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {results.safety_violations.map((violation, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg p-3"
                >
                  <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <p className="text-sm leading-relaxed">{violation}</p>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Accident Warning */}
        {hasCriticalFailures && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7 }}
            className="bg-red-500/20 border-2 border-red-500 rounded-xl p-6 mb-6"
            data-testid="accident-warning"
          >
            <h3 className="text-2xl font-bold uppercase text-red-500 mb-3 flex items-center gap-3" style={{ fontFamily: '"Barlow Condensed", sans-serif' }}>
              <AlertTriangle className="w-8 h-8" />
              {t('accidentWarning')}
            </h3>
            <p className="text-slate-200 leading-relaxed">
              {t('accidentMessage')}
            </p>
          </motion.div>
        )}

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <button
            onClick={handleRestart}
            data-testid="restart-simulation-button"
            className="bg-primary text-black hover:bg-primary/90 h-12 px-6 py-2 rounded-md font-bold uppercase tracking-wider transition-all active:scale-95 shadow-[0_0_20px_rgba(234,179,8,0.3)] flex items-center justify-center gap-2"
          >
            <RotateCcw className="w-5 h-5" />
            {t('tryAgain')}
          </button>
          <button
            onClick={handleBackToMenu}
            data-testid="back-to-menu-button"
            className="bg-zinc-800 text-white hover:bg-zinc-700 h-12 px-6 py-2 rounded-md font-medium uppercase tracking-wider transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <Home className="w-5 h-5" />
            {t('backToMenu')}
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default ResultsScreen;