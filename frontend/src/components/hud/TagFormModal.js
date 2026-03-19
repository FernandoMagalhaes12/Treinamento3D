import React from 'react';

const TagFormModal = ({
  show,
  tagData,
  setTagData,
  activeField,
  setActiveField,
  handleKeyPress,
  onCancel,
  onSubmit,
}) => {
  if (!show) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-white rounded-lg shadow-2xl max-w-lg mx-4 overflow-hidden" style={{ border: '4px solid #FACC15' }}>
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
            <div className={`flex items-center border-2 rounded p-2 ${activeField === 'tagNumber' ? 'border-yellow-400 bg-yellow-50' : 'border-gray-300'}`}>
              <label className="font-bold text-black w-32">TAG:</label>
              <input
                type="text"
                value={tagData.tagNumber}
                onChange={(e) => setTagData({ ...tagData, tagNumber: e.target.value })}
                onFocus={() => setActiveField('tagNumber')}
                className="flex-1 text-black outline-none bg-transparent"
                placeholder="Digite aqui..."
              />
            </div>

            <div className={`flex items-center border-2 rounded p-2 ${activeField === 'blockerName' ? 'border-yellow-400 bg-yellow-50' : 'border-gray-300'}`}>
              <label className="font-bold text-black w-32">Bloqueador por:</label>
              <input
                type="text"
                value={tagData.blockerName}
                onChange={(e) => setTagData({ ...tagData, blockerName: e.target.value })}
                onFocus={() => setActiveField('blockerName')}
                className="flex-1 text-black outline-none bg-transparent"
                placeholder="Digite aqui..."
              />
            </div>

            <div className={`flex items-center border-2 rounded p-2 ${activeField === 'company' ? 'border-yellow-400 bg-yellow-50' : 'border-gray-300'}`}>
              <label className="font-bold text-black w-32">Empresa:</label>
              <input
                type="text"
                value={tagData.company}
                onChange={(e) => setTagData({ ...tagData, company: e.target.value })}
                onFocus={() => setActiveField('company')}
                className="flex-1 text-black outline-none bg-transparent"
                placeholder="Digite aqui..."
              />
            </div>

            <div className={`flex items-center border-2 rounded p-2 ${activeField === 'dateTime' ? 'border-yellow-400 bg-yellow-50' : 'border-gray-300'}`}>
              <label className="font-bold text-black w-32">Data e hora:</label>
              <input
                type="text"
                value={tagData.dateTime}
                onChange={(e) => {
                  let value = e.target.value.replace(/[^0-9]/g, '');
                  let formatted = '';
                  let digitCount = 0;

                  for (let i = 0; i < value.length; i++) {
                    const char = value[i];
                    if (digitCount === 2 && formatted.length > 0 && !formatted.includes('/')) {
                      formatted += '/';
                    }
                    if (digitCount === 4 && formatted.length > 0) {
                      const slashes = (formatted.match(/\//g) || []).length;
                      if (slashes < 2) formatted += '/';
                    }
                    if (digitCount === 8 && !formatted.includes(' ')) {
                      formatted += ' ';
                    }
                    if (digitCount === 10 && !formatted.includes(':')) {
                      formatted += ':';
                    }

                    formatted += char;
                    digitCount++;

                    if (digitCount >= 12) break;
                  }

                  setTagData({ ...tagData, dateTime: formatted });
                }}
                onFocus={() => setActiveField('dateTime')}
                onKeyDown={(e) => {
                  if (e.key === 'Backspace') {
                    e.preventDefault();
                    handleKeyPress('backspace');
                  }
                }}
                className="flex-1 text-black outline-none bg-transparent"
                placeholder="DD/MM/AAAA HH:MM"
                inputMode="numeric"
              />
            </div>
          </div>

          {activeField && (
            <div className="mt-4 bg-gray-800 p-3 rounded-lg">
              <div className="text-white text-xs mb-2 font-bold">
                Tecle em: {activeField === 'tagNumber' ? 'TAG' : activeField === 'blockerName' ? 'Bloqueador por' : activeField === 'company' ? 'Empresa' : 'Data e hora'}
              </div>
              <div className="grid grid-cols-10 gap-1 mb-2">
                {'ABCDEFGHIJ'.split('').map((letter) => (
                  <button
                    key={letter}
                    onClick={() => handleKeyPress(letter)}
                    className="bg-gray-600 hover:bg-gray-500 text-white rounded py-2 text-sm font-bold"
                  >
                    {letter}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-10 gap-1 mb-2">
                {'KLMNOPQRST'.split('').map((letter) => (
                  <button
                    key={letter}
                    onClick={() => handleKeyPress(letter)}
                    className="bg-gray-600 hover:bg-gray-500 text-white rounded py-2 text-sm font-bold"
                  >
                    {letter}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-10 gap-1 mb-2">
                {'UVWXYZ'.split('').map((letter) => (
                  <button
                    key={letter}
                    onClick={() => handleKeyPress(letter)}
                    className="bg-gray-600 hover:bg-gray-500 text-white rounded py-2 text-sm font-bold"
                  >
                    {letter}
                  </button>
                ))}
                <button
                  onClick={() => handleKeyPress('space')}
                  className="bg-gray-600 hover:bg-gray-500 text-white rounded py-2 text-sm font-bold col-span-4"
                >
                  ESPACO
                </button>
              </div>
              <div className="grid grid-cols-10 gap-1">
                {'1234567890'.split('').map((n) => (
                  <button
                    key={n}
                    onClick={() => handleKeyPress(n)}
                    className="bg-blue-600 hover:bg-blue-500 text-white rounded py-2 text-sm font-bold"
                  >
                    {n}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <button
                  onClick={() => handleKeyPress('backspace')}
                  className="bg-red-600 hover:bg-red-500 text-white rounded py-2 text-sm font-bold"
                >
                  APAGAR
                </button>
                <button
                  onClick={() => handleKeyPress('clear')}
                  className="bg-yellow-600 hover:bg-yellow-500 text-white rounded py-2 text-sm font-bold"
                >
                  LIMPAR
                </button>
              </div>
            </div>
          )}

          <div className="flex gap-4 mt-6">
            <button
              onClick={onCancel}
              className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded transition-all"
            >
              Cancelar
            </button>
            <button
              onClick={onSubmit}
              className="flex-1 bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded transition-all"
            >
              Confirmar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TagFormModal;
