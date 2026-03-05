// Servicio de almacenamiento usando LocalStorage
import type { User, TestResult, Theme, Test, Question, StudentStats, ThemeStat } from '@/types';

const STORAGE_KEYS = {
  USERS: 'autoescuela_users',
  CURRENT_USER: 'autoescuela_current_user',
  TEST_RESULTS: 'autoescuela_results',
  THEMES: 'autoescuela_themes',
  TESTS: 'autoescuela_tests',
  QUESTIONS: 'autoescuela_questions',
};

// ============== USUARIOS ==============

export const getUsers = (): User[] => {
  const data = localStorage.getItem(STORAGE_KEYS.USERS);
  return data ? JSON.parse(data) : [];
};

export const saveUser = (user: User): void => {
  const users = getUsers();
  const existingIndex = users.findIndex(u => u.id === user.id);
  
  if (existingIndex >= 0) {
    users[existingIndex] = user;
  } else {
    users.push(user);
  }
  
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
};

export const deleteUser = (userId: string): void => {
  const users = getUsers().filter(u => u.id !== userId);
  localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
};

export const findUserByUsername = (username: string): User | undefined => {
  return getUsers().find(u => u.username === username);
};

export const findUserById = (id: string): User | undefined => {
  return getUsers().find(u => u.id === id);
};

// ============== SESIÓN ==============

export const getCurrentUser = (): User | null => {
  const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
  return data ? JSON.parse(data) : null;
};

export const setCurrentUser = (user: User | null): void => {
  if (user) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
  } else {
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  }
};

// ============== TEMAS ==============

export const getThemes = (includeInactive = false): Theme[] => {
  const data = localStorage.getItem(STORAGE_KEYS.THEMES);
  let themes: Theme[] = data ? JSON.parse(data) : [];
  
  // Si no hay temas, crear los por defecto
  if (themes.length === 0) {
    themes = getDefaultThemes();
    localStorage.setItem(STORAGE_KEYS.THEMES, JSON.stringify(themes));
  }
  
  if (!includeInactive) {
    themes = themes.filter(t => t.isActive !== false);
  }
  
  return themes;
};

export const saveTheme = (theme: Theme): void => {
  const themes = getThemes(true);
  const existingIndex = themes.findIndex(t => t.id === theme.id);
  
  theme.updatedAt = new Date().toISOString();
  
  if (existingIndex >= 0) {
    themes[existingIndex] = theme;
  } else {
    theme.createdAt = new Date().toISOString();
    themes.push(theme);
  }
  
  localStorage.setItem(STORAGE_KEYS.THEMES, JSON.stringify(themes));
};

export const deleteTheme = (themeId: string): void => {
  // Soft delete - marcar como inactivo
  const theme = getThemes(true).find(t => t.id === themeId);
  if (theme) {
    theme.isActive = false;
    theme.updatedAt = new Date().toISOString();
    saveTheme(theme);
  }
};

export const getThemeById = (themeId: string): Theme | undefined => {
  return getThemes(true).find(t => t.id === themeId);
};

// ============== PREGUNTAS ==============

export const getQuestions = (includeInactive = false): Question[] => {
  const data = localStorage.getItem(STORAGE_KEYS.QUESTIONS);
  let questions: Question[] = data ? JSON.parse(data) : [];
  
  // Si no hay preguntas, crear las por defecto
  if (questions.length === 0) {
    questions = getDefaultQuestions();
    localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(questions));
  }
  
  if (!includeInactive) {
    questions = questions.filter(q => q.isActive !== false);
  }
  
  return questions;
};

export const getQuestionsByTheme = (themeId: string, includeInactive = false): Question[] => {
  return getQuestions(includeInactive).filter(q => q.themeId === themeId);
};

export const getQuestionsByIds = (questionIds: string[], includeInactive = false): Question[] => {
  const questions = getQuestions(includeInactive);
  return questionIds.map(id => questions.find(q => q.id === id)).filter(Boolean) as Question[];
};

export const getQuestionById = (questionId: string): Question | undefined => {
  return getQuestions(true).find(q => q.id === questionId);
};

export const saveQuestion = (question: Question): void => {
  const questions = getQuestions(true);
  const existingIndex = questions.findIndex(q => q.id === question.id);
  
  question.updatedAt = new Date().toISOString();
  
  if (existingIndex >= 0) {
    questions[existingIndex] = question;
  } else {
    question.createdAt = new Date().toISOString();
    question.isActive = true;
    questions.push(question);
  }
  
  localStorage.setItem(STORAGE_KEYS.QUESTIONS, JSON.stringify(questions));
};

