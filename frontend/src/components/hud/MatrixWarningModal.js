import React from 'react';
import { ClipboardList } from 'lucide-react';

const MatrixWarningModal = ({ show, language, onContinue }) => {
  if (!show) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-yellow-500/50 rounded-2xl p-8 max-w-md mx-4 shadow-2xl animate-in fade-in zoom-in duration-300">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center">
            <ClipboardList className="w-6 h-6 text-yellow-500" />
          </div>
          <h2 className="text-xl font-bold text-white" style={{ fontFamily: '"Barlow Condensed", sans-serif' }}>
            {language === 'pt' ? 'CONSULTA A MATRIZ DE BLOQUEIO' : 'LOCKOUT MATRIX CONSULTATION'}
          </h2>
        </div>
        <p className="text-zinc-300 text-lg mb-8 leading-relaxed">
          {language === 'pt'
            ? 'Por favor, verifique a matriz de bloqueio do equipamento em questao, identificando energias, pontos de bloqueio e energias residuais.'
            : 'Please check the equipment lockout matrix, identifying energies, lockout points, and residual energies.'}
        </p>
        <button
          onClick={onContinue}
          className="w-full bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-3 px-6 rounded-xl transition-all active:scale-95 uppercase tracking-wide"
        >
          {language === 'pt' ? 'Continuar' : 'Continue'}
        </button>
      </div>
    </div>
  );
};

export default MatrixWarningModal;
