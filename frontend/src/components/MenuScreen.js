import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Globe } from 'lucide-react';
import useSimulationStore from '../store/simulationStore';
import { useTranslation } from '../utils/translations';
import audioManager from '../utils/audioManager';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const MenuScreen = ({ onStart }) => {
  const language = useSimulationStore(state => state.language);
  const setLanguage = useSimulationStore(state => state.setLanguage);
  const scenarios = useSimulationStore(state => state.scenarios);
  const setScenarios = useSimulationStore(state => state.setScenarios);
  const setCurrentScenario = useSimulationStore(state => state.setCurrentScenario);
  const [selectedScenario, setSelectedScenario] = useState(null);
  const [loading, setLoading] = useState(true);
  const t = useTranslation(language);

  useEffect(() => {
    fetchScenarios();
  }, []);

  const fetchScenarios = async () => {
    try {
      const response = await axios.get(`${API}/scenarios`);
      setScenarios(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching scenarios:', error);
      setLoading(false);
    }
  };

  const handleStart = () => {
    if (selectedScenario) {
      audioManager.playClick();
      setCurrentScenario(selectedScenario);
      onStart(selectedScenario);
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'easy': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'hard': return 'text-red-400';
      default: return 'text-slate-400';
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6" style={{ background: '#09090b' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-4xl"
      >
        {/* Header */}
        <div className="text-center mb-12">
          <motion.h1
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-5xl md:text-6xl font-bold uppercase tracking-tight text-primary mb-3"
            style={{ fontFamily: '"Barlow Condensed", sans-serif' }}
          >
            {t('title')}
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="text-lg text-slate-400 uppercase tracking-wider font-mono"
          >
            {t('subtitle')}
          </motion.p>

          {/* Language Switcher */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            onClick={() => {
              audioManager.playClick();
              setLanguage(language === 'pt' ? 'en' : 'pt');
            }}
            className="mt-6 bg-zinc-900/70 backdrop-blur-xl border border-white/10 px-5 py-2 rounded-lg hover:bg-white/10 transition-all flex items-center gap-2 text-sm font-mono uppercase mx-auto"
          >
            <Globe className="w-4 h-4" />
            {language === 'pt' ? 'Português' : 'English'}
          </motion.button>
        </div>

        {/* Scenarios */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold uppercase tracking-wide text-center mb-6 text-primary" style={{ fontFamily: '"Barlow Condensed", sans-serif' }}>
            {t('selectScenario')}
          </h2>

          {loading ? (
            <div className="text-center text-slate-400">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <AnimatePresence>
                {scenarios.map((scenario, index) => (
                  <motion.div
                    key={scenario.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 + 0.3 }}
                    onClick={() => {
                      audioManager.playClick();
                      setSelectedScenario(scenario);
                    }}
                    data-testid={`scenario-${scenario.id}`}
                    className={`cursor-pointer p-6 rounded-xl transition-all border-2 ${
                      selectedScenario?.id === scenario.id
                        ? 'bg-primary/10 border-primary shadow-[0_0_30px_rgba(234,179,8,0.3)]'
                        : 'bg-zinc-900/70 border-white/10 hover:bg-zinc-800/70 hover:border-white/20'
                    }`}
                  >
                    <h3 className="text-xl font-bold text-white mb-2 uppercase" style={{ fontFamily: '"Barlow Condensed", sans-serif' }}>
                      {language === 'pt' ? scenario.name_pt : scenario.name_en}
                    </h3>
                    <p className="text-sm text-slate-400 mb-3 leading-relaxed">
                      {language === 'pt' ? scenario.description_pt : scenario.description_en}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono uppercase tracking-widest text-slate-500">
                        {t('difficulty')}
                      </span>
                      <span className={`text-sm font-bold uppercase ${getDifficultyColor(scenario.difficulty)}`}>
                        {t(scenario.difficulty)}
                      </span>
                    </div>
                    <div className="mt-3 text-xs text-slate-500 font-mono">
                      {scenario.steps.length} {language === 'pt' ? 'etapas' : 'steps'}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Start Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center"
        >
          <button
            onClick={handleStart}
            disabled={!selectedScenario}
            data-testid="start-simulation-button"
            className="bg-primary text-black hover:bg-primary/90 h-14 px-8 py-3 rounded-md font-bold uppercase tracking-wider transition-all active:scale-95 shadow-[0_0_30px_rgba(234,179,8,0.4)] disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none flex items-center gap-3 mx-auto text-lg"
          >
            <Play className="w-6 h-6" fill="currentColor" />
            {t('startSimulation')}
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default MenuScreen;