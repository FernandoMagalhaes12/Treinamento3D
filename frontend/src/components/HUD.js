import React, { useState, useEffect, useRef } from 'react';
import { Globe, Zap, Lock, Tag, DoorOpen, StopCircle, Wind, FileText, CheckCircle, UserPlus, ClipboardList, Shield, AlertTriangle, Activity, Power } from 'lucide-react';
import useSimulationStore from '../store/simulationStore';
import { useShallow } from 'zustand/react/shallow';
import { useTranslation } from '../utils/translations';
import audioManager from '../utils/audioManager';
import Multimeter from './Multimeter';
import InstructionsSidebar from './hud/InstructionsSidebar';
import GameOverOverlay from './hud/GameOverOverlay';
import MatrixWarningModal from './hud/MatrixWarningModal';
import TransferConfirmModal from './hud/TransferConfirmModal';
import EquipmentConfirmModal from './hud/EquipmentConfirmModal';
import OperationalStateModal from './hud/OperationalStateModal';
import GeneratorEnergyModal from './hud/GeneratorEnergyModal';
import TagReadOnlyModal from './hud/TagReadOnlyModal';
import TagFormModal from './hud/TagFormModal';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogAction,
  AlertDialogCancel,
} from './ui/alert-dialog';

const LOTO_TOOLS = [
  'certify_stop',
  'consult_matrix',
  'execute_lockout',
  'eliminate_residual_energy',
  'deliver_tag_lock',
  'confirm_operational_state',
  'test_effectiveness',
  'request_release',
  'fill_tag_confirming'
];

const EMPTY_TAG_DATA = {
  tagNumber: '',
  blockerName: '',
  company: '',
  dateTime: ''
};

const normalizeEquipmentTag = (tag) =>
  String(tag || '').toUpperCase().replace(/\s+/g, '').replace(/^TAG/, 'TAG');

const buildEquipmentTagOptions = (correctTag) => {
  const randomTags = [];

  // Extract prefix (letters) and number from the tag
  const match = correctTag.match(/^([A-Za-z]*)(\d*)$/);
  const prefix = match ? match[1] : '';
  const numPart = match ? match[2] : '001';
  const numLength = numPart.length || 1;
  const baseNum = parseInt(numPart, 10) || 1;

  // Generate 3 similar tags by changing nearby values.
  const offsets = [
    Math.floor(Math.random() * 20) - 10,
    Math.floor(Math.random() * 20) - 10,
    Math.floor(Math.random() * 20) - 10,
  ];

  offsets.forEach((offset) => {
    const newNum = Math.max(0, baseNum + offset);
    const newNumStr = newNum.toString().padStart(numLength, '0');
    const newTag = prefix + newNumStr;
    if (newTag !== correctTag && !randomTags.includes(newTag)) {
      randomTags.push(newTag);
    }
  });

  // If we couldn't generate enough unique tags, add fallback nearby values.
  while (randomTags.length < 3) {
    const newNum = Math.max(0, baseNum + randomTags.length + 1);
    const newNumStr = newNum.toString().padStart(numLength, '0');
    const newTag = prefix + newNumStr;
    if (newTag !== correctTag && !randomTags.includes(newTag)) {
      randomTags.push(newTag);
    } else {
      const altNum = Math.max(0, baseNum - randomTags.length - 1);
      const altNumStr = altNum.toString().padStart(numLength, '0');
      const altTag = prefix + altNumStr;
      if (altTag !== correctTag && !randomTags.includes(altTag)) {
        randomTags.push(altTag);
      }
    }
  }

  return [...randomTags, correctTag].sort(() => Math.random() - 0.5);
};

const createEmptyTagData = () => ({ ...EMPTY_TAG_DATA });

