import React from 'react';
import { Power } from 'lucide-react';

const GeneratorEnergyModal = ({ show, isPowerOff, stopCertified, currentStep, onContinue }) => {
  if (!show) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className={`rounded-lg shadow-2xl max-w-md mx-4 overflow-hidden border-4 ${isPowerOff ? 'border-green-500' : 'border-red-600'}`}>
        <div className={`${isPowerOff ? 'bg-green-600' : 'bg-red-600'} p-4 flex items-center justify-center gap-4`}>
          <Power className="w-10 h-10 text-white" />
          <span className="text-white font-black text-2xl tracking-wider">
            {isPowerOff ? 'GERADOR DESENERGIZADO' : 'GERADOR ENERGIZADO'}
          </span>
        </div>

        <div className="p-6 bg-white text-center">
          {stopCertified ? (
            <>
              <div className="text-3xl font-bold text-green-600 mb-4">✓ PARADA CERTIFICADA!</div>
              <div className="text-gray-600 mb-6">
                A parada do gerador foi certificada com sucesso. Voce pode prosseguir para as proximas etapas do procedimento LOTO.
              </div>
              <button
                onClick={onContinue}
                className="bg-green-600 hover:bg-green-500 text-white font-bold py-3 px-8 rounded-lg text-xl transition-all"
              >
                CONTINUAR
              </button>
            </>
          ) : (
            <>
              <div className={`text-2xl font-bold ${isPowerOff ? 'text-green-600' : 'text-red-600'}`}>
                {isPowerOff ? '✓ PODE PROSSEGUIR' : '✗ PERIGO - ENERGIA PRESENTE'}
              </div>
              <div className="mt-4 text-gray-600">
                {isPowerOff
                  ? 'O disjuntor principal esta DESLIGADO. O gerador esta sem energia.'
                  : 'O disjuntor principal esta LIGADO. O gerador esta energizado.'}
              </div>

              {currentStep === 5 && (
                <div className={`mt-4 p-3 rounded ${isPowerOff ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                  {isPowerOff ? '✓ Etapa 6 validada com sucesso!' : '✗ ERRO! O gerador deve estar desenergizado!'}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default GeneratorEnergyModal;
