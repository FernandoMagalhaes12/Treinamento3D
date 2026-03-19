import React from 'react';
import { CheckCircle } from 'lucide-react';

const OperationalStateModal = ({
  show,
  panelEnergyZero,
  generatorStopped,
  setPanelEnergyZero,
  setGeneratorStopped,
  onBack,
  onProceed,
}) => {
  if (!show) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-2xl max-w-lg mx-4 overflow-hidden" style={{ border: '4px solid #3B82F6' }}>
        <div className="bg-blue-600 p-4 flex items-center justify-center gap-4">
          <CheckCircle className="w-10 h-10 text-white" />
          <span className="text-white font-black text-2xl tracking-wider">CONFIRMAR ESTADO OPERACIONAL</span>
        </div>

        <div className="p-6 bg-white">
          <div className="space-y-6">
            <div className="border-2 border-gray-300 rounded p-4">
              <p className="font-bold text-black mb-3">Painel Eletrico Energia 0?</p>
              <div className="flex gap-4">
                <button
                  onClick={() => setPanelEnergyZero(true)}
                  className={`flex-1 py-2 px-4 rounded font-bold transition-all ${panelEnergyZero === true ? 'bg-green-500 text-black' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                  SIM
                </button>
                <button
                  onClick={() => setPanelEnergyZero(false)}
                  className={`flex-1 py-2 px-4 rounded font-bold transition-all ${panelEnergyZero === false ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                  NAO
                </button>
              </div>
            </div>

            <div className="border-2 border-gray-300 rounded p-4">
              <p className="font-bold text-black mb-3">Gerador Desligado Partes Moveis Paradas?</p>
              <div className="flex gap-4">
                <button
                  onClick={() => setGeneratorStopped(true)}
                  className={`flex-1 py-2 px-4 rounded font-bold transition-all ${generatorStopped === true ? 'bg-green-500 text-black' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                  SIM
                </button>
                <button
                  onClick={() => setGeneratorStopped(false)}
                  className={`flex-1 py-2 px-4 rounded font-bold transition-all ${generatorStopped === false ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                >
                  NAO
                </button>
              </div>
            </div>
          </div>

          <div className="flex gap-4 mt-6">
            <button
              onClick={onBack}
              className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded transition-all"
            >
              VOLTAR
            </button>
            <button
              onClick={onProceed}
              className="flex-1 bg-green-500 hover:bg-green-400 text-black font-bold py-2 px-4 rounded transition-all"
            >
              PROSSEGUIR
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OperationalStateModal;
