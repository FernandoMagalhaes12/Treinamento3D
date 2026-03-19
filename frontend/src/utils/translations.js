export const translations = {
  pt: {
    // Menu
    title: 'Treinamento LOTO 3D',
    subtitle: 'Sistema de Bloqueio e Sinalização',
    selectScenario: 'Selecione um Cenário',
    startSimulation: 'Iniciar Simulação',
    difficulty: 'Dificuldade',
    easy: 'Fácil',
    medium: 'Médio',
    hard: 'Difícil',

    // HUD
    progress: 'Progresso',
    step: 'Etapa',
    of: 'de',
    instructions: 'Instruções',
    selectTool: 'Selecione uma ferramenta e clique no ponto de interação',
    clickHotspot: 'Clique nos pontos amarelos para interagir',
    confirmPowerOff: 'CONFIRME: Clique no ícone de raio para confirmar desligamento',
    maintenanceComplete: 'Manutenção completa! Pode religar o disjuntor',
    
    // Tools - LOTO 9-step procedure (NR10)
    tools: 'Ferramentas',
    // Legacy tool names (for compatibility)
    power_off: 'Certificar Parada',
    test_energy: 'Testar Energia',
    apply_lock: 'Aplicar Cadeado',
    apply_tag: 'Aplicar Etiqueta',
    open_panel: 'Abrir Painel',
    stop_belt: 'Parar Esteiras',
    release_pressure: 'Liberar Pressão',
    // Current LOTO 9-step tools (in order from backend)
    identification: 'Certificar Parada',
    consult_matrix: 'Confirmar Equipamento',
    execute_lockout: 'Executar Bloqueio',
    eliminate_residual_energy: 'Eliminar Energia Residual',
    deliver_tag_lock: 'Confirmar Etiqueta',
    certify_stop: 'Certificar Parada',
    confirm_operational_state: 'Confirmar Estado Operacional',
    test_effectiveness: 'Testar Efetividade',
    request_release: 'Solicitar Liberação',
    fill_tag_confirming: 'Confirmar Manutenção',
    confirm_equipment_state: 'Testar Efetividade',

    // Feedback
    correct: 'Correto!',
    incorrect: 'Atenção!',
    correctMessage: 'Etapa executada corretamente',
    incorrectMessage: 'Esta etapa está fora de ordem. Continue, mas isso será registrado.',
    
    // Results
    simulationComplete: 'Simulação Completa',
    yourScore: 'Sua Pontuação',
    correctSteps: 'Etapas Corretas',
    incorrectSteps: 'Etapas Incorretas',
    safetyViolations: 'Violações de Segurança',
    noViolations: 'Nenhuma violação! Excelente trabalho!',
    accidentWarning: '⚠️ ACIDENTE SIMULADO',
    accidentMessage: 'Você não seguiu o procedimento correto de LOTO. Em uma situação real, isso poderia resultar em ferimentos graves ou morte.',
    tryAgain: 'Tentar Novamente',
    backToMenu: 'Voltar ao Menu',

    // Instructions per step - LOTO 9-step (NR10)
    instructions_certify_stop: '1. CERTIFICAR PARADA: Certifique a parada do equipamento e modo local',
    instructions_consult_matrix: '2. CONFIRMAR EQUIPAMENTO: Confirme o equipamento correto a ser bloqueado (TAG)',
    instructions_execute_lockout: '3. EXECUTAR BLOQUEIO: Execute a manobra de bloqueio e instale cadeado + etiqueta',
    instructions_eliminate_residual_energy: '4. ELIMINAR ENERGIA RESIDUAL: Elimine energia residual e impeça reacúmulo',
    instructions_deliver_tag_lock: '5. CONFIRMAR ETIQUETA: Preencha a etiqueta confirmando bloqueio e devolva chave ao solicitante',
    instructions_confirm_operational_state: '6. CONFIRMAR ESTADO OPERACIONAL: Confirme estado operacional com o operador',
    instructions_test_effectiveness: '7. TESTAR EFETIVIDADE: Execute o teste de efetividade do bloqueio',
    instructions_request_release: '8. SOLICITAR LIBERAÇÃO: Solicite liberação para manutenção',
    instructions_fill_tag_confirming: '9. CONFIRMAR MANUTENÇÃO: Confirme a conclusão da manutenção',
    // Legacy instruction keys (for compatibility)
    instructions_power_off: '1. CERTIFICAR PARADA: Certifique a parada do equipamento e modo local',
    instructions_test_energy: '2. TESTAR ENERGIA: Teste a presença de energia nos pontos de medição',
    instructions_apply_lock: '3. APLICAR CADEADO: Aplique o cadeado no ponto de bloqueio',
    instructions_apply_tag: '4. APLICAR ETIQUETA: Aplique a etiqueta de identificação',
    instructions_open_panel: '5. ABRIR PAINEL: Abra o painel de acesso para manutenção',
    instructions_stop_belt: '6. PARAR ESTEIRAS: Confirme a parada das esteiras',
    instructions_release_pressure: '7. LIBERAR PRESSÃO: Libere a pressão residual dos sistemas',
  },
  en: {
    // Menu
    title: 'LOTO 3D Training',
    subtitle: 'Lockout/Tagout System',
    selectScenario: 'Select a Scenario',
    startSimulation: 'Start Simulation',
    difficulty: 'Difficulty',
    easy: 'Easy',
    medium: 'Medium',
    hard: 'Hard',

    // HUD
    progress: 'Progress',
    step: 'Step',
    of: 'of',
    instructions: 'Instructions',
    selectTool: 'Select a tool and click on the interaction point',
    clickHotspot: 'Click on yellow points to interact',
    confirmPowerOff: 'CONFIRM: Click on the lightning icon to confirm power off',
    maintenanceComplete: 'Maintenance complete! You can turn the breaker back on',

    // Tools - LOTO 9-step procedure (NR10)
    tools: 'Tools',
    // Legacy tool names (for compatibility)
    power_off: 'Certify Stop',
    test_energy: 'Test Energy',
    apply_lock: 'Apply Lock',
    apply_tag: 'Apply Tag',
    open_panel: 'Open Panel',
    stop_belt: 'Stop Belt',
    release_pressure: 'Release Pressure',
    // Current LOTO 9-step tools (in order from backend)
    identification: 'Certify Stop',
    consult_matrix: 'Confirm Equipment',
    execute_lockout: 'Execute Lockout',
    eliminate_residual_energy: 'Eliminate Residual Energy',
    deliver_tag_lock: 'Confirm Tag',
    certify_stop: 'Certify Stop',
    confirm_operational_state: 'Confirm Operational State',
    test_effectiveness: 'Test Effectiveness',
    request_release: 'Request Release',
    fill_tag_confirming: 'Confirm Maintenance',
    confirm_equipment_state: 'Test Effectiveness',

    // Feedback
    correct: 'Correct!',
    incorrect: 'Warning!',
    correctMessage: 'Step performed correctly',
    incorrectMessage: 'This step is out of order. Continue, but this will be recorded.',

    // Results
    simulationComplete: 'Simulation Complete',
    yourScore: 'Your Score',
    correctSteps: 'Correct Steps',
    incorrectSteps: 'Incorrect Steps',
    safetyViolations: 'Safety Violations',
    noViolations: 'No violations! Excellent work!',
    accidentWarning: '⚠️ SIMULATED ACCIDENT',
    accidentMessage: 'You did not follow the correct LOTO procedure. In a real situation, this could result in serious injury or death.',
    tryAgain: 'Try Again',
    backToMenu: 'Back to Menu',

    // Instructions per step - LOTO 9-step (NR10)
    instructions_certify_stop: '1. CERTIFY STOP: Certify equipment stop and local mode',
    instructions_consult_matrix: '2. CONFIRM EQUIPMENT: Confirm correct equipment to be locked (TAG)',
    instructions_execute_lockout: '3. EXECUTE LOCKOUT: Execute lockout procedure and install lock + tag',
    instructions_eliminate_residual_energy: '4. ELIMINATE RESIDUAL ENERGY: Eliminate residual energy and prevent accumulation',
    instructions_deliver_tag_lock: '5. CONFIRM TAG: Fill tag confirming lockout and return key to requester',
    instructions_confirm_operational_state: '6. CONFIRM OPERATIONAL STATE: Confirm operational state with operator',
    instructions_test_effectiveness: '7. TEST EFFECTIVENESS: Execute lockout effectiveness test',
    instructions_request_release: '8. REQUEST RELEASE: Request release for maintenance',
    instructions_fill_tag_confirming: '9. CONFIRM MAINTENANCE: Confirm maintenance completion',
    // Legacy instruction keys (for compatibility)
    instructions_power_off: '1. CERTIFY STOP: Certify equipment stop and local mode',
    instructions_test_energy: '2. TEST ENERGY: Test for presence of energy at measurement points',
    instructions_apply_lock: '3. APPLY LOCK: Apply lock at the lockout point',
    instructions_apply_tag: '4. APPLY TAG: Apply identification tag',
    instructions_open_panel: '5. OPEN PANEL: Open access panel for maintenance',
    instructions_stop_belt: '6. STOP BELT: Confirm belt system has stopped',
    instructions_release_pressure: '7. RELEASE PRESSURE: Release residual pressure from systems',
  }
};

export const useTranslation = (language) => {
  // Default to Portuguese if language is not valid
  const validLanguage = (language === 'pt' || language === 'en') ? language : 'pt';
  
  return (key) => {
    try {
      const langTranslations = translations[validLanguage];
      if (langTranslations && langTranslations[key]) {
        return langTranslations[key];
      }
      // Fallback to English
      const enTranslations = translations['en'];
      if (enTranslations && enTranslations[key]) {
        return enTranslations[key];
      }
      // Return key if not found
      return key;
    } catch (e) {
      console.error('Translation error:', e);
      return key;
    }
  };
};
