import React from 'react';

const TagReadOnlyModal = ({ show, tagData, onClose, onProceed }) => {
  if (!show) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-2xl max-w-lg mx-4 overflow-hidden" onClick={(e) => e.stopPropagation()} style={{ border: '4px solid #FACC15' }}>
        <div className="bg-black p-4 flex items-center justify-center gap-4">
          <div className="relative w-12 h-10">
            <svg viewBox="0 0 24 24" className="w-full h-full">
              <path d="M12 2L2 22h20L12 2z" fill="#DC2626" />
              <path d="M12 8v4M12 15v1" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <span className="text-red-600 font-black text-2xl tracking-wider">PERIGO</span>
        </div>

        <div className="bg-red-600 text-white text-center py-2 font-bold text-sm">
          EQUIPAMENTO EM MANUTENCAO NAO REMOVA ESTE DISPOSITIVO DE BLOQUEIO
        </div>

        <div className="p-6 bg-white">
          <div className="space-y-4">
            <div className="flex items-center border-2 border-gray-300 rounded p-2 bg-gray-100">
              <label className="font-bold text-black w-32">TAG:</label>
              <span className="flex-1 text-black">{tagData.tagNumber || '(Nao preenchido)'}</span>
            </div>
            <div className="flex items-center border-2 border-gray-300 rounded p-2 bg-gray-100">
              <label className="font-bold text-black w-32">Bloqueador por:</label>
              <span className="flex-1 text-black">{tagData.blockerName || '(Nao preenchido)'}</span>
            </div>
            <div className="flex items-center border-2 border-gray-300 rounded p-2 bg-gray-100">
              <label className="font-bold text-black w-32">Empresa:</label>
              <span className="flex-1 text-black">{tagData.company || '(Nao preenchido)'}</span>
            </div>
            <div className="flex items-center border-2 border-gray-300 rounded p-2 bg-gray-100">
              <label className="font-bold text-black w-32">Data e hora:</label>
              <span className="flex-1 text-black">{tagData.dateTime || '(Nao preenchido)'}</span>
            </div>
          </div>

          <div className="flex gap-4 mt-6">
            <button
              onClick={onClose}
              className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded transition-all"
            >
              VOLTAR
            </button>
            <button
              onClick={onProceed}
              className="flex-1 bg-green-500 hover:bg-green-400 text-black font-bold py-2 px-4 rounded transition-all"
            >
              SEGUIR
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TagReadOnlyModal;
