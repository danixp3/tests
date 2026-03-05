import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Target, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  BookOpen,
  Clock,
  Award,
  AlertTriangle
} from 'lucide-react';
import { getStudentStats, getUserResults } from '@/services/storage';
import type { StudentStats, TestResult } from '@/types';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  Cell
} from 'recharts';

interface StudentAnalyticsProps {
  userId: string;
  userName: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function StudentAnalytics({ userId, userName, isOpen, onClose }: StudentAnalyticsProps) {
  const [stats, setStats] = useState<StudentStats | null>(null);
  const [results, setResults] = useState<TestResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen && userId) {
      loadData();
    }
  }, [isOpen, userId]);

  const loadData = () => {
    setLoading(true);
    const studentStats = getStudentStats(userId);
    const userResults = getUserResults(userId);
    setStats(studentStats);
    setResults(userResults.reverse()); // Más recientes primero
    setLoading(false);
  };

  const getErrorRateColor = (errorRate: number) => {
    if (errorRate < 20) return 'text-green-600 bg-green-50 border-green-200';
    if (errorRate < 40) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getErrorRateIcon = (errorRate: number) => {
    if (errorRate < 20) return <CheckCircle className="w-5 h-5 text-green-600" />;
    if (errorRate < 40) return <AlertCircle className="w-5 h-5 text-yellow-600" />;
    return <AlertTriangle className="w-5 h-5 text-red-600" />;
  };

  // Preparar datos para el gráfico de barras
  const getChartData = () => {
    if (!stats) return [];
    return stats.themeStats.map(stat => ({
      name: stat.themeName.length > 15 ? stat.themeName.substring(0, 15) + '...' : stat.themeName,
      fullName: stat.themeName,
      errorRate: stat.errorRate,
      correctRate: Math.round((stat.correctAnswers / stat.totalQuestions) * 100),
      totalQuestions: stat.totalQuestions,
      correctAnswers: stat.correctAnswers,
      incorrectAnswers: stat.incorrectAnswers,
    }));
  };

  const getBarColor = (errorRate: number) => {
    if (errorRate < 20) return '#22c55e'; // verde
    if (errorRate < 40) return '#eab308'; // amarillo
    return '#ef4444'; // rojo
  };

  if (loading || !stats) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const chartData = getChartData();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-blue-600" />
            </div>
            Análisis de Rendimiento: {userName}
          </DialogTitle>
        </DialogHeader>

        {/* Overview Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-xs">Tests Realizados</p>
                  <p className="text-2xl font-bold">{stats.totalTests}</p>
                </div>
                <BookOpen className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-xs">Aprobados</p>
                  <p className="text-2xl font-bold text-green-600">{stats.passedTests}</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-xs">Suspendidos</p>
                  <p className="text-2xl font-bold text-red-600">{stats.failedTests}</p>
                </div>
                <XCircle className="w-8 h-8 text-red-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-xs">Nota Media</p>
                  <p className="text-2xl font-bold">{stats.averageScore}%</p>
                </div>
                <Award className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="chart" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="chart" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Gráfico
            </TabsTrigger>
            <TabsTrigger value="themes" className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              Por Temas
            </TabsTrigger>
            <TabsTrigger value="weaknesses" className="flex items-center gap-2">
              <TrendingDown className="w-4 h-4" />
              Puntos Débiles
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Historial
            </TabsTrigger>
          </TabsList>

          {/* CHART TAB */}
          <TabsContent value="chart" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Gráfico de Porcentaje de Error por Tema
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats.themeStats.length === 0 ? (
                  <Alert>
                    <AlertCircle className="w-4 h-4" />
                    <AlertDescription>
                      El estudiante aún no ha completado ningún test.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-6">
                    {/* Gráfico de Barras */}
                    <div className="h-80 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={chartData}
                          margin={{
                            top: 20,
                            right: 30,
                            left: 20,
                            bottom: 60,
                          }}
                        >
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="name" 
                            angle={-45}
                            textAnchor="end"
                            height={80}
                            interval={0}
                          />
                          <YAxis 
                            label={{ value: '% de Error', angle: -90, position: 'insideLeft' }}
                            domain={[0, 100]}
                          />
                          <Tooltip 
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                  <div className="bg-white p-3 border rounded shadow-lg">
                                    <p className="font-semibold text-gray-900">{data.fullName}</p>
                                    <p className="text-red-600">{data.errorRate}% de error</p>
                                    <p className="text-green-600">{data.correctRate}% de acierto</p>
                                    <p className="text-gray-500 text-sm mt-1">
                                      {data.correctAnswers} correctas / {data.incorrectAnswers} incorrectas
                                    </p>
                                    <p className="text-gray-500 text-sm">
                                      Total: {data.totalQuestions} preguntas
                                    </p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Legend />
                          <Bar 
                            dataKey="errorRate" 
                            name="% de Error" 
                            radius={[4, 4, 0, 0]}
                          >
                            {chartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={getBarColor(entry.errorRate)} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Leyenda de colores */}
                    <div className="flex justify-center gap-6 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-green-500 rounded"></div>
                        <span>Buen rendimiento (&lt;20% error)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-yellow-500 rounded"></div>
                        <span>Rendimiento medio (20-40% error)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-red-500 rounded"></div>
                        <span>Necesita mejora (&gt;40% error)</span>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* THEME ANALYSIS */}
          <TabsContent value="themes" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Desglose por Temas
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats.themeStats.length === 0 ? (
                  <Alert>
                    <AlertCircle className="w-4 h-4" />
                    <AlertDescription>
                      El estudiante aún no ha completado ningún test.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-4">
                    {stats.themeStats.map((themeStat) => (
                      <div key={themeStat.themeId} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <h4 className="font-semibold text-gray-900">{themeStat.themeName}</h4>
                            <Badge className={getErrorRateColor(themeStat.errorRate)}>
                              {themeStat.errorRate}% de error
                            </Badge>
                          </div>
                          {getErrorRateIcon(themeStat.errorRate)}
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 mb-3">
                          <div className="text-center p-2 bg-gray-50 rounded">
                            <p className="text-xs text-gray-500">Total Preguntas</p>
                            <p className="font-semibold">{themeStat.totalQuestions}</p>
                          </div>
                          <div className="text-center p-2 bg-green-50 rounded">
                            <p className="text-xs text-green-600">Correctas</p>
                            <p className="font-semibold text-green-700">{themeStat.correctAnswers}</p>
                          </div>
                          <div className="text-center p-2 bg-red-50 rounded">
                            <p className="text-xs text-red-600">Incorrectas</p>
                            <p className="font-semibold text-red-700">{themeStat.incorrectAnswers}</p>
                          </div>
                        </div>
                        
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-600">Progreso</span>
                            <span className="font-medium">
                              {Math.round((themeStat.correctAnswers / themeStat.totalQuestions) * 100)}% aciertos
                            </span>
                          </div>
                          <Progress 
                            value={(themeStat.correctAnswers / themeStat.totalQuestions) * 100} 
                            className="h-2"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* WEAKNESSES */}
          <TabsContent value="weaknesses" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <TrendingDown className="w-5 h-5" />
                  Áreas de Mejora
                </CardTitle>
              </CardHeader>
              <CardContent>
                {stats.weakAreas.length === 0 ? (
                  <Alert className="bg-green-50 border-green-200">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <AlertDescription className="text-green-700">
                      ¡Excelente! El estudiante no tiene áreas débiles significativas (menos del 30% de error en todos los temas).
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-4">
                    <Alert className="bg-red-50 border-red-200">
                      <AlertTriangle className="w-4 h-4 text-red-600" />
                      <AlertDescription className="text-red-700">
                        Se han identificado {stats.weakAreas.length} tema(s) donde el estudiante tiene más dificultades (más del 30% de error).
                      </AlertDescription>
                    </Alert>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {stats.themeStats
                        .filter(stat => stats.weakAreas.includes(stat.themeId))
                        .map((themeStat) => (
                          <div key={themeStat.themeId} className="border-2 border-red-200 rounded-lg p-4 bg-red-50">
                            <div className="flex items-center gap-2 mb-2">
                              <AlertTriangle className="w-5 h-5 text-red-600" />
                              <h4 className="font-semibold text-red-900">{themeStat.themeName}</h4>
                            </div>
                            <p className="text-sm text-red-700 mb-3">
                              {themeStat.errorRate}% de preguntas incorrectas
                            </p>
                            <div className="text-sm text-red-600">
                              <p>• {themeStat.incorrectAnswers} fallos de {themeStat.totalQuestions} preguntas</p>
                              <p>• Recomendado: Repasar este tema</p>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {stats.strongAreas.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-green-600" />
                      Fortalezas
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {stats.themeStats
                        .filter(stat => stats.strongAreas.includes(stat.themeId))
                        .map((themeStat) => (
                          <div key={themeStat.themeId} className="border-2 border-green-200 rounded-lg p-4 bg-green-50">
                            <div className="flex items-center gap-2 mb-2">
                              <CheckCircle className="w-5 h-5 text-green-600" />
                              <h4 className="font-semibold text-green-900">{themeStat.themeName}</h4>
                            </div>
                            <p className="text-sm text-green-700">
                              Solo {themeStat.errorRate}% de error - ¡Muy bien!
                            </p>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* HISTORY */}
          <TabsContent value="history" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Historial de Tests
                </CardTitle>
              </CardHeader>
              <CardContent>
                {results.length === 0 ? (
                  <Alert>
                    <AlertCircle className="w-4 h-4" />
                    <AlertDescription>
                      No hay tests completados aún.
                    </AlertDescription>
                  </Alert>
                ) : (
                  <div className="space-y-3">
                    {results.map((result) => {
                      const passed = result.score >= result.totalQuestions * 0.7;
                      return (
                        <div 
                          key={result.id} 
                          className={`border rounded-lg p-4 ${passed ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-semibold">{result.testTitle}</h4>
                                <Badge className={passed ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                                  {passed ? 'Aprobado' : 'Suspendido'}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-500">{result.themeName}</p>
                            </div>
                            <div className="text-right">
                              <p className={`text-2xl font-bold ${passed ? 'text-green-600' : 'text-red-600'}`}>
                                {result.score}/{result.totalQuestions}
                              </p>
                              <p className="text-xs text-gray-500">
                                {new Date(result.completedAt).toLocaleDateString('es-ES')}
                              </p>
                            </div>
                          </div>
                          
                          {/* Question breakdown */}
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="text-sm font-medium text-gray-700 mb-2">Desglose de respuestas:</p>
                            <div className="flex flex-wrap gap-1">
                              {result.questionResults?.map((qr, idx) => (
                                <div
                                  key={idx}
                                  className={`w-6 h-6 rounded flex items-center justify-center text-xs font-medium ${
                                    qr.isCorrect 
                                      ? 'bg-green-200 text-green-800' 
                                      : 'bg-red-200 text-red-800'
                                  }`}
                                  title={`${qr.questionText.substring(0, 50)}...`}
                                >
                                  {idx + 1}
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
