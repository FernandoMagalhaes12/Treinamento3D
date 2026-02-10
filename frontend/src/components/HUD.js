import React from 'react';
import { Globe, Zap, Lock, Tag, DoorOpen, StopCircle, Wind } from 'lucide-react';
import useSimulationStore from '../store/simulationStore';
import { useTranslation } from '../utils/translations';
import audioManager from '../utils/audioManager';

const HUD = () => {
  const language = useSimulationStore(state => state.language);
  const setLanguage = useSimulationStore(state => state.setLanguage);
  const currentScenario = useSimulationStore(state => state.currentScenario);
  const currentStep = useSimulationStore(state => state.currentStep);
  const selectedTool = useSimulationStore(state => state.selectedTool);
  const setSelectedTool = useSimulationStore(state => state.setSelectedTool);
  const stepsPerformed = useSimulationStore(state => state.stepsPerformed);
  const t = useTranslation(language);

  if (!currentScenario) return null;

  const totalSteps = currentScenario.steps.length;
  const progress = (currentStep / totalSteps) * 100;

  const getToolIcon = (tool) => {
    const iconMap = {
      'power_off': Zap,
      'test_energy': Zap,
      'apply_lock': Lock,
      'apply_tag': Tag,
      'open_panel': DoorOpen,
      'stop_belt': StopCircle,
      'release_pressure': Wind
    };
    return iconMap[tool] || Zap;
  };

  const handleToolSelect = (tool) => {
    audioManager.playClick();
    setSelectedTool(selectedTool === tool ? null : tool);
  };

  return (
    <>
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 z-10 pointer-events-none">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Title */}
            <div className="pointer-events-auto">
              <h1 className="text-2xl md:text-3xl font-bold uppercase tracking-tight text-primary" style={{ fontFamily: '"Barlow Condensed", sans-serif' }}>
                {language === 'pt' ? currentScenario.name_pt : currentScenario.name_en}
              </h1>
              <p className="text-xs md:text-sm text-slate-400 mt-1 uppercase tracking-wider font-mono">
                {t('subtitle')}
              </p>
            </div>

            {/* Language Switcher */}
            <button
              onClick={() => {
                audioManager.playClick();
                setLanguage(language === 'pt' ? 'en' : 'pt');
              }}
              className="pointer-events-auto bg-zinc-950/70 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-lg hover:bg-white/10 transition-all flex items-center gap-2 text-sm font-mono uppercase"
            >
              <Globe className="w-4 h-4" />
              {language === 'pt' ? 'PT' : 'EN'}
            </button>
          </div>

          {/* Progress Bar */}
          <div className="mt-4 bg-zinc-950/70 backdrop-blur-xl border border-white/10 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono uppercase tracking-widest text-slate-400">{t('progress')}</span>
              <span className="text-sm font-bold text-primary">{currentStep} / {totalSteps}</span>
            </div>
            <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Instructions Sidebar */}
      <div className="absolute top-32 right-4 z-10 w-80 pointer-events-auto">
        <div className="bg-zinc-950/70 backdrop-blur-xl border border-white/10 rounded-xl p-6 shadow-2xl">
          <h3 className="text-xl font-semibold uppercase tracking-wide text-primary mb-4" style={{ fontFamily: '"Barlow Condensed", sans-serif' }}>
            {t('instructions')}
          </h3>
          <div className="space-y-3">
            {currentScenario.steps.map((step, index) => {
              const isCompleted = index < currentStep;
              const isCurrent = index === currentStep;
              const stepData = stepsPerformed[index];
              const isCorrect = stepData?.correct;

              return (
                <div
                  key={step}
                  className={`flex items-start gap-3 p-3 rounded-lg transition-all ${
                    isCompleted
                      ? isCorrect
                        ? 'bg-green-500/10 border border-green-500/30'
                        : 'bg-red-500/10 border border-red-500/30'
                      : isCurrent
                      ? 'bg-yellow-500/10 border border-yellow-500/50'
                      : 'bg-zinc-800/50 border border-zinc-700/50'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    isCompleted
                      ? isCorrect
                        ? 'bg-green-500 text-white'
                        : 'bg-red-500 text-white'
                      : isCurrent
                      ? 'bg-yellow-500 text-black'
                      : 'bg-zinc-700 text-slate-400'
                  }`}>
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-slate-200 leading-relaxed">
                      {t(`instructions_${step}`) !== `instructions_${step}` 
                        ? t(`instructions_${step}`)
                        : t(step)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tool Bar (Bottom) */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 pointer-events-auto">
        <div className="bg-zinc-950/80 backdrop-blur-xl border border-white/10 rounded-2xl p-4 shadow-2xl">
          <p className="text-xs font-mono uppercase tracking-widest text-slate-400 text-center mb-3">
            {t('tools')}
          </p>
          <div className="flex items-center gap-3">
            {currentScenario.steps.map((tool) => {
              const Icon = getToolIcon(tool);
              const isSelected = selectedTool === tool;
              
              return (
                <button
                  key={tool}
                  onClick={() => handleToolSelect(tool)}
                  data-testid={`tool-${tool}`}
                  className={`w-14 h-14 rounded-xl border-2 transition-all flex flex-col items-center justify-center active:scale-90 ${
                    isSelected
                      ? 'bg-primary/20 border-primary shadow-[0_0_20px_rgba(234,179,8,0.5)]'
                      : 'bg-black/40 border-white/10 hover:bg-white/10 hover:border-primary/50'
                  }`}
                  title={t(tool)}
                >
                  <Icon className={`w-6 h-6 ${isSelected ? 'text-primary' : 'text-slate-300'}`} />
                  <span className="text-[8px] mt-1 font-mono uppercase tracking-wider">
                    {t(tool).slice(0, 4)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Helper Tooltip */}
      {!selectedTool && currentStep === 0 && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
          <div className="bg-primary text-black px-4 py-2 rounded-lg text-sm font-bold uppercase animate-pulse">
            {t('selectTool')}
          </div>
        </div>
      )}
    </>
  );
};

export default HUD;