import React from 'react';
import { Activity } from 'lucide-react';

const EquipmentConfirmModal = ({ show, options, selectedTag, onSelect, onClose }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ backgroundColor: 'rgba(0, 0, 0, 0.8)' }}>
      <div className="rounded-lg shadow-2xl max-w-md mx-4 overflow-hidden border-4 border-blue-500" style={{ backgroundColor: '#ffffff' }}>
        <div className="bg-blue-600 p-4 flex items-center justify-center gap-4">
          <Activity className="w-10 h-10 text-white" />
          <span className="text-white font-black text-2xl tracking-wider">CONFIRMAR EQUIPAMENTO</span>
        </div>

        <div className="p-6 bg-white text-center">
          <div className="text-xl font-bold text-gray-800 mb-6">Selecione a TAG correta:</div>

          <div className="space-y-3">
            {options.map((tag, index) => (
              <button
                key={index}
                onClick={() => onSelect(tag)}
                className={`w-full py-4 px-6 rounded-lg text-xl font-bold border-4 transition-all cursor-pointer ${
                  selectedTag === tag
                    ? 'border-green-600 bg-green-200 text-green-800'
                    : 'border-gray-500 bg-gray-100 hover:border-blue-600 hover:bg-blue-100 text-gray-800'
                }`}
                style={{ display: 'block', minHeight: '50px' }}
              >
                {tag}
              </button>
            ))}
          </div>

          <button
            onClick={onClose}
            className="mt-4 w-full py-3 px-6 rounded-lg text-lg font-bold border-4 border-gray-400 bg-gray-200 hover:border-gray-600 hover:bg-gray-300 text-gray-700 transition-all cursor-pointer"
          >
            {'<-'} Voltar
          </button>
        </div>
      </div>
    </div>
  );
};

export default EquipmentConfirmModal;
