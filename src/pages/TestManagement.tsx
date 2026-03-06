import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Car, 
  LogOut, 
  User, 
  Plus, 
  Trash2, 
  Edit2, 
  ArrowLeft,
  BookOpen,
  FileQuestion,
  LayoutList,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronRight,
  Moon,
  Sun
} from 'lucide-react';
import { 
  getThemes, 
  saveTheme, 
  deleteTheme,
  getTests, 
  saveTest, 
  deleteTest,
  getQuestions,
  saveQuestion,
  deleteQuestion,
  getQuestionsByTheme,
  getTestsByTheme
} from '@/services/storage';
import type { Theme, Test, Question } from '@/types';

const iconOptions = [
  { value: 'traffic-cone', label: 'Señal de tráfico', icon: 'traffic-cone' },
  { value: 'route', label: 'Ruta', icon: 'route' },
  { value: 'shield-check', label: 'Escudo', icon: 'shield-check' },
  { value: 'wrench', label: 'Herramienta', icon: 'wrench' },
  { value: 'leaf', label: 'Hoja', icon: 'leaf' },
  { value: 'book-open', label: 'Libro', icon: 'book-open' },
  { value: 'car', label: 'Coche', icon: 'car' },
  { value: 'alert-circle', label: 'Alerta', icon: 'alert-circle' },
];

