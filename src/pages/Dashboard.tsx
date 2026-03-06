import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Car, 
  LogOut, 
  User, 
  ChevronRight, 
  BookOpen, 
  TrafficCone, 
  Route, 
  ShieldCheck, 
  Wrench, 
  Leaf,
  Clock,
  CheckCircle,
  AlertCircle,
  BarChart3,
  Users,
  Moon,
  Sun,
  Edit2
} from 'lucide-react';
import { getThemes, getTestsByTheme, getUserResults, getTestWithQuestions } from '@/services/storage';
import type { Theme, TestResult } from '@/types';

const iconMap: Record<string, React.ElementType> = {
  'traffic-cone': TrafficCone,
  'route': Route,
  'shield-check': ShieldCheck,
  'wrench': Wrench,
  'leaf': Leaf,
};

export default function Dashboard() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [themes, setThemes] = useState<Theme[]>([]);
  const [userResults, setUserResults] = useState<TestResult[]>([]);
  const [expandedTheme, setExpandedTheme] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
      return;
    }

    setThemes(getThemes());
    if (user) {
      setUserResults(getUserResults(user.id));
    }
  }, [isAuthenticated, navigate, user]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getThemeTests = (themeId: string) => {
    return getTestsByTheme(themeId);
  };

  const getTestResult = (testId: string) => {
    return userResults.find(r => r.testId === testId);
  };

  const getThemeProgress = (themeId: string) => {
    const tests = getThemeTests(themeId);
    if (tests.length === 0) return 0;
    
    const completedTests = tests.filter(t => getTestResult(t.id)).length;
    return Math.round((completedTests / tests.length) * 100);
  };

  const getTotalProgress = () => {
    const allTests = themes.flatMap(t => getThemeTests(t.id));
    if (allTests.length === 0) return 0;
    
    const completedTests = allTests.filter(t => getTestResult(t.id)).length;
    return Math.round((completedTests / allTests.length) * 100);
  };

  const getPassedTests = () => {
    return userResults.filter(r => {
      const test = getTestWithQuestions(r.testId);
      return test && r.score >= test.passingScore;
    }).length;
  };

  const getFailedTests = () => {
    return userResults.filter(r => {
      const test = getTestWithQuestions(r.testId);
      return test && r.score < test.passingScore;
    }).length;
  };

  const toggleThemeExpansion = (themeId: string) => {
    setExpandedTheme(expandedTheme === themeId ? null : themeId);
  };

  const startTest = (testId: string) => {
    navigate(`/test/${testId}`);
  };

  if (!user) return null;

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
                <p className="text-xs text-muted-foreground">Plataforma de aprendizaje</p>
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
              
              {/* Botón Libro de Texto */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/textbook')}
                className="hidden sm:flex items-center gap-2"
              >
                <BookOpen className="w-4 h-4" />
                Libro de Texto
              </Button>
              
              {isAdmin && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate('/admin')}
                  className="hidden sm:flex items-center gap-2"
                >
                  <Users className="w-4 h-4" />
                  Gestión de Usuarios
                </Button>
              )}
              
              <div className="flex items-center gap-3">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-foreground">{user.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{user.role === 'admin' ? 'Administrador' : 'Estudiante'}</p>
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
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm">Tests Completados</p>
                  <p className="text-3xl font-bold">{userResults.length}</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm">Tests Aprobados</p>
                  <p className="text-3xl font-bold">{getPassedTests()}</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm">Tests Suspendidos</p>
                  <p className="text-3xl font-bold">{getFailedTests()}</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm">Progreso Total</p>
                  <p className="text-3xl font-bold">{getTotalProgress()}%</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
              </div>
              <Progress value={getTotalProgress()} className="mt-3 bg-white/30" />
            </CardContent>
          </Card>
        </div>

        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-foreground mb-2">
            ¡Bienvenido, {user.name}!
          </h2>
          <p className="text-muted-foreground">
            Selecciona un tema para comenzar a practicar con los tests de autoescuela.
          </p>
        </div>

        {/* Themes Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {themes.map((theme) => {
            const ThemeIcon = iconMap[theme.icon] || BookOpen;
            const progress = getThemeProgress(theme.id);
            const tests = getThemeTests(theme.id);
            const isExpanded = expandedTheme === theme.id;

            return (
              <Card key={theme.id} className="overflow-hidden border-border hover:shadow-lg transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center">
                        <ThemeIcon className="w-7 h-7 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-lg text-card-foreground">{theme.title}</CardTitle>
                        <CardDescription className="text-sm text-muted-foreground">
                          {theme.description}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-primary/10 text-primary">
                      {tests.length} tests
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">Progreso</span>
                      <span className="font-medium text-foreground">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>

                  <Button
                    variant="outline"
                    className="w-full justify-between"
                    onClick={() => toggleThemeExpansion(theme.id)}
                  >
                    <span>{isExpanded ? 'Ocultar tests' : 'Ver tests disponibles'}</span>
                    <ChevronRight className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                  </Button>

                  {isExpanded && (
                    <div className="mt-4 space-y-3">
                      <div className="border-t border-border pt-4">
                        <h4 className="text-sm font-semibold text-foreground mb-3">Tests disponibles:</h4>
                        <div className="space-y-2">
                          {tests.map((test) => {
                            const result = getTestResult(test.id);
                            const testWithQuestions = getTestWithQuestions(test.id);
                            const questionCount = testWithQuestions?.questionData.length || 0;
                            const isPassed = result && result.score >= test.passingScore;
                            const isFailed = result && result.score < test.passingScore;

                            return (
                              <div
                                key={test.id}
                                className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                    isPassed ? 'bg-green-100 dark:bg-green-900' : isFailed ? 'bg-red-100 dark:bg-red-900' : 'bg-gray-200 dark:bg-gray-700'
                                  }`}>
                                    {isPassed ? (
                                      <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                                    ) : isFailed ? (
                                      <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                                    ) : (
                                      <Clock className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                    )}
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium text-foreground">{test.title}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {questionCount} preguntas • {test.timeLimit} min
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-3">
                                  {result && (
                                    <Badge className={`${
                                      isPassed ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                                    }`}>
                                      {result.score}/{questionCount}
                                    </Badge>
                                  )}
                                  {isAdmin && (
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => navigate(`/admin/tests/edit/${test.id}`)}
                                      className="border-orange-300 text-orange-600 hover:bg-orange-50 dark:border-orange-700 dark:text-orange-400 dark:hover:bg-orange-950"
                                    >
                                      <Edit2 className="w-4 h-4 mr-1" />
                                      Editar
                                    </Button>
                                  )}
                                  <Button
                                    size="sm"
                                    onClick={() => startTest(test.id)}
                                    className="bg-primary hover:bg-primary/90"
                                  >
                                    {result ? 'Repetir' : 'Iniciar'}
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </main>
    </div>
  );
}
