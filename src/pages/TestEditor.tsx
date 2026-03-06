import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
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
  GripVertical,
  Image as ImageIcon,
  Eye,
  EyeOff
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
    image: '',
    isActive: true,
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
      passingScore: Math.min(testForm.passingScore, questions.filter(q => q.isActive !== false).length),
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
        image: question.image || '',
        isActive: question.isActive !== false,
      });
    } else {
      setEditingQuestion(null);
      setQuestionForm({
        id: '',
        text: '',
        options: ['', '', '', ''],
        correctAnswer: 0,
        explanation: '',
        image: '',
        isActive: true,
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
      image: questionForm.image || undefined,
      themeId: test.themeId,
      isActive: questionForm.isActive,
      createdAt: questionForm.id ? (getQuestionById(questionForm.id)?.createdAt || new Date().toISOString()) : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveQuestion(newQuestion);
    
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

  const toggleQuestionActive = (question: Question) => {
    const updatedQuestion = { ...question, isActive: !question.isActive, updatedAt: new Date().toISOString() };
    saveQuestion(updatedQuestion);
    loadData();
    setHasChanges(true);
    setMessage({ type: 'success', text: updatedQuestion.isActive ? 'Pregunta activada' : 'Pregunta desactivada' });
    setTimeout(() => setMessage(null), 2000);
  };

  const openDeleteDialog = (question: Question) => {
    setQuestionToDelete(question);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteQuestion = () => {
    if (!test || !questionToDelete) return;

    deleteQuestion(questionToDelete.id);
    
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setQuestionForm({ ...questionForm, image: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setQuestionForm({ ...questionForm, image: '' });
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
            <Button onClick={() => navigate('/dashboard')}><ArrowLeft className="w-4 h-4 mr-2" />Volver</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const activeQuestions = questions.filter(q => q.isActive !== false);

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
                <h1 className="text-xl font-bold text-foreground">Autoescuela Xinzo Tests</h1>
                <p className="text-xs text-muted-foreground">Editor de Test</p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-muted-foreground">
                {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              </Button>
              
              <Button variant="outline" size="sm" onClick={() => navigate('/dashboard')} className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Volver</span>
              </Button>
              
              <div className="hidden sm:flex items-center gap-3">
                <div className="text-right">
                  <p className="text-sm font-medium text-foreground">{user?.name}</p>
                </div>
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
              </div>

              <Button variant="ghost" size="icon" onClick={handleLogout} className="text-muted-foreground hover:text-red-600">
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {message && (
          <Alert className={`mb-6 ${message.type === 'success' ? 'bg-green-50 border-green-200 dark:bg-green-950/30' : 'bg-red-50 border-red-200 dark:bg-red-950/30'}`}>
            {message.type === 'success' ? <CheckCircle className="h-4 w-4 text-green-600" /> : <AlertCircle className="h-4 w-4 text-red-600" />}
            <AlertDescription>{message.text}</AlertDescription>
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
              <p className="text-muted-foreground">Edita la información del test y gestiona sus preguntas.</p>
            </div>
            <div className="flex gap-3">
              <Button variant="destructive" onClick={handleDeleteTest}><Trash2 className="w-4 h-4 mr-2" />Eliminar</Button>
              <Button onClick={saveTestChanges} disabled={!hasChanges}><Save className="w-4 h-4 mr-2" />Guardar</Button>
            </div>
          </div>
        </div>

        {/* Test Configuration */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><BookOpen className="w-5 h-5" />Configuración</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Título *</Label>
                <Input value={testForm.title} onChange={(e) => { setTestForm({ ...testForm, title: e.target.value }); setHasChanges(true); }} placeholder="Título del test" />
              </div>
              <div className="space-y-2">
                <Label>Tema *</Label>
                <select value={testForm.themeId} onChange={(e) => { setTestForm({ ...testForm, themeId: e.target.value }); setHasChanges(true); }} className="w-full h-10 px-3 rounded-md border border-input bg-background">
                  {themes.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                </select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Descripción</Label>
                <Input value={testForm.description} onChange={(e) => { setTestForm({ ...testForm, description: e.target.value }); setHasChanges(true); }} placeholder="Descripción" />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Clock className="w-4 h-4" />Tiempo (min)</Label>
                <Input type="number" min={1} max={120} value={testForm.timeLimit} onChange={(e) => { setTestForm({ ...testForm, timeLimit: parseInt(e.target.value) || 15 }); setHasChanges(true); }} />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2"><Target className="w-4 h-4" />Para aprobar (máx: {activeQuestions.length})</Label>
                <Input type="number" min={1} max={activeQuestions.length} value={testForm.passingScore} onChange={(e) => { setTestForm({ ...testForm, passingScore: parseInt(e.target.value) || 1 }); setHasChanges(true); }} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Questions Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2"><BookOpen className="w-5 h-5" />Preguntas ({activeQuestions.length}/{questions.length})</CardTitle>
            <Button onClick={() => openQuestionDialog()}><Plus className="w-4 h-4 mr-2" />Añadir</Button>
          </CardHeader>
          <CardContent>
            {questions.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No hay preguntas</h3>
                <Button onClick={() => openQuestionDialog()}><Plus className="w-4 h-4 mr-2" />Añadir primera</Button>
              </div>
            ) : (
              <div className="space-y-4">
                {questions.map((question, index) => (
                  <div key={question.id} className={`p-4 border rounded-lg ${question.isActive === false ? 'opacity-50 bg-muted' : 'bg-card'}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3 flex-wrap">
                          <span className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center text-sm font-medium text-primary">{index + 1}</span>
                          <p className="font-medium text-foreground">{question.text}</p>
                          {question.image && <Badge variant="outline"><ImageIcon className="w-3 h-3 mr-1" />Con imagen</Badge>}
                          {question.isActive === false && <Badge variant="secondary">Desactivada</Badge>}
                        </div>
                        
                        {question.image && (
                          <div className="mb-3 ml-11">
                            <img src={question.image} alt="" className="max-h-40 rounded-lg border object-contain" />
                          </div>
                        )}
                        
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3 ml-11">
                          {question.options.map((option, idx) => (
                            <div key={idx} className={`text-sm px-3 py-2 rounded ${idx === question.correctAnswer ? 'bg-green-100 text-green-700 border border-green-300 dark:bg-green-900 dark:text-green-300' : 'bg-muted text-muted-foreground'}`}>
                              {String.fromCharCode(65 + idx)}. {option}
                            </div>
                          ))}
                        </div>
                        
                        {question.explanation && (
                          <p className="text-sm text-muted-foreground ml-11"><strong>Explicación:</strong> {question.explanation}</p>
                        )}
                      </div>
                      
                      <div className="flex flex-col items-center gap-2">
                        {/* Switch ON/OFF */}
                        <div className="flex items-center gap-2 mb-2">
                          <Switch 
                            checked={question.isActive !== false} 
                            onCheckedChange={() => toggleQuestionActive(question)}
                          />
                          <span className="text-xs text-muted-foreground">{question.isActive !== false ? 'ON' : 'OFF'}</span>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => moveQuestion(index, 'up')} disabled={index === 0}><GripVertical className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => openQuestionDialog(question)} className="text-blue-600"><Edit2 className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => openDeleteDialog(question)} className="text-red-600"><Trash2 className="w-4 h-4" /></Button>
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
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Switch activar/desactivar */}
            {editingQuestion && (
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  {questionForm.isActive ? <Eye className="w-4 h-4 text-green-600" /> : <EyeOff className="w-4 h-4 text-gray-400" />}
                  <span className="font-medium">Pregunta {questionForm.isActive ? 'activa' : 'desactivada'}</span>
                </div>
                <Switch checked={questionForm.isActive} onCheckedChange={(checked) => setQuestionForm({ ...questionForm, isActive: checked })} />
              </div>
            )}

            <div className="space-y-2">
              <Label>Pregunta *</Label>
              <Input value={questionForm.text} onChange={(e) => setQuestionForm({ ...questionForm, text: e.target.value })} placeholder="Escribe la pregunta..." />
            </div>

            {/* Imagen de la pregunta */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><ImageIcon className="w-4 h-4" /> Imagen de la pregunta (opcional)</Label>
              {questionForm.image ? (
                <div className="relative">
                  <img src={questionForm.image} alt="" className="w-full max-h-48 object-contain rounded-lg border" />
                  <Button variant="destructive" size="sm" onClick={removeImage} className="absolute top-2 right-2"><X className="w-4 h-4" /></Button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} id="question-img" />
                  <label htmlFor="question-img" className="cursor-pointer">
                    <ImageIcon className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                    <span className="text-sm text-muted-foreground">Haz clic para subir imagen</span>
                  </label>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <Label>Opciones *</Label>
              {questionForm.options.map((option, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <input type="radio" name="correctAnswer" checked={questionForm.correctAnswer === idx} onChange={() => setQuestionForm({ ...questionForm, correctAnswer: idx })} className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium w-6">{String.fromCharCode(65 + idx)}.</span>
                  <Input value={option} onChange={(e) => { const newOptions = [...questionForm.options]; newOptions[idx] = e.target.value; setQuestionForm({ ...questionForm, options: newOptions }); }} placeholder={`Opción ${idx + 1}`} />
                </div>
              ))}
              <p className="text-sm text-muted-foreground">Selecciona el radio de la respuesta correcta.</p>
            </div>

            <div className="space-y-2">
              <Label>Explicación</Label>
              <textarea value={questionForm.explanation} onChange={(e) => setQuestionForm({ ...questionForm, explanation: e.target.value })} placeholder="Explicación..." className="w-full px-3 py-2 rounded-md border border-input bg-background min-h-[80px] resize-none" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsQuestionDialogOpen(false)}><X className="w-4 h-4 mr-2" />Cancelar</Button>
            <Button onClick={saveQuestionHandler}><Save className="w-4 h-4 mr-2" />Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Eliminar Pregunta</DialogTitle>
            <DialogDescription>¿Estás seguro de eliminar esta pregunta?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDeleteQuestion}><Trash2 className="w-4 h-4 mr-2" />Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
