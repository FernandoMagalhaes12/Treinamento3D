import React from 'react';

const InstructionsSidebar = ({ currentScenario, currentStep, stepsPerformed, t }) => {
  return (
    <div className="absolute top-32 right-4 z-10 w-64 pointer-events-auto">
      <div className="bg-zinc-950/70 backdrop-blur-xl border border-white/10 rounded-xl p-4 shadow-2xl max-h-[60vh] overflow-y-auto">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-primary mb-3" style={{ fontFamily: '"Barlow Condensed", sans-serif' }}>
          {t('instructions')}
        </h3>
        <div className="space-y-2">
          {currentScenario.steps.map((step, index) => {
            const isCompleted = index < currentStep;
            const isCurrent = index === currentStep;
            const stepData = stepsPerformed[index];
            const isCorrect = stepData?.correct;

            return (
              <div
                key={step}
                className={`flex items-start gap-2 p-2 rounded-lg transition-all text-xs ${
                  isCompleted
                    ? isCorrect
                      ? 'bg-green-500/10 border border-green-500/30'
                      : 'bg-red-500/10 border border-red-500/30'
                    : isCurrent
                    ? 'bg-yellow-500/10 border border-yellow-500/50'
                    : 'bg-zinc-800/50 border border-zinc-700/50'
                }`}
              >
                <div className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
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
                  <p className="text-slate-200 leading-tight">
                    {(() => {
                      const instructionKey = `instructions_${step}`;
                      const translated = t(instructionKey);
                      if (translated === instructionKey) {
                        return t(step);
                      }
                      return translated;
                    })()}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default InstructionsSidebar;
