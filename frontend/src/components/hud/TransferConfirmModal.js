import React from 'react';

const TransferConfirmModal = ({ show, language, onCancel, onConfirm }) => {
  if (!show) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-white/20 rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
        <h2 className="text-xl font-bold text-white mb-4 text-center">
          {language === 'pt' ? 'TRANSFERENCIA DE BLOQUEIO' : 'LOCKOUT TRANSFER'}
        </h2>
        <p className="text-white text-center mb-6">
          {language === 'pt'
            ? 'Voce tem certeza que deseja realizar a transferencia de bloqueio?'
            : 'Are you sure you want to perform the lockout transfer?'}
        </p>
        <div className="flex gap-4">
          <button
            onClick={onCancel}
            className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded transition-all"
          >
            {language === 'pt' ? 'Nao' : 'No'}
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded transition-all"
          >
            {language === 'pt' ? 'Sim' : 'Yes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransferConfirmModal;
