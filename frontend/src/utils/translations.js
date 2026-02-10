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
    
    // Tools
    tools: 'Ferramentas',
    power_off: 'Desligar Painel',
    test_energy: 'Testar Energia',
    apply_lock: 'Aplicar Cadeado',
    apply_tag: 'Aplicar Etiqueta',
    open_panel: 'Abrir Compartimento',
    stop_belt: 'Parar Esteira',
    release_pressure: 'Liberar Pressão',

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

    // Instructions per step
    instructions_power_off: '1. Desligue o painel elétrico principal',
    instructions_test_energy: '2. Teste a ausência de energia com o testador',
    instructions_apply_lock: '3. Aplique o cadeado no painel',
    instructions_apply_tag: '4. Coloque a etiqueta de identificação',
    instructions_open_panel: '5. Abra o compartimento para manutenção',
    instructions_stop_belt: '1. Pare a esteira transportadora',
    instructions_release_pressure: '2. Libere a pressão do sistema',
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

    // Tools
    tools: 'Tools',
    power_off: 'Power Off Panel',
    test_energy: 'Test Energy',
    apply_lock: 'Apply Lock',
    apply_tag: 'Apply Tag',
    open_panel: 'Open Panel',
    stop_belt: 'Stop Belt',
    release_pressure: 'Release Pressure',

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

    // Instructions per step
    instructions_power_off: '1. Turn off the main electrical panel',
    instructions_test_energy: '2. Test for absence of energy with tester',
    instructions_apply_lock: '3. Apply padlock to the panel',
    instructions_apply_tag: '4. Place identification tag',
    instructions_open_panel: '5. Open compartment for maintenance',
    instructions_stop_belt: '1. Stop the conveyor belt',
    instructions_release_pressure: '2. Release system pressure',
  }
};

export const useTranslation = (language) => {
  return (key) => translations[language][key] || key;
};