export const deleteQuestion = (questionId: string): void => {
  // Soft delete - marcar como inactivo
  const question = getQuestions(true).find(q => q.id === questionId);
  if (question) {
    question.isActive = false;
    question.updatedAt = new Date().toISOString();
    saveQuestion(question);
  }
};

// ============== TESTS ==============

export const getTests = (includeInactive = false): Test[] => {
  const data = localStorage.getItem(STORAGE_KEYS.TESTS);
  let tests: Test[] = data ? JSON.parse(data) : [];
  
  // Si no hay tests, crear los por defecto
  if (tests.length === 0) {
    tests = getDefaultTests();
    localStorage.setItem(STORAGE_KEYS.TESTS, JSON.stringify(tests));
  }
  
  if (!includeInactive) {
    tests = tests.filter(t => t.isActive !== false);
  }
  
  return tests;
};

export const getTestsByTheme = (themeId: string, includeInactive = false): Test[] => {
  return getTests(includeInactive).filter(t => t.themeId === themeId);
};

export const getTestById = (testId: string, includeInactive = false): Test | undefined => {
  return getTests(includeInactive).find(t => t.id === testId);
};

export const saveTest = (test: Test): void => {
  const tests = getTests(true);
  const existingIndex = tests.findIndex(t => t.id === test.id);
  
  test.updatedAt = new Date().toISOString();
  
  if (existingIndex >= 0) {
    tests[existingIndex] = test;
  } else {
    test.createdAt = new Date().toISOString();
    test.isActive = true;
    tests.push(test);
  }
  
  localStorage.setItem(STORAGE_KEYS.TESTS, JSON.stringify(tests));
};

export const deleteTest = (testId: string): void => {
  // Soft delete - marcar como inactivo
  const test = getTests(true).find(t => t.id === testId);
  if (test) {
    test.isActive = false;
    test.updatedAt = new Date().toISOString();
    saveTest(test);
  }
};

// Obtener test completo con preguntas resueltas
export const getTestWithQuestions = (testId: string, includeInactive = false): (Test & { questionData: Question[] }) | undefined => {
  const test = getTestById(testId, includeInactive);
  if (!test) return undefined;
  
  const questionData = getQuestionsByIds(test.questions, includeInactive);
  return { ...test, questionData };
};

// ============== RESULTADOS ==============

export const getTestResults = (): TestResult[] => {
  const data = localStorage.getItem(STORAGE_KEYS.TEST_RESULTS);
  return data ? JSON.parse(data) : [];
};

export const saveTestResult = (result: TestResult): void => {
  const results = getTestResults();
  results.push(result);
  localStorage.setItem(STORAGE_KEYS.TEST_RESULTS, JSON.stringify(results));
};

export const getUserResults = (userId: string): TestResult[] => {
  return getTestResults().filter(r => r.userId === userId);
};

export const getTestResultsByTestId = (testId: string): TestResult[] => {
  return getTestResults().filter(r => r.testId === testId);
};

// ============== ESTADÍSTICAS DE ESTUDIANTE ==============