export default function TestManagement() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  
  const [themes, setThemes] = useState<Theme[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [activeTab, setActiveTab] = useState('themes');
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Dialog states
  const [isThemeDialogOpen, setIsThemeDialogOpen] = useState(false);
  const [isTestDialogOpen, setIsTestDialogOpen] = useState(false);
  const [isQuestionDialogOpen, setIsQuestionDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteType, setDeleteType] = useState<'theme' | 'test' | 'question'>('theme');
  const [deleteItem, setDeleteItem] = useState<any>(null);
  
  // Form states
  const [themeForm, setThemeForm] = useState({ id: '', title: '', description: '', icon: 'book-open' });
  const [testForm, setTestForm] = useState({ 
    id: '', 
    title: '', 
    description: '', 
    themeId: '', 
    timeLimit: 15, 
    passingScore: 7,
    questions: [] as string[]
  });
  const [questionForm, setQuestionForm] = useState({
    id: '',
    text: '',
    options: ['', '', '', ''],
    correctAnswer: 0,
    explanation: '',
    themeId: ''
  });
  
  // Expanded states
  const [expandedThemes, setExpandedThemes] = useState<string[]>([]);

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) {
      navigate('/dashboard');
      return;
    }
    loadData();
  }, [isAuthenticated, isAdmin, navigate]);

  const loadData = () => {
    setThemes(getThemes(true));
    setTests(getTests(true));
    setQuestions(getQuestions(true));
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // ============== THEME FUNCTIONS ==============
  
  const openThemeDialog = (theme?: Theme) => {
    if (theme) {
      setThemeForm({
        id: theme.id,
        title: theme.title,
        description: theme.description,
        icon: theme.icon
      });
    } else {
      setThemeForm({ id: '', title: '', description: '', icon: 'book-open' });
    }
    setIsThemeDialogOpen(true);
  };

  const saveThemeHandler = () => {
    if (!themeForm.title.trim() || !themeForm.description.trim()) {
      setMessage({ type: 'error', text: 'Completa todos los campos obligatorios' });
      return;
    }

    const theme: Theme = {
      id: themeForm.id || `theme-${Date.now()}`,
      title: themeForm.title,
      description: themeForm.description,
      icon: themeForm.icon,
      isActive: true,
      createdAt: themeForm.id ? getThemes(true).find(t => t.id === themeForm.id)?.createdAt || new Date().toISOString() : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveTheme(theme);
    loadData();
    setIsThemeDialogOpen(false);
    setMessage({ type: 'success', text: themeForm.id ? 'Tema actualizado' : 'Tema creado' });
    setTimeout(() => setMessage(null), 3000);
  };

  // ============== TEST FUNCTIONS ==============
  
  const openTestDialog = (test?: Test) => {
    if (test) {
      setTestForm({
        id: test.id,
        title: test.title,
        description: test.description,
        themeId: test.themeId,
        timeLimit: test.timeLimit,
        passingScore: test.passingScore,
        questions: test.questions
      });
    } else {
      setTestForm({ id: '', title: '', description: '', themeId: themes[0]?.id || '', timeLimit: 15, passingScore: 7, questions: [] });
    }
    setIsTestDialogOpen(true);
  };

  const saveTestHandler = () => {
    if (!testForm.title.trim() || !testForm.themeId) {
      setMessage({ type: 'error', text: 'Completa todos los campos obligatorios' });
      return;
    }

    const test: Test = {
      id: testForm.id || `test-${Date.now()}`,
      title: testForm.title,
      description: testForm.description,
      themeId: testForm.themeId,
      timeLimit: testForm.timeLimit,
      passingScore: testForm.passingScore,
      questions: testForm.questions,
      isActive: true,
      createdAt: testForm.id ? getTests(true).find(t => t.id === testForm.id)?.createdAt || new Date().toISOString() : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveTest(test);
    loadData();
    setIsTestDialogOpen(false);
    setMessage({ type: 'success', text: testForm.id ? 'Test actualizado' : 'Test creado' });
    setTimeout(() => setMessage(null), 3000);
  };

  // ============== QUESTION FUNCTIONS ==============
  
  const openQuestionDialog = (question?: Question) => {
    if (question) {
      setQuestionForm({
        id: question.id,
        text: question.text,
        options: [...question.options],
        correctAnswer: question.correctAnswer,
        explanation: question.explanation,
        themeId: question.themeId
      });
    } else {
      setQuestionForm({ id: '', text: '', options: ['', '', '', ''], correctAnswer: 0, explanation: '', themeId: themes[0]?.id || '' });
    }
    setIsQuestionDialogOpen(true);
  };

  const saveQuestionHandler = () => {
    if (!questionForm.text.trim() || !questionForm.themeId || questionForm.options.some(o => !o.trim())) {
      setMessage({ type: 'error', text: 'Completa todos los campos obligatorios' });
      return;
    }

    const question: Question = {
      id: questionForm.id || `q-${Date.now()}`,
      text: questionForm.text,
      options: questionForm.options,
      correctAnswer: questionForm.correctAnswer,
      explanation: questionForm.explanation,
      themeId: questionForm.themeId,
      isActive: true,
      createdAt: questionForm.id ? getQuestions(true).find(q => q.id === questionForm.id)?.createdAt || new Date().toISOString() : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveQuestion(question);
    loadData();
    setIsQuestionDialogOpen(false);
    setMessage({ type: 'success', text: questionForm.id ? 'Pregunta actualizada' : 'Pregunta creada' });
    setTimeout(() => setMessage(null), 3000);
  };

  // ============== DELETE FUNCTIONS ==============
  
  const openDeleteDialog = (type: 'theme' | 'test' | 'question', item: any) => {
    setDeleteType(type);
    setDeleteItem(item);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = () => {
    if (!deleteItem) return;

    switch (deleteType) {
      case 'theme':
        deleteTheme(deleteItem.id);
        break;
      case 'test':
        deleteTest(deleteItem.id);
        break;
      case 'question':
        deleteQuestion(deleteItem.id);
        break;
    }

    loadData();
    setIsDeleteDialogOpen(false);
    setDeleteItem(null);
    setMessage({ type: 'success', text: 'Elemento eliminado correctamente' });
    setTimeout(() => setMessage(null), 3000);
  };

  // ============== TOGGLE FUNCTIONS ==============
  
  const toggleThemeExpansion = (themeId: string) => {
    setExpandedThemes(prev => 
      prev.includes(themeId) ? prev.filter(id => id !== themeId) : [...prev, themeId]
    );
  };

  const toggleThemeActive = (theme: Theme) => {
    theme.isActive = !theme.isActive;
    theme.updatedAt = new Date().toISOString();
    saveTheme(theme);
    loadData();
  };

  const toggleTestActive = (test: Test) => {
    test.isActive = !test.isActive;
    test.updatedAt = new Date().toISOString();
    saveTest(test);
    loadData();
  };

  const toggleQuestionActive = (question: Question) => {
    question.isActive = !question.isActive;
    question.updatedAt = new Date().toISOString();
    saveQuestion(question);
    loadData();
  };

  // ============== RENDER ==============

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-sm border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <Car className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Autoescuela Test</h1>
                <p className="text-xs text-muted-foreground">Gestión de Tests</p>
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
                onClick={() => navigate('/admin')}
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            Gestión de Tests
          </h2>
          <p className="text-muted-foreground">
            Administra temas, tests y preguntas. Los elementos eliminados se marcan como inactivos para preservar el historial.
          </p>
        </div>

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

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Total Temas</p>
                  <p className="text-3xl font-bold text-card-foreground">{themes.filter(t => t.isActive !== false).length}</p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <LayoutList className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Total Tests</p>
                  <p className="text-3xl font-bold text-card-foreground">{tests.filter(t => t.isActive !== false).length}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Total Preguntas</p>
                  <p className="text-3xl font-bold text-card-foreground">{questions.filter(q => q.isActive !== false).length}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                  <FileQuestion className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="themes" className="flex items-center gap-2">
              <LayoutList className="w-4 h-4" />
              Temas
            </TabsTrigger>
            <TabsTrigger value="tests" className="flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              Tests
            </TabsTrigger>
            <TabsTrigger value="questions" className="flex items-center gap-2">
              <FileQuestion className="w-4 h-4" />
              Preguntas
            </TabsTrigger>
          </TabsList>

          {/* THEMES TAB */}
          <TabsContent value="themes">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Lista de Temas</CardTitle>
                <Button onClick={() => openThemeDialog()} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Tema
                </Button>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Título</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead>Tests</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {themes.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                          No hay temas registrados
                        </TableCell>
                      </TableRow>
                    ) : (
                      themes.map((theme) => (
                        <TableRow key={theme.id} className={theme.isActive === false ? 'opacity-50' : ''}>
                          <TableCell className="font-medium">{theme.title}</TableCell>
                          <TableCell className="max-w-xs truncate">{theme.description}</TableCell>
                          <TableCell>{getTestsByTheme(theme.id, true).length}</TableCell>
                          <TableCell>
                            <Badge className={theme.isActive !== false ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}>
                              {theme.isActive !== false ? 'Activo' : 'Inactivo'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => toggleThemeActive(theme)}
                                className={theme.isActive !== false ? 'text-muted-foreground hover:text-foreground' : 'text-green-600 hover:text-green-700'}
                              >
                                {theme.isActive !== false ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openThemeDialog(theme)}
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950"
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => openDeleteDialog('theme', theme)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* TESTS TAB */}
          <TabsContent value="tests">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Lista de Tests</CardTitle>
                <Button onClick={() => openTestDialog()} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Nuevo Test
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {themes.filter(t => t.isActive !== false).map((theme) => {
                    const themeTests = getTestsByTheme(theme.id, true);
                    const isExpanded = expandedThemes.includes(theme.id);
                    
                    return (
                      <div key={theme.id} className="border rounded-lg overflow-hidden">
                        <button
                          onClick={() => toggleThemeExpansion(theme.id)}
                          className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                            <span className="font-semibold">{theme.title}</span>
                            <Badge variant="secondary">{themeTests.length} tests</Badge>
                          </div>
                        </button>
                        
                        {isExpanded && (
                          <div className="p-4">
                            {themeTests.length === 0 ? (
                              <p className="text-muted-foreground text-center py-4">No hay tests en este tema</p>
                            ) : (
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Título</TableHead>
                                    <TableHead>Preguntas</TableHead>
                                    <TableHead>Tiempo</TableHead>
                                    <TableHead>Aprobado</TableHead>
                                    <TableHead>Estado</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {themeTests.map((test) => (
                                    <TableRow key={test.id} className={test.isActive === false ? 'opacity-50' : ''}>
                                      <TableCell className="font-medium">{test.title}</TableCell>
                                      <TableCell>{test.questions.length}</TableCell>
                                      <TableCell>{test.timeLimit} min</TableCell>
                                      <TableCell>{test.passingScore}/{test.questions.length}</TableCell>
                                      <TableCell>
                                        <Badge className={test.isActive !== false ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'}>
                                          {test.isActive !== false ? 'Activo' : 'Inactivo'}
                                        </Badge>
                                      </TableCell>
                                      <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => toggleTestActive(test)}
                                            className={test.isActive !== false ? 'text-muted-foreground hover:text-foreground' : 'text-green-600 hover:text-green-700'}
                                          >
                                            {test.isActive !== false ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => openTestDialog(test)}
                                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950"
                                          >
                                            <Edit2 className="w-4 h-4" />
                                          </Button>
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => openDeleteDialog('test', test)}
                                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </Button>
                                        </div>
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* QUESTIONS TAB */}
          <TabsContent value="questions">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Lista de Preguntas</CardTitle>
                <Button onClick={() => openQuestionDialog()} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Nueva Pregunta
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {themes.filter(t => t.isActive !== false).map((theme) => {
                    const themeQuestions = getQuestionsByTheme(theme.id, true);
                    const isExpanded = expandedThemes.includes(theme.id);
                    
                    return (
                      <div key={theme.id} className="border rounded-lg overflow-hidden">
                        <button
                          onClick={() => toggleThemeExpansion(theme.id)}
                          className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                            <span className="font-semibold">{theme.title}</span>
                            <Badge variant="secondary">{themeQuestions.length} preguntas</Badge>
                          </div>
                        </button>
                        
                        {isExpanded && (
                          <div className="p-4">
                            {themeQuestions.length === 0 ? (
                              <p className="text-muted-foreground text-center py-4">No hay preguntas en este tema</p>
                            ) : (
                              <div className="space-y-3">
                                {themeQuestions.map((question) => (
                                  <div 
                                    key={question.id} 
                                    className={`p-4 border rounded-lg ${question.isActive === false ? 'opacity-50 bg-muted' : 'bg-card'}`}
                                  >
                                    <div className="flex items-start justify-between">
                                      <div className="flex-1">
                                        <p className="font-medium text-foreground mb-2">{question.text}</p>
                                        <div className="grid grid-cols-2 gap-2 mb-3">
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
                                        <p className="text-sm text-muted-foreground">
                                          <strong>Explicación:</strong> {question.explanation}
                                        </p>
                                      </div>
                                      <div className="flex items-center gap-2 ml-4">
                                        <Button
                                          variant="ghost"
                                          size="icon"
                                          onClick={() => toggleQuestionActive(question)}
                                          className={question.isActive !== false ? 'text-muted-foreground hover:text-foreground' : 'text-green-600 hover:text-green-700'}
                                        >
                                          {question.isActive !== false ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </Button>
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
                                          onClick={() => openDeleteDialog('question', question)}
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
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* THEME DIALOG */}
      <Dialog open={isThemeDialogOpen} onOpenChange={setIsThemeDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{themeForm.id ? 'Editar Tema' : 'Nuevo Tema'}</DialogTitle>
            <DialogDescription>
              Completa la información del tema.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Título *</Label>
              <Input
                value={themeForm.title}
                onChange={(e) => setThemeForm({ ...themeForm, title: e.target.value })}
                placeholder="Ej: Señales de Tráfico"
              />
            </div>
            <div className="space-y-2">
              <Label>Descripción *</Label>
              <Input
                value={themeForm.description}
                onChange={(e) => setThemeForm({ ...themeForm, description: e.target.value })}
                placeholder="Breve descripción del tema"
              />
            </div>
            <div className="space-y-2">
              <Label>Icono</Label>
              <select
                value={themeForm.icon}
                onChange={(e) => setThemeForm({ ...themeForm, icon: e.target.value })}
                className="w-full h-10 px-3 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {iconOptions.map(icon => (
                  <option key={icon.value} value={icon.value}>{icon.label}</option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsThemeDialogOpen(false)}>Cancelar</Button>
            <Button onClick={saveThemeHandler} className="bg-blue-600 hover:bg-blue-700">Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* TEST DIALOG */}
      <Dialog open={isTestDialogOpen} onOpenChange={setIsTestDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{testForm.id ? 'Editar Test' : 'Nuevo Test'}</DialogTitle>
            <DialogDescription>
              Completa la información del test.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Título *</Label>
              <Input
                value={testForm.title}
                onChange={(e) => setTestForm({ ...testForm, title: e.target.value })}
                placeholder="Ej: Test de Señales de Prohibición"
              />
            </div>
            <div className="space-y-2">
              <Label>Descripción</Label>
              <Input
                value={testForm.description}
                onChange={(e) => setTestForm({ ...testForm, description: e.target.value })}
                placeholder="Breve descripción del test"
              />
            </div>
            <div className="space-y-2">
              <Label>Tema *</Label>
              <select
                value={testForm.themeId}
                onChange={(e) => setTestForm({ ...testForm, themeId: e.target.value })}
                className="w-full h-10 px-3 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {themes.filter(t => t.isActive !== false).map(theme => (
                  <option key={theme.id} value={theme.id}>{theme.title}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tiempo límite (min)</Label>
                <Input
                  type="number"
                  min={1}
                  max={120}
                  value={testForm.timeLimit}
                  onChange={(e) => setTestForm({ ...testForm, timeLimit: parseInt(e.target.value) || 15 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Puntuación para aprobar</Label>
                <Input
                  type="number"
                  min={1}
                  max={testForm.questions.length || 20}
                  value={testForm.passingScore}
                  onChange={(e) => setTestForm({ ...testForm, passingScore: parseInt(e.target.value) || 7 })}
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTestDialogOpen(false)}>Cancelar</Button>
            <Button onClick={saveTestHandler} className="bg-blue-600 hover:bg-blue-700">Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* QUESTION DIALOG */}
      <Dialog open={isQuestionDialogOpen} onOpenChange={setIsQuestionDialogOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{questionForm.id ? 'Editar Pregunta' : 'Nueva Pregunta'}</DialogTitle>
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
            <div className="space-y-2">
              <Label>Tema *</Label>
              <select
                value={questionForm.themeId}
                onChange={(e) => setQuestionForm({ ...questionForm, themeId: e.target.value })}
                className="w-full h-10 px-3 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {themes.filter(t => t.isActive !== false).map(theme => (
                  <option key={theme.id} value={theme.id}>{theme.title}</option>
                ))}
              </select>
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
                    className="w-4 h-4 text-blue-600"
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
              <p className="text-sm text-gray-500">Selecciona el radio button de la respuesta correcta.</p>
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
            <Button variant="outline" onClick={() => setIsQuestionDialogOpen(false)}>Cancelar</Button>
            <Button onClick={saveQuestionHandler} className="bg-blue-600 hover:bg-blue-700">Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* DELETE DIALOG */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600">Confirmar Eliminación</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar <strong>{deleteItem?.title || deleteItem?.text?.substring(0, 50)}</strong>?
              <br /><br />
              <span className="text-amber-600">
                <AlertCircle className="w-4 h-4 inline mr-1" />
                Este elemento se marcará como inactivo para preservar el historial de resultados.
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancelar</Button>
            <Button onClick={handleDelete} variant="destructive">Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
