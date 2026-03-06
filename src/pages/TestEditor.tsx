import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Car, 
  LogOut, 
  User, 
  Plus, 
  Trash2, 
  Edit2, 
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Save,
  X,
  Moon,
  Sun,
  Clock,
  Target,
  BookOpen,
  GripVertical
} from 'lucide-react';
import { 
  getTestById, 
  saveTest, 
  deleteTest,
  getQuestionById,
  saveQuestion,
  deleteQuestion,
  getThemes,
  getTestWithQuestions
} from '@/services/storage';
import type { Test, Question, Theme } from '@/types';

export default function TestEditor() {
  const { testId } = useParams<{ testId: string }>();
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  
  const [test, setTest] = useState<Test | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  
  // Test form state
  const [testForm, setTestForm] = useState({
    title: '',
    description: '',
    themeId: '',
    timeLimit: 15,
    passingScore: 7,
  });
  
  // Question dialog state
  const [isQuestionDialogOpen, setIsQuestionDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [questionForm, setQuestionForm] = useState({
    id: '',
    text: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    explanation: '',
  });
  
  // Delete dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<Question | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) {
      navigate('/dashboard');
      return;
    }
    loadData();
  }, [isAuthenticated, isAdmin, navigate, testId]);

  const loadData = () => {
    if (!testId) {
      navigate('/dashboard');
      return;
    }
    
    const loadedTest = getTestById(testId, true);
    if (!loadedTest) {
      setMessage({ type: 'error', text: 'Test no encontrado' });
      setLoading(false);
      return;
    }
    
    setTest(loadedTest);
    setTestForm({
      title: loadedTest.title,
      description: loadedTest.description,
      themeId: loadedTest.themeId,
      timeLimit: loadedTest.timeLimit,
      passingScore: loadedTest.passingScore,
    });
    
    // Load questions for this test
    const testWithQuestions = getTestWithQuestions(testId, true);
    if (testWithQuestions) {
      setQuestions(testWithQuestions.questionData);
    }
    
    setThemes(getThemes());
    setLoading(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const saveTestChanges = () => {
    if (!test) return;
    
    if (!testForm.title.trim()) {
      setMessage({ type: 'error', text: 'El título del test es obligatorio' });
      return;
    }

    const updatedTest: Test = {
      ...test,
      title: testForm.title,
      description: testForm.description,
      themeId: testForm.themeId,
      timeLimit: testForm.timeLimit,
      passingScore: Math.min(testForm.passingScore, questions.length),
      updatedAt: new Date().toISOString(),
    };

    saveTest(updatedTest);
    setTest(updatedTest);
    setHasChanges(false);
    setMessage({ type: 'success', text: 'Test guardado correctamente' });
    setTimeout(() => setMessage(null), 3000);
  };

  const openQuestionDialog = (question?: Question) => {
    if (question) {
      setEditingQuestion(question);
      setQuestionForm({
        id: question.id,
        text: question.text,
        options: [...question.options],
        correctAnswer: question.correctAnswer,
        explanation: question.explanation,
      });
    } else {
      setEditingQuestion(null);
      setQuestionForm({
        id: '',
        text: '',
        options: ['', '', '', ''],
        correctAnswer: 0,
        explanation: '',
      });
    }
    setIsQuestionDialogOpen(true);
  };

  const saveQuestionHandler = () => {
    if (!test) return;
    
    if (!questionForm.text.trim() || questionForm.options.some(o => !o.trim())) {
      setMessage({ type: 'error', text: 'Completa todos los campos de la pregunta' });
      return;
    }

    const newQuestion: Question = {
      id: questionForm.id || `q-${Date.now()}`,
      text: questionForm.text,
      options: questionForm.options,
      correctAnswer: questionForm.correctAnswer,
      explanation: questionForm.explanation,
      themeId: test.themeId,
      isActive: true,
      createdAt: questionForm.id ? (getQuestionById(questionForm.id)?.createdAt || new Date().toISOString()) : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveQuestion(newQuestion);
    
    // If it's a new question, add it to the test
    if (!questionForm.id) {
      const updatedTest = {
        ...test,
        questions: [...test.questions, newQuestion.id],
        updatedAt: new Date().toISOString(),
      };
      saveTest(updatedTest);
      setTest(updatedTest);
    }
    
    loadData();
    setIsQuestionDialogOpen(false);
    setHasChanges(true);
    setMessage({ type: 'success', text: questionForm.id ? 'Pregunta actualizada' : 'Pregunta añadida' });
    setTimeout(() => setMessage(null), 3000);
  };

  const openDeleteDialog = (question: Question) => {
    setQuestionToDelete(question);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteQuestion = () => {
    if (!test || !questionToDelete) return;

    // Soft delete the question
    deleteQuestion(questionToDelete.id);
    
    // Remove from test's question list
    const updatedTest = {
      ...test,
      questions: test.questions.filter(q => q !== questionToDelete.id),
      updatedAt: new Date().toISOString(),
    };
    saveTest(updatedTest);
    setTest(updatedTest);
    
    loadData();
    setIsDeleteDialogOpen(false);
    setQuestionToDelete(null);
    setHasChanges(true);
    setMessage({ type: 'success', text: 'Pregunta eliminada' });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleDeleteTest = () => {
    if (!test) return;
    
    deleteTest(test.id);
    navigate('/dashboard');
  };

  const moveQuestion = (index: number, direction: 'up' | 'down') => {
    if (!test) return;
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= questions.length) return;
    
    const newQuestions = [...questions];
    [newQuestions[index], newQuestions[newIndex]] = [newQuestions[newIndex], newQuestions[index]];
    
    const updatedTest = {
      ...test,
      questions: newQuestions.map(q => q.id),
      updatedAt: new Date().toISOString(),
    };
    saveTest(updatedTest);
    setTest(updatedTest);
    setQuestions(newQuestions);
    setHasChanges(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!test) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-foreground mb-2">Test no encontrado</h2>
            <p className="text-muted-foreground mb-4">El test que intentas editar no existe.</p>
            <Button onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-sm border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Car className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Autoescuela Test</h1>
                <p className="text-xs text-muted-foreground">Editor de Test</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Botón Modo Oscuro */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="text-muted-foreground hover:text-foreground"
                title={theme === 'light' ? 'Cambiar a modo oscuro' : 'Cambiar a modo claro'}
              >
                {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Volver
              </Button>
              
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-foreground">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">Administrador</p>
                </div>
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Messages */}
        {message && (
          <Alert className={`mb-6 ${message.type === 'success' ? 'bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-900' : 'bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-900'}`}>
            {message.type === 'success' ? (
              <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
            )}
            <AlertDescription className={message.type === 'success' ? 'text-green-700 dark:text-green-300' : 'text-red-700 dark:text-red-300'}>
              {message.text}
            </AlertDescription>
          </Alert>
        )}

        {/* Test Info Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-2xl font-bold text-foreground">Editar Test</h2>
                <Badge variant={test.isActive !== false ? 'default' : 'secondary'}>
                  {test.isActive !== false ? 'Activo' : 'Inactivo'}
                </Badge>
              </div>
              <p className="text-muted-foreground">
                Edita la información del test y gestiona sus preguntas.
              </p>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="destructive"
                onClick={handleDeleteTest}
                className="flex items-center gap-2"
              >
                <Trash2 className="w-4 h-4" />
                Eliminar Test
              </Button>
              <Button 
                onClick={saveTestChanges}
                disabled={!hasChanges}
                className="flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                Guardar Cambios
              </Button>
            </div>
          </div>
        </div>

        {/* Test Configuration */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Configuración del Test
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="test-title">Título *</Label>
                <Input
                  id="test-title"
                  value={testForm.title}
                  onChange={(e) => {
                    setTestForm({ ...testForm, title: e.target.value });
                    setHasChanges(true);
                  }}
                  placeholder="Ej: Test de Señales de Prohibición"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="test-theme">Tema *</Label>
                <select
                  id="test-theme"
                  value={testForm.themeId}
                  onChange={(e) => {
                    setTestForm({ ...testForm, themeId: e.target.value });
                    setHasChanges(true);
                  }}
                  className="w-full h-10 px-3 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  {themes.map(theme => (
                    <option key={theme.id} value={theme.id}>{theme.title}</option>
                  ))}
                </select>
              </div>
              
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="test-description">Descripción</Label>
                <Input
                  id="test-description"
                  value={testForm.description}
                  onChange={(e) => {
                    setTestForm({ ...testForm, description: e.target.value });
                    setHasChanges(true);
                  }}
                  placeholder="Breve descripción del test"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="test-time" className="flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Tiempo límite (minutos)
                </Label>
                <Input
                  id="test-time"
                  type="number"
                  min={1}
                  max={120}
                  value={testForm.timeLimit}
                  onChange={(e) => {
                    setTestForm({ ...testForm, timeLimit: parseInt(e.target.value) || 15 });
                    setHasChanges(true);
                  }}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="test-passing" className="flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  Puntuación para aprobar (máx: {questions.length})
                </Label>
                <Input
                  id="test-passing"
                  type="number"
                  min={1}
                  max={questions.length}
                  value={testForm.passingScore}
                  onChange={(e) => {
                    setTestForm({ ...testForm, passingScore: parseInt(e.target.value) || 1 });
                    setHasChanges(true);
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Questions Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              Preguntas ({questions.length})
            </CardTitle>
            <Button onClick={() => openQuestionDialog()} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Añadir Pregunta
            </Button>
          </CardHeader>
          <CardContent>
            {questions.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-foreground mb-2">No hay preguntas</h3>
                <p className="text-muted-foreground mb-4">Añade preguntas a este test para que los estudiantes puedan practicar.</p>
                <Button onClick={() => openQuestionDialog()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Añadir primera pregunta
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {questions.map((question, index) => (
                  <div 
                    key={question.id} 
                    className={`p-4 border rounded-lg ${question.isActive === false ? 'opacity-50 bg-muted' : 'bg-card'}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-medium text-primary">
                            {index + 1}
                          </span>
                          <p className="font-medium text-foreground">{question.text}</p>
                          {question.isActive === false && (
                            <Badge variant="secondary">Inactiva</Badge>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3 ml-11">
                          {question.options.map((option, idx) => (
                            <div 
                              key={idx} 
                              className={`text-sm px-3 py-2 rounded ${
                                idx === question.correctAnswer 
                                  ? 'bg-green-100 text-green-700 border border-green-300 dark:bg-green-900 dark:text-green-300 dark:border-green-700' 
                                  : 'bg-muted text-muted-foreground'
                              }`}
                            >
                              {String.fromCharCode(65 + idx)}. {option}
                            </div>
                          ))}
                        </div>
                        
                        {question.explanation && (
                          <p className="text-sm text-muted-foreground ml-11">
                            <strong>Explicación:</strong> {question.explanation}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex flex-col items-center gap-2">
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => moveQuestion(index, 'up')}
                            disabled={index === 0}
                            className="h-8 w-8"
                          >
                            <GripVertical className="w-4 h-4" />
                          </Button>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openQuestionDialog(question)}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDeleteDialog(question)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Question Dialog */}
      <Dialog open={isQuestionDialogOpen} onOpenChange={setIsQuestionDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingQuestion ? 'Editar Pregunta' : 'Nueva Pregunta'}</DialogTitle>
            <DialogDescription>
              Completa la información de la pregunta y sus opciones.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Pregunta *</Label>
              <Input
                value={questionForm.text}
                onChange={(e) => setQuestionForm({ ...questionForm, text: e.target.value })}
                placeholder="Escribe la pregunta..."
              />
            </div>
            <div className="space-y-3">
              <Label>Opciones *</Label>
              {questionForm.options.map((option, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="correctAnswer"
                    checked={questionForm.correctAnswer === idx}
                    onChange={() => setQuestionForm({ ...questionForm, correctAnswer: idx })}
                    className="w-4 h-4 text-primary"
                  />
                  <span className="text-sm font-medium w-6">{String.fromCharCode(65 + idx)}.</span>
                  <Input
                    value={option}
                    onChange={(e) => {
                      const newOptions = [...questionForm.options];
                      newOptions[idx] = e.target.value;
                      setQuestionForm({ ...questionForm, options: newOptions });
                    }}
                    placeholder={`Opción ${idx + 1}`}
                  />
                </div>
              ))}
              <p className="text-sm text-muted-foreground">Selecciona el radio button de la respuesta correcta.</p>
            </div>
            <div className="space-y-2">
              <Label>Explicación</Label>
              <textarea
                value={questionForm.explanation}
                onChange={(e) => setQuestionForm({ ...questionForm, explanation: e.target.value })}
                placeholder="Explicación de la respuesta correcta..."
                className="w-full px-3 py-2 rounded-md border border-input bg-background min-h-[80px] resize-none focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsQuestionDialogOpen(false)}>
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button onClick={saveQuestionHandler}>
              <Save className="w-4 h-4 mr-2" />
              Guardar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600">Eliminar Pregunta</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar esta pregunta?
              <br /><br />
              <span className="text-amber-600">
                <AlertCircle className="w-4 h-4 inline mr-1" />
                Esta acción marcará la pregunta como inactiva.
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleDeleteQuestion} variant="destructive">
              <Trash2 className="w-4 h-4 mr-2" />
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
