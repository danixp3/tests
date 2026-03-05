import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Clock, 
  ArrowLeft, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Flag,
  RotateCcw,
  Home,
  Moon,
  Sun
} from 'lucide-react';
import { getTestWithQuestions, saveTestResult, getThemeById } from '@/services/storage';
import type { Question, TestResult, QuestionResult } from '@/types';

export default function Test() {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  
  const [test, setTest] = useState<(any & { questionData: Question[] }) | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isFinished, setIsFinished] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [flaggedQuestions, setFlaggedQuestions] = useState<number[]>([]);
  const [result, setResult] = useState<TestResult | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
      return;
    }

    if (testId) {
      const testData = getTestWithQuestions(testId);
      if (testData) {
        setTest(testData);
        setTimeLeft(testData.timeLimit * 60);
        setAnswers(new Array(testData.questionData.length).fill(-1));
      } else {
        navigate('/dashboard');
      }
    }
  }, [testId, isAuthenticated, navigate]);

  // Temporizador
  useEffect(() => {
    if (!test || isFinished || showResults) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          finishTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [test, isFinished, showResults]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswer = (optionIndex: number) => {
    if (isFinished) return;
    
    const newAnswers = [...answers];
    newAnswers[currentQuestionIndex] = optionIndex;
    setAnswers(newAnswers);
  };

  const toggleFlag = () => {
    if (flaggedQuestions.includes(currentQuestionIndex)) {
      setFlaggedQuestions(flaggedQuestions.filter(i => i !== currentQuestionIndex));
    } else {
      setFlaggedQuestions([...flaggedQuestions, currentQuestionIndex]);
    }
  };

  const goToQuestion = (index: number) => {
    if (test && index >= 0 && index < test.questionData.length) {
      setCurrentQuestionIndex(index);
    }
  };

  const finishTest = useCallback(() => {
    if (!test || !user) return;

    setIsFinished(true);

    // Calcular resultado y crear questionResults detallados
    let correctCount = 0;
    const questionResults: QuestionResult[] = [];
    
    const theme = getThemeById(test.themeId);
    
    answers.forEach((answer, index) => {
      const question = test.questionData[index];
      const isCorrect = answer === question.correctAnswer;
      
      if (isCorrect) {
        correctCount++;
      }
      
      questionResults.push({
        questionId: question.id,
        questionText: question.text,
        themeId: question.themeId,
        themeName: theme?.title || 'Tema desconocido',
        userAnswer: answer,
        correctAnswer: question.correctAnswer,
        isCorrect,
        explanation: question.explanation,
      });
    });

    const timeSpent = test.timeLimit * 60 - timeLeft;

    const testResult: TestResult = {
      id: `result-${Date.now()}`,
      userId: user.id,
      testId: test.id,
      testTitle: test.title, // Copia estática
      themeId: test.themeId,
      themeName: theme?.title || 'Tema desconocido', // Copia estática
      score: correctCount,
      totalQuestions: test.questionData.length,
      correctAnswers: correctCount,
      timeSpent,
      completedAt: new Date().toISOString(),
      answers,
      questionResults, // Análisis detallado por pregunta
    };

    saveTestResult(testResult);
    setResult(testResult);
    setShowResults(true);
  }, [test, user, answers, timeLeft]);

  const getQuestionStatus = (index: number) => {
    if (answers[index] !== -1) return 'answered';
    if (flaggedQuestions.includes(index)) return 'flagged';
    return 'unanswered';
  };

  if (!test) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando test...</p>
        </div>
      </div>
    );
  }

  if (showResults && result) {
    const passed = result.score >= test.passingScore;
    const percentage = Math.round((result.score / test.questionData.length) * 100);

    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <Card className="overflow-hidden">
            <div className={`p-8 text-center ${passed ? 'bg-gradient-to-br from-green-500 to-green-600' : 'bg-gradient-to-br from-red-500 to-red-600'} text-white`}>
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                {passed ? (
                  <CheckCircle className="w-10 h-10 text-white" />
                ) : (
                  <XCircle className="w-10 h-10 text-white" />
                )}
              </div>
              <h1 className="text-3xl font-bold mb-2">
                {passed ? '¡Test Aprobado!' : 'Test No Aprobado'}
              </h1>
              <p className="text-white/90">
                {passed 
                  ? '¡Enhorabuena! Has superado el test con éxito.' 
                  : 'No has alcanzado la puntuación mínima necesaria.'}
              </p>
            </div>

            <CardContent className="p-8">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-500 text-sm mb-1">Puntuación</p>
                  <p className={`text-3xl font-bold ${passed ? 'text-green-600' : 'text-red-600'}`}>
                    {result.score}/{test.questionData.length}
                  </p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-500 text-sm mb-1">Porcentaje</p>
                  <p className="text-3xl font-bold text-gray-900">{percentage}%</p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-500 text-sm mb-1">Tiempo</p>
                  <p className="text-3xl font-bold text-gray-900">
                    {formatTime(result.timeSpent)}
                  </p>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-500 text-sm mb-1">Nota</p>
                  <p className={`text-3xl font-bold ${passed ? 'text-green-600' : 'text-red-600'}`}>
                    {passed ? 'Apto' : 'No Apto'}
                  </p>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <h3 className="text-lg font-semibold text-gray-900">Resumen de respuestas:</h3>
                <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
                  {answers.map((answer, index) => {
                    const isCorrect = answer === test.questionData[index].correctAnswer;
                    return (
                      <div
                        key={index}
                        className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-medium ${
                          isCorrect 
                            ? 'bg-green-100 text-green-700 border-2 border-green-300' 
                            : 'bg-red-100 text-red-700 border-2 border-red-300'
                        }`}
                      >
                        {index + 1}
                      </div>
                    );
                  })}
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-100 border-2 border-green-300 rounded"></div>
                    <span className="text-gray-600">Correctas: {result.correctAnswers}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-100 border-2 border-red-300 rounded"></div>
                    <span className="text-gray-600">Incorrectas: {test.questionData.length - result.correctAnswers}</span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button
                  onClick={() => navigate('/dashboard')}
                  variant="outline"
                  className="flex-1"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Volver al Dashboard
                </Button>
                <Button
                  onClick={() => window.location.reload()}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Repetir Test
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Detalle de preguntas */}
          <div className="mt-8 space-y-4">
            <h3 className="text-xl font-bold text-gray-900">Revisión de preguntas:</h3>
            {test.questionData.map((question: Question, index: number) => {
              const userAnswer = answers[index];
              const isCorrect = userAnswer === question.correctAnswer;

              return (
                <Card key={question.id} className={`border-l-4 ${isCorrect ? 'border-l-green-500' : 'border-l-red-500'}`}>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                        isCorrect ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                      }`}>
                        {isCorrect ? <CheckCircle className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900 mb-3">
                          {index + 1}. {question.text}
                        </p>
                        <div className="space-y-2">
                          {question.options.map((option, optIndex) => {
                            const isSelected = userAnswer === optIndex;
                            const isCorrectAnswer = question.correctAnswer === optIndex;

                            return (
                              <div
                                key={optIndex}
                                className={`p-3 rounded-lg text-sm ${
                                  isCorrectAnswer
                                    ? 'bg-green-100 text-green-800 border border-green-300'
                                    : isSelected && !isCorrectAnswer
                                    ? 'bg-red-100 text-red-800 border border-red-300'
                                    : 'bg-gray-50 text-gray-600'
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  {isCorrectAnswer && <CheckCircle className="w-4 h-4 text-green-600" />}
                                  {isSelected && !isCorrectAnswer && <XCircle className="w-4 h-4 text-red-600" />}
                                  <span>{String.fromCharCode(65 + optIndex)}. {option}</span>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                          <p className="text-sm text-blue-800">
                            <strong>Explicación:</strong> {question.explanation}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = test.questionData[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / test.questionData.length) * 100;
  const answeredCount = answers.filter(a => a !== -1).length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/dashboard')}
                className="text-gray-500 hover:text-gray-700"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">{test.title}</h1>
                <p className="text-xs text-gray-500">
                  Pregunta {currentQuestionIndex + 1} de {test.questionData.length}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Botón Modo Oscuro */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="text-gray-500 hover:text-gray-700"
                title={theme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
              >
                {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              </Button>
              
              <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                timeLeft < 60 ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
              }`}>
                <Clock className="w-5 h-5" />
                <span className="font-mono font-semibold">{formatTime(timeLeft)}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">Progreso del test</span>
            <span className="text-sm font-medium text-gray-900">
              {answeredCount}/{test.questionData.length} respondidas
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Question Navigator */}
          <div className="lg:col-span-1 order-2 lg:order-1">
            <Card>
              <CardContent className="p-4">
                <h3 className="font-semibold text-gray-900 mb-4">Navegación</h3>
                <div className="grid grid-cols-5 gap-2">
                  {test.questionData.map((_: any, index: number) => {
                    const status = getQuestionStatus(index);
                    return (
                      <button
                        key={index}
                        onClick={() => goToQuestion(index)}
                        className={`w-10 h-10 rounded-lg text-sm font-medium transition-all ${
                          index === currentQuestionIndex
                            ? 'bg-blue-600 text-white ring-2 ring-blue-300'
                            : status === 'answered'
                            ? 'bg-green-100 text-green-700 border border-green-300'
                            : status === 'flagged'
                            ? 'bg-yellow-100 text-yellow-700 border border-yellow-300'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {index + 1}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-4 space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
                    <span className="text-gray-600">Respondida</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-yellow-100 border border-yellow-300 rounded"></div>
                    <span className="text-gray-600">Marcada</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded"></div>
                    <span className="text-gray-600">Sin responder</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Question */}
          <div className="lg:col-span-3 order-1 lg:order-2">
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <Badge variant="secondary" className="text-sm">
                    Pregunta {currentQuestionIndex + 1}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={toggleFlag}
                    className={flaggedQuestions.includes(currentQuestionIndex) ? 'text-yellow-600' : 'text-gray-400'}
                  >
                    <Flag className={`w-5 h-5 ${flaggedQuestions.includes(currentQuestionIndex) ? 'fill-yellow-400' : ''}`} />
                  </Button>
                </div>

                <h2 className="text-xl font-medium text-gray-900 mb-6">
                  {currentQuestion.text}
                </h2>

                <div className="space-y-3">
                  {currentQuestion.options.map((option: string, index: number) => (
                    <button
                      key={index}
                      onClick={() => handleAnswer(index)}
                      className={`w-full p-4 rounded-lg border-2 text-left transition-all ${
                        answers[currentQuestionIndex] === index
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-medium ${
                          answers[currentQuestionIndex] === index
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-600'
                        }`}>
                          {String.fromCharCode(65 + index)}
                        </div>
                        <span className="text-gray-700">{option}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between">
              <Button
                variant="outline"
                onClick={() => goToQuestion(currentQuestionIndex - 1)}
                disabled={currentQuestionIndex === 0}
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Anterior
              </Button>

              {currentQuestionIndex === test.questionData.length - 1 ? (
                <Button
                  onClick={finishTest}
                  className="bg-green-600 hover:bg-green-700"
                  disabled={answeredCount === 0}
                >
                  Finalizar Test
                  <CheckCircle className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={() => goToQuestion(currentQuestionIndex + 1)}
                  variant="outline"
                >
                  Siguiente
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>

            {/* Warning if not all questions answered */}
            {answeredCount < test.questionData.length && currentQuestionIndex === test.questionData.length - 1 && (
              <Alert className="mt-4 bg-yellow-50 border-yellow-200">
                <AlertCircle className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-700">
                  Te quedan {test.questionData.length - answeredCount} preguntas sin responder.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