export const getStudentStats = (userId: string): StudentStats | null => {
  const user = findUserById(userId);
  if (!user) return null;
  
  const results = getUserResults(userId);
  if (results.length === 0) {
    return {
      userId,
      userName: user.name,
      totalTests: 0,
      passedTests: 0,
      failedTests: 0,
      averageScore: 0,
      themeStats: [],
      weakAreas: [],
      strongAreas: [],
    };
  }
  
  const totalTests = results.length;
  const passedTests = results.filter(r => {
    const test = getTestById(r.testId, true);
    const passingScore = test?.passingScore || Math.ceil(r.totalQuestions * 0.7);
    return r.score >= passingScore;
  }).length;
  const failedTests = totalTests - passedTests;
  const averageScore = results.reduce((sum, r) => sum + (r.score / r.totalQuestions) * 100, 0) / totalTests;
  
  // Estadísticas por tema
  const themeStatsMap = new Map<string, ThemeStat>();
  
  results.forEach(result => {
    result.questionResults?.forEach(qr => {
      const existing = themeStatsMap.get(qr.themeId);
      if (existing) {
        existing.totalQuestions++;
        if (qr.isCorrect) {
          existing.correctAnswers++;
        } else {
          existing.incorrectAnswers++;
        }
      } else {
        themeStatsMap.set(qr.themeId, {
          themeId: qr.themeId,
          themeName: qr.themeName,
          totalQuestions: 1,
          correctAnswers: qr.isCorrect ? 1 : 0,
          incorrectAnswers: qr.isCorrect ? 0 : 1,
          errorRate: 0,
        });
      }
    });
  });
  
  // Calcular porcentajes de error
  const themeStats: ThemeStat[] = Array.from(themeStatsMap.values()).map(stat => ({
    ...stat,
    errorRate: Math.round((stat.incorrectAnswers / stat.totalQuestions) * 100),
  }));
  
  // Ordenar por tasa de error (descendente) para identificar áreas débiles
  themeStats.sort((a, b) => b.errorRate - a.errorRate);
  
  const weakAreas = themeStats.filter(s => s.errorRate > 30).map(s => s.themeId);
  const strongAreas = themeStats.filter(s => s.errorRate < 20).map(s => s.themeId);
  
  return {
    userId,
    userName: user.name,
    totalTests,
    passedTests,
    failedTests,
    averageScore: Math.round(averageScore),
    themeStats,
    weakAreas,
    strongAreas,
  };
};

// ============== DATOS POR DEFECTO ==============

