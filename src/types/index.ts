// Tipos para la aplicación de autoescuela

export interface User {
  id: string;
  username: string;
  password: string;
  name: string;
  email?: string;
  role: 'student' | 'admin';
  createdAt: string;
}

export interface Question {
  id: string;
  text: string;
  image?: string;
  options: string[];
  correctAnswer: number; // Índice de la respuesta correcta (0-3)
  explanation: string;
  themeId: string; // Para análisis por tema
  isActive: boolean; // Soft delete
  createdAt: string;
  updatedAt: string;
}

export interface Test {
  id: string;
  title: string;
  description: string;
  themeId: string;
  questions: string[]; // IDs de preguntas (referencias)
  timeLimit: number; // en minutos
  passingScore: number; // puntos necesarios para aprobar
  isActive: boolean; // Soft delete
  createdAt: string;
  updatedAt: string;
}

export interface Theme {
  id: string;
  title: string;
  description: string;
  icon: string;
  isActive: boolean; // Soft delete
  createdAt: string;
  updatedAt: string;
}

// Información detallada de cada respuesta para análisis
export interface QuestionResult {
  questionId: string;
  questionText: string;
  themeId: string;
  themeName: string;
  userAnswer: number;
  correctAnswer: number;
  isCorrect: boolean;
  explanation: string;
}

export interface TestResult {
  id: string;
  userId: string;
  testId: string;
  testTitle: string; // Guardamos copia estática
  themeId: string;
  themeName: string; // Guardamos copia estática
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  timeSpent: number; // en segundos
  completedAt: string;
  answers: number[]; // respuestas seleccionadas por el usuario
  questionResults: QuestionResult[]; // Análisis detallado por pregunta
}

// Estadísticas de un estudiante para el análisis del admin
export interface StudentStats {
  userId: string;
  userName: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  averageScore: number;
  themeStats: ThemeStat[];
  weakAreas: string[]; // IDs de temas con más fallos
  strongAreas: string[]; // IDs de temas con más aciertos
}

export interface ThemeStat {
  themeId: string;
  themeName: string;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  errorRate: number; // porcentaje de error (0-100)
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
}