const HUD = () => {
  const [showConfirmMessage, setShowConfirmMessage] = useState(false);
  const [showLockAppliedMessage, setShowLockAppliedMessage] = useState(false);
  const [showResidualEnergyMessage, setShowResidualEnergyMessage] = useState(false);
  const [showTagConfirmMessage, setShowTagConfirmMessage] = useState(false);
  const [showOperationalStateConfirm, setShowOperationalStateConfirm] = useState(false);
  const [panelEnergyZero, setPanelEnergyZero] = useState(null);
  const [generatorStopped, setGeneratorStopped] = useState(null);
  const [showMatrixWarning, setShowMatrixWarning] = useState(false);
  const [showTagForm, setShowTagForm] = useState(false);
  const [tagFormSubmitted, setTagFormSubmitted] = useState(false);
  const [showTransferConfirm, setShowTransferConfirm] = useState(false);
  
  // State for equipment confirmation popup
  const [showEquipmentConfirmPopup, setShowEquipmentConfirmPopup] = useState(false);
  const [equipmentConfirmOptions, setEquipmentConfirmOptions] = useState([]);
  const [selectedEquipmentTag, setSelectedEquipmentTag] = useState(null);
  const {
    showTagPopup,
    setShowTagPopup,
    showGeneratorEnergyPopup,
    setShowGeneratorEnergyPopup,
    tagData,
    setTagData,
    language,
    setLanguage,
    currentScenario,
    currentStep,
    selectedTool,
    setSelectedTool,
    stepsPerformed,
    isPowerOff,
    powerOffConfirmed,
    lockApplied,
    performStep,
    setLockApplied,
    setTagApplied,
    stopCertified,
    gateUnlockDialogOpen,
    closeGateUnlockDialog,
    unlockGeneratorGate,
    gameOver,
    triggerGameOver,
  } = useSimulationStore(
    useShallow((state) => ({
      showTagPopup: state.showTagPopup,
      setShowTagPopup: state.setShowTagPopup,
      showGeneratorEnergyPopup: state.showGeneratorEnergyPopup,
      setShowGeneratorEnergyPopup: state.setShowGeneratorEnergyPopup,
      tagData: state.tagData,
      setTagData: state.setTagData,
      language: state.language,
      setLanguage: state.setLanguage,
      currentScenario: state.currentScenario,
      currentStep: state.currentStep,
      selectedTool: state.selectedTool,
      setSelectedTool: state.setSelectedTool,
      stepsPerformed: state.stepsPerformed,
      isPowerOff: state.isPowerOff,
      powerOffConfirmed: state.powerOffConfirmed,
      lockApplied: state.lockApplied,
      performStep: state.performStep,
      setLockApplied: state.setLockApplied,
      setTagApplied: state.setTagApplied,
      stopCertified: state.stopCertified,
      gateUnlockDialogOpen: state.gateUnlockDialogOpen,
      closeGateUnlockDialog: state.closeGateUnlockDialog,
      unlockGeneratorGate: state.unlockGeneratorGate,
      gameOver: state.gameOver,
      triggerGameOver: state.triggerGameOver,
    }))
  );
  const [activeField, setActiveField] = useState(null);
  const timeoutRefs = useRef([]);
  
  const t = useTranslation(language);

  const queueTimeout = (callback, delay) => {
    const timeoutId = setTimeout(callback, delay);
    timeoutRefs.current.push(timeoutId);
    return timeoutId;
  };

  // Show matrix warning when scenario starts
  useEffect(() => {
    if (currentScenario) {
      setShowMatrixWarning(true);
      // Reset tag form when scenario changes
      setShowTagForm(false);
      setTagFormSubmitted(false);
      setTagData(createEmptyTagData());
    }
  }, [currentScenario, setTagData]);

  // Handle matrix warning continue button
  const handleMatrixWarningContinue = () => {
    setShowMatrixWarning(false);
    // Show tag form after matrix warning is closed - this is a separate step
    setShowTagForm(true);
  };

  // Monitor steps for incorrect actions and trigger game over effect
  useEffect(() => {
    if (stepsPerformed.length > 0) {
      const lastStep = stepsPerformed[stepsPerformed.length - 1];
      if (lastStep && lastStep.correct === false) {
        // Play shock sound and show game over effect
        audioManager.playShock();
        triggerGameOver(2000);
      }
    }
  }, [stepsPerformed, triggerGameOver]);

  useEffect(() => {
    return () => {
      timeoutRefs.current.forEach(clearTimeout);
      timeoutRefs.current = [];
    };
  }, []);

  // Handle tag form submit
  const handleTagFormSubmit = () => {
    // Validate that date is in correct format (DD/MM/AAAA HH:MM)
    const dateRegex = /^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/;
    
    if (tagData.tagNumber && tagData.blockerName && tagData.company && tagData.dateTime && dateRegex.test(tagData.dateTime)) {
      setShowTagForm(false);
      setTagFormSubmitted(true);
      setActiveField(null);
      // Don't call performStep - this popup is just for data entry, not part of the scoring process
      // The user can fill it or not, it doesn't affect the process progress
    }
  };

  // Handle tag form cancel
  const handleTagFormCancel = () => {
    setShowTagForm(false);
    setActiveField(null);
  };

  // Handle transfer confirmation
  const handleTransferConfirm = () => {
    setShowTransferConfirm(false);
    // Clear tag data and reopen form for new blocker
    setTagData(createEmptyTagData());
    setTagFormSubmitted(false);
    setShowTagForm(true);
  };

  const handleTransferCancel = () => {
    setShowTransferConfirm(false);
  };

  const handleKeyPress = (key) => {
    if (!activeField) return;
    
    // Special handling for dateTime field - auto-add slashes and format
    if (activeField === 'dateTime') {
      const current = tagData.dateTime;
      
      // Handle backspace - remove last character
      if (key === 'backspace') {
        if (current.length > 0) {
          setTagData(prev => ({...prev, [activeField]: current.slice(0, -1)}));
        }
        return;
      }
      
      // Handle clear - reset field
      if (key === 'clear') {
        setTagData(prev => ({...prev, [activeField]: ''}));
        return;
      }
      
      // Only allow numbers
      if (!/^\d$/.test(key)) return;
      
      // Count actual digits (excluding slashes, spaces, colons)
      const digitCount = current.replace(/[^0-9]/g, '').length;
      
      // Limit: 8 digits for date (DD/MM/AAAA), 4 digits for time (HH:MM) = 12 total
      if (digitCount >= 12) return;
      
      let newValue = current + key;
      
      // Auto-add separators based on digit count:
      // - After 2 digits: / (day -> month)
      // - After 4 digits: / (month -> year)
      // - After 8 digits: space (date -> time)
      // - After 10 digits: : (hour -> minute)
      const newDigitCount = digitCount + 1;
      
      if (newDigitCount === 2) newValue += '/';
      else if (newDigitCount === 4) newValue += '/';
      else if (newDigitCount === 8) newValue += ' ';
      else if (newDigitCount === 10) newValue += ':';
      
      setTagData(prev => ({...prev, [activeField]: newValue}));
      return;
    }
    
    if (key === 'backspace') {
      setTagData(prev => ({
        ...prev,
        [activeField]: prev[activeField].slice(0, -1)
      }));
    } else if (key === 'space') {
      setTagData(prev => ({
        ...prev,
        [activeField]: prev[activeField] + ' '
      }));
    } else if (key === 'clear') {
      setTagData(prev => ({
        ...prev,
        [activeField]: ''
      }));
    } else {
      setTagData(prev => ({
        ...prev,
        [activeField]: prev[activeField] + key
      }));
    }
  };

  // Show confirmation message briefly when power is turned off
  useEffect(() => {
    if (isPowerOff && !powerOffConfirmed) {
      setShowConfirmMessage(true);
      const timer = setTimeout(() => setShowConfirmMessage(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isPowerOff, powerOffConfirmed]);

  if (!currentScenario) return null;

  const totalSteps = currentScenario.steps.length;
  const progress = totalSteps > 0 ? (currentStep / totalSteps) * 100 : 0;

  const getToolIcon = (tool) => {
    // LOTO 9-step icon mapping
    const iconMap = {
      // Original tools
      'power_off': Zap,
      'test_energy': Zap,
      'apply_lock': Lock,
      'apply_tag': Tag,
      'open_panel': DoorOpen,
      'stop_belt': StopCircle,
      'release_pressure': Wind,
      // LOTO 9-step new tools (in order)
      'certify_stop': Activity,
      'consult_matrix': ClipboardList,
      'execute_lockout': Shield,
      'eliminate_residual_energy': Zap,
      'deliver_tag_lock': Lock,
      'confirm_operational_state': CheckCircle,
      'test_effectiveness': AlertTriangle,
      'request_release': FileText,
      'fill_tag_confirming': Tag,
      // Legacy mappings for compatibility
      'identification': UserPlus,
      'confirm_equipment_state': CheckCircle,
      'fill_tag': ClipboardList,
      // Generator energy check
      'check_generator_energy': Power
    };
    return iconMap[tool] || Zap;
  };

  // Handle equipment tag selection
  const handleEquipmentTagSelect = (selectedTag) => {
    if (!tagData.tagNumber?.trim()) {
      setShowEquipmentConfirmPopup(false);
      setShowTagForm(true);
      return;
    }
    const correctTag = normalizeEquipmentTag(tagData.tagNumber);
    const normalizedSelected = normalizeEquipmentTag(selectedTag);
    
    if (normalizedSelected === correctTag) {
      // Correct tag - validate the step (consult_matrix - instruction 2)
      performStep('consult_matrix');
      setShowEquipmentConfirmPopup(false);
      setSelectedEquipmentTag(null);
    } else {
      // Wrong tag - trigger game over
      setShowEquipmentConfirmPopup(false);
      audioManager.playShock();
      triggerGameOver(2000);
      queueTimeout(() => setSelectedEquipmentTag(null), 2000);
    }
  };
  // It shows the certification status but doesn't perform any action
  const handleGeneratorEnergyCheck = () => {
    audioManager.playClick();
    
    // Just show the confirmation message - this button is now just informational
    // It tells the user about the stop certification status
    setShowGeneratorEnergyPopup(true);
    queueTimeout(() => {
      setShowGeneratorEnergyPopup(false);
      setShowConfirmMessage(true);
      queueTimeout(() => setShowConfirmMessage(false), 2000);
    }, 500);
  };

  const handleToolSelect = (tool) => {
    audioManager.playClick();

    // Reset operational state answers
    setPanelEnergyZero(null);
    setGeneratorStopped(null);
    
    // Special handling for LOTO 12-step tools
    // Order: certify_stop (1), consult_matrix (2), execute_lockout (3), eliminate_residual_energy (4), deliver_tag_lock (5), confirm_operational_state (6), test_effectiveness (7), request_release (8), fill_tag_confirming (9)
    if (LOTO_TOOLS.includes(tool)) {
      // Special handling for consult_matrix (2nd icon) - show TAG selection popup
      if (tool === 'consult_matrix') {
        if (!tagData.tagNumber?.trim()) {
          setShowTagForm(true);
          setSelectedTool(null);
          return;
        }
        setEquipmentConfirmOptions(buildEquipmentTagOptions(tagData.tagNumber));
        setSelectedEquipmentTag(null);
        setShowEquipmentConfirmPopup(true);
        setSelectedTool(null);
        return;
      }

      // Special handling for identification (index 0) - when stop is certified, show message only
      // This icon is now just informational after stop is certified
      if ((tool === 'identification' || tool === 'consult_matrix') && 
          stopCertified) {
        // Show "PARADA CERTIFICADA!" message with CONTINUE button
        setShowGeneratorEnergyPopup(true);
        return;
      }
      
      // Special handling: If trying to deliver tag/lock but stop is not certified yet
      // and power is off, show "PARADA CERTIFICADA!" message instead of error
      // Note: execute_lockout now works directly without this restriction
      if ((tool === 'deliver_tag_lock' || tool === 'fill_tag') && 
          isPowerOff && !stopCertified) {
        // Show message that stop must be certified first
        setShowGeneratorEnergyPopup(true);
        queueTimeout(() => {
          setShowGeneratorEnergyPopup(false);
          setShowConfirmMessage(true);
          queueTimeout(() => setShowConfirmMessage(false), 2000);
        }, 500);
        setSelectedTool(null);
        return;
      }
      
      // Special handling for execute_lockout - apply lock directly without restrictions
      if (tool === 'execute_lockout') {
        performStep(tool);
        setLockApplied(true);
        // Show confirmation message
        setShowLockAppliedMessage(true);
        queueTimeout(() => setShowLockAppliedMessage(false), 2000);
        setSelectedTool(null);
        return;
      }
      
      // Special handling: deliver_tag_lock - open read-only tag popup and validate there
      if (tool === 'deliver_tag_lock') {
        if (!tagData.tagNumber?.trim()) {
          setShowTagForm(true);
          setSelectedTool(null);
          return;
        }
        setShowTagPopup(true);
        setSelectedTool(null);
        return;
      }

      // Special handling: confirm_operational_state - show message to verify panel
      if (tool === 'confirm_operational_state') {
        // Show instruction message first
        setShowTagConfirmMessage(true);
        queueTimeout(() => {
          setShowTagConfirmMessage(false);
          // Then show the confirmation popup
          setShowOperationalStateConfirm(true);
        }, 3000);
        setSelectedTool(null);
        return;
      }
      
      // Special handling: set tagApplied when fill_tag_confirming is performed
      if (tool === 'fill_tag_confirming') {
        setTagApplied(true);
      }
      
      // Special handling for eliminate_residual_energy - show message and validate step
      if (tool === 'eliminate_residual_energy') {
        performStep(tool);
        // Show confirmation message
        setShowResidualEnergyMessage(true);
        queueTimeout(() => setShowResidualEnergyMessage(false), 2000);
        setSelectedTool(null);
        return;
      }
      
      // For LOTO steps that don't have special handling, perform the step directly
      performStep(tool);
      
      setSelectedTool(null);
      return;
    }
    
    // Original tool handling
    // Special handling for power_off confirmation
    if (tool === 'power_off' && isPowerOff && !powerOffConfirmed) {
      // Confirm power off
      performStep('power_off');
      setSelectedTool(null);
      return;
    }
    
    // Special handling for apply_lock - apply lock to panel
    if (tool === 'apply_lock' && isPowerOff && powerOffConfirmed) {
      // Apply lock and confirm step
      performStep('apply_lock');
      setSelectedTool(null);
      return;
    }
    
    // For testing: apply lock immediately when clicked
    if (tool === 'apply_lock') {
      setLockApplied(true);
      performStep('apply_lock');
      setSelectedTool(null);
      // Show temporary message
      setShowLockAppliedMessage(true);
      queueTimeout(() => setShowLockAppliedMessage(false), 2000);
      return;
    }
    
    // Special handling for apply_tag - apply tag to panel
    if (tool === 'apply_tag' && isPowerOff && powerOffConfirmed && lockApplied) {
      // Apply tag and confirm step
      performStep('apply_tag');
      setSelectedTool(null);
      return;
    }
    
    // For testing: apply tag immediately when clicked
    if (tool === 'apply_tag') {
      setTagApplied(true);
      performStep('apply_tag');
      setSelectedTool(null);
      return;
    }
    
    setSelectedTool(selectedTool === tool ? null : tool);
  };

  return (
    <>
      {/* Generator gate padlock confirmation */}
      <AlertDialog
        open={Boolean(gateUnlockDialogOpen)}
        onOpenChange={(open) => {
          if (!open) closeGateUnlockDialog();
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {language === 'pt' ? 'Deseja retirar o cadeado?' : 'Remove the padlock?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {language === 'pt'
                ? 'O portão da cerca está trancado. Quer remover o cadeado para poder abrir?' 
                : 'The fence gate is locked. Do you want to remove the padlock so you can open it?'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{language === 'pt' ? 'Não' : 'No'}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                unlockGeneratorGate();
              }}
            >
              {language === 'pt' ? 'Sim' : 'Yes'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Top Bar - Minimal */}
      <div className="absolute top-0 left-0 right-0 z-10 pointer-events-none p-4">
        <div className="flex items-center justify-between">
          {/* Tag Data (shown only after submission). Scenario title removed. */}
          {tagFormSubmitted ? (
            <div className="pointer-events-auto bg-zinc-950/70 backdrop-blur-xl border border-white/10 px-4 py-2 rounded-lg">
              <div className="flex flex-col gap-1">
                <span className="text-lg font-bold text-white">
                  TAG: {tagData.tagNumber}
                </span>
                <span className="text-sm text-white">
                  Bloqueador: {tagData.blockerName}
                </span>
                <span className="text-sm text-white">
                  Empresa: {tagData.company}
                </span>
                <span className="text-sm text-white">
                  Data: {tagData.dateTime}
                </span>
                {/* Transferência de Bloqueio Button */}
                <button
                  onClick={() => setShowTransferConfirm(true)}
                  className="mt-2 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded transition-all text-sm"
                >
                  {language === 'pt' ? 'TRANSFERÊNCIA DE BLOQUEIO' : 'LOCKOUT TRANSFER'}
                </button>
              </div>
            </div>
          ) : (
            <div />
          )}

          {/* Language Switcher */}
          <button
            onClick={() => {
              audioManager.playClick();
              setLanguage(language === 'pt' ? 'en' : 'pt');
            }}
            className="pointer-events-auto bg-zinc-950/70 backdrop-blur-xl border border-white/10 px-3 py-2 rounded-lg hover:bg-white/10 transition-all flex items-center gap-2 text-sm font-mono uppercase"
          >
            <Globe className="w-4 h-4" />
            {language === 'pt' ? 'PT' : 'EN'}
          </button>
        </div>

        {/* Progress Bar removed */}
      </div>

      <InstructionsSidebar
        currentScenario={currentScenario}
        currentStep={currentStep}
        stepsPerformed={stepsPerformed}
        t={t}
      />

      {/* Tool Bar - Compact */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 pointer-events-auto">
        <div className="bg-zinc-950/80 backdrop-blur-xl border border-white/10 rounded-xl px-4 py-2 shadow-2xl flex items-center gap-2">
          {/* Multimeter Button - Always visible for testing energy */}
          <button
            onClick={() => {
              audioManager.playClick();
              setSelectedTool(selectedTool === 'test_energy' ? null : 'test_energy');
            }}
            data-testid="tool-test_energy"
            className={`w-10 h-10 rounded-lg border transition-all flex items-center justify-center active:scale-90 ${
              selectedTool === 'test_energy'
                ? 'bg-yellow-500/30 border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.7)]'
                : 'bg-black/40 border-white/10 hover:bg-white/10'
            }`}
            title={t('testEnergy') || 'Testar Energia'}
          >
            <Zap className={`w-5 h-5 ${selectedTool === 'test_energy' ? 'text-yellow-400' : 'text-slate-300'}`} />
          </button>
          
          {currentScenario.steps.map((tool, index) => {
            // Replace certify_stop with generator energy check button
            if (tool === 'certify_stop') {
              // Get step status
              const stepCompleted = stepsPerformed.some(s => s.step_name === tool);
              const isCurrentStep = index === currentStep;
              const isCertifyStopConfirmation = isPowerOff && !stopCertified;
              
              return (
                <button
                  key={tool}
                  onClick={handleGeneratorEnergyCheck}
                  data-testid="tool-check_generator_energy"
                  className={`w-10 h-10 rounded-lg border transition-all flex items-center justify-center active:scale-90 ${
                    stepCompleted
                      ? 'bg-yellow-500/30 border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.7)]'
                      : isCertifyStopConfirmation
                      ? 'bg-yellow-500/30 border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.7)] animate-pulse'
                      : isCurrentStep
                      ? 'bg-blue-500/30 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.7)]'
                      : 'bg-black/40 border-white/10 hover:bg-white/10'
                  }`}
                  title="Verificar Energia do Gerador"
                >
                  <Power className={`w-5 h-5 ${stepCompleted || isCertifyStopConfirmation ? 'text-yellow-400' : isCurrentStep ? 'text-blue-400' : 'text-slate-300'}`} />
                </button>
              );
            }
            
            const Icon = getToolIcon(tool);
            const isSelected = selectedTool === tool;
            
            // Check if this step is already completed
            const stepCompleted = stepsPerformed.some(s => s.step_name === tool);
            
            // Check if this is the current step
            const isCurrentStep = index === currentStep;
            
            // Check if this is certify_stop confirmation state
            const isCertifyStopConfirmation = tool === 'certify_stop' && isPowerOff && !stopCertified;
            
            return (
              <button
                key={tool}
                onClick={() => handleToolSelect(tool)}
                data-testid={`tool-${tool}`}
                className={`w-10 h-10 rounded-lg border transition-all flex items-center justify-center active:scale-90 ${
                  isSelected || stepCompleted
                    ? 'bg-yellow-500/30 border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.7)]'
                    : isCertifyStopConfirmation
                    ? 'bg-yellow-500/30 border-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.7)] animate-pulse'
                    : isCurrentStep && !stepCompleted
                    ? 'bg-blue-500/30 border-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.7)]'
                    : 'bg-black/40 border-white/10 hover:bg-white/10'
                }`}
                title={isCertifyStopConfirmation ? t('confirmPowerOff') : t(tool)}
              >
                <Icon className={`w-5 h-5 ${
                  isSelected || stepCompleted || isCertifyStopConfirmation ? 'text-yellow-400' : isCurrentStep ? 'text-blue-400' : 'text-slate-300'
                }`} />
              </button>
            );
          })}
        </div>
      </div>

      {/* Helper Tooltip */}
      {!selectedTool && currentStep === 0 && !isPowerOff && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
          <div className="bg-primary text-black px-4 py-2 rounded-lg text-sm font-bold uppercase animate-pulse">
            {t('selectTool')}
          </div>
        </div>
      )}

      {/* Power Off Confirmation Tooltip - Temporary */}
      {showConfirmMessage && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
          <div className="bg-yellow-500 text-black px-4 py-2 rounded-lg text-sm font-bold uppercase animate-pulse">
            {stopCertified ? 'PARADA CERTIFICADA!' : t('confirmPowerOff')}
          </div>
        </div>
      )}

      {/* Maintenance Complete Tooltip */}
      {isPowerOff && powerOffConfirmed && currentStep >= totalSteps && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
          <div className="bg-green-500 text-black px-4 py-2 rounded-lg text-sm font-bold uppercase animate-pulse">
            {t('maintenanceComplete')}
          </div>
        </div>
      )}

      {/* Lock Applied Message - Temporary */}
      {showLockAppliedMessage && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
          <div className="bg-green-500 text-black px-4 py-2 rounded-lg text-sm font-bold uppercase animate-pulse">
            ✓ CADEADO APLICADO
          </div>
        </div>
      )}

      {/* Residual Energy Eliminated Message - Temporary */}
      {showResidualEnergyMessage && (
        <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
          <div className="bg-orange-500 text-black px-4 py-2 rounded-lg text-sm font-bold uppercase animate-pulse">
            ✓ ENERGIA RESIDUAL ELIMINADA
          </div>
        </div>
      )}

      {/* Tag Confirm Instruction Message - Temporary */}
      {showTagConfirmMessage && (
        <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
          <div className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-bold uppercase animate-pulse">
            ➤ CLIQUE NO CADEADO E ETIQUETA NO PAINEL
          </div>
        </div>
      )}

      {/* Multimeter Display */}
      {selectedTool === 'test_energy' && (
        <Multimeter />
      )}

      <MatrixWarningModal
        show={showMatrixWarning}
        language={language}
        onContinue={handleMatrixWarningContinue}
      />

      <TagFormModal
        show={showTagForm}
        tagData={tagData}
        setTagData={setTagData}
        activeField={activeField}
        setActiveField={setActiveField}
        handleKeyPress={handleKeyPress}
        onCancel={handleTagFormCancel}
        onSubmit={handleTagFormSubmit}
      />

      <TransferConfirmModal
        show={showTransferConfirm}
        language={language}
        onCancel={handleTransferCancel}
        onConfirm={handleTransferConfirm}
      />

      <TagReadOnlyModal
        show={showTagPopup}
        tagData={tagData}
        onClose={() => setShowTagPopup(false)}
        onProceed={() => {
          performStep('deliver_tag_lock');
          setShowTagPopup(false);
        }}
      />

      <OperationalStateModal
        show={showOperationalStateConfirm}
        panelEnergyZero={panelEnergyZero}
        generatorStopped={generatorStopped}
        setPanelEnergyZero={setPanelEnergyZero}
        setGeneratorStopped={setGeneratorStopped}
        onBack={() => {
          setShowOperationalStateConfirm(false);
          setPanelEnergyZero(null);
          setGeneratorStopped(null);
        }}
        onProceed={() => {
          if (panelEnergyZero === true && generatorStopped === true) {
            performStep('confirm_operational_state');
            setShowOperationalStateConfirm(false);
            setPanelEnergyZero(null);
            setGeneratorStopped(null);
          } else {
            audioManager.playShock();
            triggerGameOver(2000);
          }
        }}
      />

      <GeneratorEnergyModal
        show={showGeneratorEnergyPopup}
        isPowerOff={isPowerOff}
        stopCertified={stopCertified}
        currentStep={currentStep}
        onContinue={() => {
          setShowGeneratorEnergyPopup(false);
          setSelectedTool(null);
        }}
      />

      <EquipmentConfirmModal
        show={showEquipmentConfirmPopup}
        options={equipmentConfirmOptions}
        selectedTag={selectedEquipmentTag}
        onSelect={handleEquipmentTagSelect}
        onClose={() => setShowEquipmentConfirmPopup(false)}
      />

      {gameOver && <GameOverOverlay />}
    </>
  );
};

export default React.memo(HUD);