function getDefaultThemes(): Theme[] {
  return [
    {
      id: 't1',
      title: 'Señales de Tráfico',
      description: 'Aprende todas las señales de tráfico y su significado',
      icon: 'traffic-cone',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 't2',
      title: 'Normas de Circulación',
      description: 'Reglas básicas y avanzadas de circulación vial',
      icon: 'route',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 't3',
      title: 'Seguridad Vial',
      description: 'Medidas de seguridad pasiva y activa',
      icon: 'shield-check',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 't4',
      title: 'Mecánica Básica',
      description: 'Conocimientos básicos del vehículo',
      icon: 'wrench',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 't5',
      title: 'Conducción Eficiente',
      description: 'Técnicas de conducción eficiente y respetuosa',
      icon: 'leaf',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
}

function getDefaultQuestions(): Question[] {
  const questions: Question[] = [];
  
  // Preguntas del tema 1 - Señales de Tráfico
  const t1Questions = [
    {
      id: 'q1',
      text: '¿Qué significa esta señal?',
      options: ['Prohibido el paso a vehículos de motor', 'Prohibido el paso a todos los vehículos', 'Prohibido el paso a peatones', 'Prohibido el paso a bicicletas'],
      correctAnswer: 0,
      explanation: 'La señal circular con fondo blanco y borde rojo indica prohibición. La silueta de un coche indica que está prohibido el paso a vehículos de motor.',
    },
    {
      id: 'q2',
      text: '¿Qué indica una señal de STOP?',
      options: ['Detenerse solo si viene tráfico', 'Detenerse obligatoriamente antes de continuar', 'Reducir la velocidad', 'Ceder el paso'],
      correctAnswer: 1,
      explanation: 'La señal de STOP es octogonal y roja. Obliga a detenerse completamente antes de continuar, independientemente del tráfico.',
    },
    {
      id: 'q3',
      text: '¿Qué significa una señal con el número 50 tachado?',
      options: ['Fin de velocidad mínima', 'Fin de velocidad máxima de 50 km/h', 'Velocidad máxima 50 km/h', 'Velocidad recomendada 50 km/h'],
      correctAnswer: 1,
      explanation: 'Una señal de velocidad tachada indica el fin de esa limitación de velocidad.',
    },
    {
      id: 'q4',
      text: '¿Qué significa una señal de ceda el paso?',
      options: ['Detenerse siempre', 'Ceder el paso a los vehículos de la vía transversal', 'Prioridad sobre los demás vehículos', 'Prohibido el paso'],
      correctAnswer: 1,
      explanation: 'La señal de ceda el paso (triángulo invertido con fondo blanco y borde rojo) obliga a ceder el paso a los vehículos que circulan por la vía transversal.',
    },
    {
      id: 'q5',
      text: '¿Qué indica una señal de prohibido adelantar?',
      options: ['No se puede adelantar a ningún vehículo', 'No se puede adelantar a vehículos de motor', 'No se puede ser adelantado', 'Zona de adelantamiento'],
      correctAnswer: 1,
      explanation: 'La señal de prohibido adelantar (dos coches, el de atrás en negro) prohíbe adelantar a vehículos de motor, pero sí se puede adelantar a bicicletas y ciclomotores.',
    },
    {
      id: 'q6',
      text: '¿Qué significa una señal de prohibido girar a la izquierda?',
      options: ['Solo se puede girar a la derecha', 'Está prohibido girar a la izquierda', 'Giro obligatorio a la derecha', 'Prohibido cambiar de dirección'],
      correctAnswer: 1,
      explanation: 'La señal muestra una flecha hacia la izquierda tachada, indicando que está prohibido girar en esa dirección.',
    },
    {
      id: 'q7',
      text: '¿Qué indica una señal de prohibido estacionar?',
      options: ['Prohibido parar y estacionar', 'Prohibido estacionar pero se puede parar', 'Zona de estacionamiento', 'Estacionamiento obligatorio'],
      correctAnswer: 1,
      explanation: 'La señal de prohibido estacionar (una P tachada en diagonal) prohíbe estacionar, pero permite parar para subir o bajar pasajeros.',
    },
    {
      id: 'q8',
      text: '¿Qué significa una señal de prohibido el paso a camiones?',
      options: ['Prohibido el paso a vehículos pesados', 'Prohibido el paso a vehículos de mercancías peligrosas', 'Zona de carga y descarga', 'Obligación de usar cadenas'],
      correctAnswer: 0,
      explanation: 'La señal con la silueta de un camión indica prohibición de paso a vehículos destinados al transporte de mercancías.',
    },
    {
      id: 'q9',
      text: '¿Qué indica una señal de velocidad máxima 90 km/h?',
      options: ['Velocidad recomendada', 'Velocidad mínima obligatoria', 'Velocidad máxima permitida', 'Velocidad media de la vía'],
      correctAnswer: 2,
      explanation: 'Las señales circulares con números indican velocidad máxima permitida en km/h.',
    },
    {
      id: 'q10',
      text: '¿Qué significa una señal de prohibido el paso a peatones?',
      options: ['Zona peatonal', 'Prohibido el paso a peatones', 'Pasos de peatones', 'Prioridad a peatones'],
      correctAnswer: 1,
      explanation: 'La señal con la silueta de una persona tachada indica que está prohibido el paso a peatones por esa vía.',
    },
  ];
  
  t1Questions.forEach(q => {
    questions.push({
      ...q,
      themeId: 't1',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  });
  
  // Preguntas del tema 2 - Normas de Circulación
  const t2Questions = [
    {
      id: 'q21',
      text: 'En una intersección sin señalizar, ¿quién tiene prioridad?',
      options: ['El vehículo que viene por la derecha', 'El vehículo que viene por la izquierda', 'El vehículo más grande', 'El vehículo que va más rápido'],
      correctAnswer: 0,
      explanation: 'En ausencia de señalización, rige la norma general de prioridad por la derecha.',
    },
    {
      id: 'q22',
      text: '¿Quién tiene prioridad en una glorieta?',
      options: ['El vehículo que entra', 'El vehículo que circula por ella', 'El vehículo más grande', 'El que tiene la preferencia señalizada'],
      correctAnswer: 1,
      explanation: 'En las glorietas, tienen prioridad los vehículos que ya circulan por ellas sobre los que intentan entrar.',
    },
    {
      id: 'q23',
      text: '¿Qué debe hacer ante una señal de STOP?',
      options: ['Reducir la velocidad', 'Detenerse completamente', 'Mirar y seguir si no viene nadie', 'Tocar la bocina'],
      correctAnswer: 1,
      explanation: 'La señal de STOP obliga a detenerse completamente, aunque no haya tráfico en la vía transversal.',
    },
    {
      id: 'q24',
      text: 'En una subida estrecha, ¿quién tiene prioridad?',
      options: ['El vehículo que sube', 'El vehículo que baja', 'El vehículo más grande', 'El que llegue primero'],
      correctAnswer: 0,
      explanation: 'En pendientes ascendentes estrechas, tiene prioridad el vehículo que sube, salvo que el que baje esté en un sitio de ensanche.',
    },
    {
      id: 'q25',
      text: '¿Quién tiene prioridad en un paso estrecho con señal de prioridad?',
      options: ['El vehículo que encuentra la señal cuadrada', 'El vehículo que encuentra la señal circular', 'El vehículo más pequeño', 'El vehículo que va más rápido'],
      correctAnswer: 0,
      explanation: 'La señal cuadrada indica que se tiene prioridad sobre el tráfico contrario. La circular indica que se debe ceder el paso.',
    },
    {
      id: 'q26',
      text: '¿Qué vehículo tiene prioridad en una intersección?',
      options: ['El autobús', 'El vehículo en situación más desfavorable', 'El vehículo que circula por carril con línea discontinua', 'El vehículo que circula por carril con línea continua'],
      correctAnswer: 2,
      explanation: 'Cuando dos vehículos se aproximan a una intersección por vías diferentes, tiene prioridad el que circule por la vía con línea discontinua sobre el que circule por la de línea continua.',
    },
    {
      id: 'q27',
      text: '¿Quién tiene prioridad en un paso de peatones?',
      options: ['Los vehículos', 'Los peatones', 'El que llegue primero', 'Los ciclistas'],
      correctAnswer: 1,
      explanation: 'Los peatones tienen prioridad de paso en los pasos señalizados para ellos.',
    },
    {
      id: 'q28',
      text: '¿Qué ocurre si llega un vehículo de emergencia con sirena?',
      options: ['Tiene prioridad sobre todos los demás', 'Debe esperar su turno', 'Solo tiene prioridad en autopista', 'Tiene prioridad solo si lleva luces encendidas'],
      correctAnswer: 0,
      explanation: 'Los vehículos de emergencia (ambulancia, bomberos, policía) con señales acústicas y luminosas tienen prioridad absoluta.',
    },
    {
      id: 'q29',
      text: 'En una intersección con semáforo en ámbar fijo, ¿quién tiene prioridad?',
      options: ['El vehículo que va más rápido', 'Se aplica la norma de prioridad por la derecha', 'El vehículo más grande', 'Nadie tiene prioridad'],
      correctAnswer: 1,
      explanation: 'Un semáforo en ámbar fijo indica que está apagado o en funcionamiento reducido, por lo que se aplica la norma de prioridad por la derecha.',
    },
    {
      id: 'q30',
      text: '¿Quién tiene prioridad en una intersección con agente de tráfico?',
      options: ['El vehículo que viene por la derecha', 'El que indique el agente', 'El vehículo de la vía principal', 'El vehículo más grande'],
      correctAnswer: 1,
      explanation: 'Las indicaciones de un agente de tráfico prevalecen sobre cualquier señal o norma de prioridad.',
    },
  ];
  
  t2Questions.forEach(q => {
    questions.push({
      ...q,
      themeId: 't2',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  });
  
  // Preguntas del tema 3 - Seguridad Vial
  const t3Questions = [
    {
      id: 'q41',
      text: '¿Qué es el ABS?',
      options: ['Sistema de frenos que evita el bloqueo de las ruedas', 'Sistema de airbags', 'Sistema de control de tracción', 'Sistema de navegación'],
      correctAnswer: 0,
      explanation: 'El ABS (Anti-lock Braking System) evita que las ruedas se bloqueen durante el frenado de emergencia, permitiendo mantener el control direccional.',
    },
    {
      id: 'q42',
      text: '¿Qué es el ESP?',
      options: ['Sistema de control de estabilidad', 'Sistema de airbags', 'Sistema de frenos', 'Sistema de climatización'],
      correctAnswer: 0,
      explanation: 'El ESP (Electronic Stability Program) ayuda a mantener la estabilidad del vehículo en situaciones de riesgo de derrape o pérdida de control.',
    },
    {
      id: 'q43',
      text: '¿Cuál es la función del cinturón de seguridad?',
      options: ['Evitar que el ocupante sea expulsado en caso de accidente', 'Hacer más cómodo el viaje', 'Decorar el interior', 'Sujetar la ropa'],
      correctAnswer: 0,
      explanation: 'El cinturón de seguridad evita que los ocupantes sean expulsados del vehículo y reduce el riesgo de colisión contra el interior del mismo.',
    },
    {
      id: 'q44',
      text: '¿Qué es un airbag?',
      options: ['Un sistema de seguridad pasiva que se infla en caso de colisión', 'Un sistema de frenos', 'Un tipo de neumático', 'Un sistema de navegación'],
      correctAnswer: 0,
      explanation: 'El airbag es un sistema de seguridad pasiva que se infla rápidamente en caso de colisión para proteger a los ocupantes.',
    },
    {
      id: 'q45',
      text: '¿Cuándo debe usarse el cinturón de seguridad?',
      options: ['Solo en carretera', 'Solo en ciudad', 'Siempre que se circule', 'Solo en autopista'],
      correctAnswer: 2,
      explanation: 'El cinturón de seguridad debe usarse siempre que se circule, tanto en vías urbanas como interurbanas.',
    },
    {
      id: 'q46',
      text: '¿Qué es el control de tracción (TCS)?',
      options: ['Sistema que evita el patinaje de las ruedas motrices', 'Sistema de frenos', 'Sistema de climatización', 'Sistema de navegación'],
      correctAnswer: 0,
      explanation: 'El TCS (Traction Control System) evita que las ruedas motrices patinen durante la aceleración, mejorando la tracción.',
    },
    {
      id: 'q47',
      text: '¿Qué es la seguridad pasiva?',
      options: ['Conjunto de elementos que protegen en caso de accidente', 'Sistemas que previenen accidentes', 'Seguro del coche', 'Candado para el coche'],
      correctAnswer: 0,
      explanation: 'La seguridad pasiva incluye todos los elementos que protegen a los ocupantes cuando ya se ha producido el accidente (airbags, cinturones, carrocería deformable, etc.).',
    },
    {
      id: 'q48',
      text: '¿Qué es la seguridad activa?',
      options: ['Conjunto de elementos que previenen accidentes', 'Sistemas que protegen en caso de accidente', 'Seguro del coche', 'Alarma del coche'],
      correctAnswer: 0,
      explanation: 'La seguridad activa incluye todos los sistemas que ayudan a prevenir accidentes (frenos, luces, neumáticos, ESP, etc.).',
    },
    {
      id: 'q49',
      text: '¿Cuál es la presión recomendada de los neumáticos?',
      options: ['La que indica el fabricante', 'Siempre 2.0 bar', 'La máxima posible', 'La mínima posible'],
      correctAnswer: 0,
      explanation: 'La presión correcta es la que indica el fabricante del vehículo, normalmente en una etiqueta en la puerta del conductor o en el manual.',
    },
    {
      id: 'q50',
      text: '¿Qué es el EBD?',
      options: ['Reparto electrónico de frenada', 'Sistema de airbags', 'Sistema de navegación', 'Sistema de climatización'],
      correctAnswer: 0,
      explanation: 'El EBD (Electronic Brakeforce Distribution) reparte electrónicamente la fuerza de frenado entre las ruedas para optimizar la frenada.',
    },
  ];
  
  t3Questions.forEach(q => {
    questions.push({
      ...q,
      themeId: 't3',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  });
  
  return questions;
}

function getDefaultTests(): Test[] {
  return [
    {
      id: 'test-1-1',
      title: 'Test 1: Señales de Prohibición',
      description: 'Identifica las señales de prohibición y sus significados',
      themeId: 't1',
      questions: ['q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8', 'q9', 'q10'],
      timeLimit: 15,
      passingScore: 7,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'test-2-1',
      title: 'Test 1: Prioridad de Paso',
      description: 'Aprende las normas de prioridad en diferentes situaciones',
      themeId: 't2',
      questions: ['q21', 'q22', 'q23', 'q24', 'q25', 'q26', 'q27', 'q28', 'q29', 'q30'],
      timeLimit: 15,
      passingScore: 7,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'test-3-1',
      title: 'Test 1: Sistemas de Seguridad',
      description: 'Conoce los sistemas de seguridad activa y pasiva del vehículo',
      themeId: 't3',
      questions: ['q41', 'q42', 'q43', 'q44', 'q45', 'q46', 'q47', 'q48', 'q49', 'q50'],
      timeLimit: 15,
      passingScore: 7,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
}

// ============== INICIALIZACIÓN ==============

export const initializeDefaultData = (): void => {
  const users = getUsers();
  
  // Crear admin por defecto si no existe
  if (!users.find(u => u.username === 'admin')) {
    const adminUser: User = {
      id: 'admin-1',
      username: 'admin',
      password: 'admin123',
      name: 'Administrador',
      email: 'admin@autoescuela.com',
      role: 'admin',
      createdAt: new Date().toISOString(),
    };
    saveUser(adminUser);
  }
  
  // Inicializar temas, preguntas y tests
  getThemes();
  getQuestions();
  getTests();
};
