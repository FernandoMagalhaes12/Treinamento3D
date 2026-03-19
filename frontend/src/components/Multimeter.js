import React, { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import useSimulationStore from '../store/simulationStore';

const Multimeter = () => {
  const {
    isPowerOff,
    powerOffConfirmed,
    testedBreaker,
    stopCertified,
    leftSwitches,
    rightSwitches,
    setSelectedTool,
    setTestedBreaker,
    performStep,
  } = useSimulationStore(
    useShallow((state) => ({
      isPowerOff: state.isPowerOff,
      powerOffConfirmed: state.powerOffConfirmed,
      testedBreaker: state.testedBreaker,
      stopCertified: state.stopCertified,
      leftSwitches: state.leftSwitches,
      rightSwitches: state.rightSwitches,
      setSelectedTool: state.setSelectedTool,
      setTestedBreaker: state.setTestedBreaker,
      performStep: state.performStep,
    }))
  );

  const safeLeftSwitches = useMemo(() => (
    leftSwitches && Array.isArray(leftSwitches) ? leftSwitches : [true, true, true, true]
  ), [leftSwitches]);
  const safeRightSwitches = useMemo(() => (
    rightSwitches && Array.isArray(rightSwitches) ? rightSwitches : [true, true, true, true]
  ), [rightSwitches]);

  const leftVoltages = useMemo(() => ['220V', '220V', '220V', '127V'], []);
  const rightVoltages = useMemo(() => ['220V', '220V', '220V', '127V'], []);
  
  // Auto-validate certify_stop when testing main/gerador with 0V (breaker is OFF)
  // This certifies that the machine is truly stopped - you turn off the breaker and confirm 0V
  React.useEffect(() => {
    if ((testedBreaker === 'gerador' || testedBreaker === 'main') && isPowerOff && !stopCertified) {
      // When testing main/gerador and power is off (0V), automatically validate certify_stop
      const timer = setTimeout(() => {
        performStep('certify_stop');
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [testedBreaker, isPowerOff, stopCertified, performStep]);
  
  // Calculate which voltage to show based on tested breaker
  const getVoltage = () => {
    // Se nenhum breaker está sendo testado, mostra 380V (entrada principal)
    if (!testedBreaker) {
      return isPowerOff ? '0' : '380';
    }
    
    // Parse breaker name (e.g., "main", "gerador", "left_0", "right_0")
    // Main e gerador mostram 380V quando a energia está ligada (isPowerOff false ou powerOffConfirmed true)
    if (testedBreaker === 'main' || testedBreaker === 'gerador') {
      // Mostrar 380V se: energy is ON (isPowerOff false) OR confirmed (green light)
      const isEnergyOn = !isPowerOff || powerOffConfirmed;
      return isEnergyOn ? '380' : '0';
    }
    
    const [side, index] = testedBreaker.split('_');
    const idx = parseInt(index);
    
    if (side === 'left') {
      // Check if main is off or individual breaker is off
      if (isPowerOff || !safeLeftSwitches[idx]) {
        return '0';
      }
      return leftVoltages[idx].replace('V', '');
    } else if (side === 'right') {
      // Check if main is off or individual breaker is off
      if (isPowerOff || !safeRightSwitches[idx]) {
        return '0';
      }
      return rightVoltages[idx].replace('V', '');
    }
    
    return '0';
  };
  
  // Handle close - just close the multimeter without registering any step
  const handleClose = () => {
    setSelectedTool(null);
    setTestedBreaker(null);
  };
  
  const handleBreakerClick = (breakerName) => {
    // Only allow testing if power is on or we're testing individual breakers
    if (!testedBreaker || testedBreaker !== breakerName) {
      setTestedBreaker(breakerName);
    }
  };
  
  const voltage = getVoltage();
  const isTesting = testedBreaker !== null;
  
  return (
    <div className="fixed bottom-32 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
      {/* Multimeter Body */}
      <div className="bg-yellow-100 rounded-xl border-4 border-yellow-600 shadow-2xl p-4 w-72 pointer-events-auto">
        {/* Display */}
        <div className="bg-green-900 rounded-lg p-3 mb-3 border-2 border-green-700">
          <div className="flex items-center justify-center gap-2">
            <span className="text-red-500 font-mono text-3xl font-bold">{voltage}</span>
            <span className="text-red-500 font-mono text-lg">V</span>
          </div>
          <div className="text-yellow-400 text-xs font-mono text-center mt-1">
            {isTesting ? `TESTANDO: ${testedBreaker === 'main' || testedBreaker === 'gerador' ? 'DISJUNTOR PRINCIPAL' : testedBreaker.toUpperCase().replace('_', ' ')}` : 'AC VOLTS - CLIQUE NO DISJUNTOR'}
          </div>
        </div>

        {/* Selector Dial */}
        <div className="flex justify-center mb-3">
          <div className="relative w-20 h-20">
            <div className="absolute inset-0 rounded-full bg-gray-800 border-4 border-gray-600 flex items-center justify-center">
              <div 
                className="w-1 h-8 bg-red-500 absolute top-2 origin-bottom"
                style={{ transform: isPowerOff ? 'rotate(0deg)' : 'rotate(-45deg)' }}
              />
              <div className="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center">
                <span className="text-white text-xs font-bold">{isPowerOff ? 'OFF' : 'V~'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Wire Indicators */}
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-red-600"></div>
            <span className="text-xs font-bold text-red-600">V</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded-full bg-black"></div>
            <span className="text-xs font-bold text-black">COM</span>
          </div>
        </div>

        {/* Status */}
        <div className={`text-center text-xs font-bold mt-2 px-2 py-1 rounded ${
          isTesting 
            ? (parseInt(voltage) > 0 ? 'bg-red-500 text-white animate-pulse' : 'bg-green-500 text-white')
            : 'bg-blue-500 text-white'
        }`}>
          {isTesting 
            ? (parseInt(voltage) > 0 ? `ENERGIA: ${voltage}V detected!` : 'SEM ENERGIA DETECTADA')
            : 'SELECIONE UM DISJUNTOR PARA TESTAR'
          }
        </div>

        {/* Info Message - Shows when energy is confirmed to be off */}
        {isTesting && parseInt(voltage) === 0 && isPowerOff && (
          <div className="mt-2 text-center text-xs text-green-600 font-bold">
            ✓ SEM ENERGIA - PODE PROSSEGUIR
          </div>
        )}
        
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="w-full mt-2 bg-gray-500 hover:bg-gray-400 text-white font-bold py-2 px-4 rounded-lg transition-all"
        >
          FECHAR
        </button>
        
        {/* Instructions */}
        <div className="text-xs text-gray-500 mt-2 text-center">
          Clique em qualquer disjuntor no painel para testar
        </div>
      </div>
    </div>
  );
};

export default React.memo(Multimeter);
