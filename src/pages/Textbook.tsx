import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';

import { 
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
  BookOpen,
  Image as ImageIcon,
  Type,
  ChevronUp,
  ChevronDown,
  Eye,
  Search,
  List,
  ChevronRight
} from 'lucide-react';
import { getThemes } from '@/services/storage';
import type { Theme } from '@/types';

// Tipo para los subtemas del libro de texto
interface TextbookSubtopic {
  id: string;
  title: string;
  content: string;
  imageBefore?: string;
  imageAfter?: string;
  order: number;
  isActive: boolean;
}

// Tipo para los temas del libro de texto
interface TextbookTopic {
  id: string;
  themeId: string;
  title: string;
  subtopics: TextbookSubtopic[];
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = 'autoescuela_textbook_v2';

// Funciones de almacenamiento
const getTextbookTopics = (includeInactive = false): TextbookTopic[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  let topics: TextbookTopic[] = data ? JSON.parse(data) : [];
  
  if (!includeInactive) {
    topics = topics.filter(t => t.isActive !== false);
    topics.forEach(topic => {
      topic.subtopics = topic.subtopics.filter(s => s.isActive !== false);
    });
  }
  
  topics.sort((a, b) => a.order - b.order);
  topics.forEach(topic => {
    topic.subtopics.sort((a, b) => a.order - b.order);
  });
  
  return topics;
};

const saveTextbookTopic = (topic: TextbookTopic): void => {
  const topics = getTextbookTopics(true);
  const existingIndex = topics.findIndex(t => t.id === topic.id);
  
  topic.updatedAt = new Date().toISOString();
  
  if (existingIndex >= 0) {
    topics[existingIndex] = topic;
  } else {
    topic.createdAt = new Date().toISOString();
    topics.push(topic);
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(topics));
};

const deleteTextbookTopic = (topicId: string): void => {
  const topics = getTextbookTopics(true);
  const topic = topics.find(t => t.id === topicId);
  if (topic) {
    topic.isActive = false;
    topic.updatedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(topics));
  }
};

export default function Textbook() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [topics, setTopics] = useState<TextbookTopic[]>([]);
  const [appThemes, setAppThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showIndex, setShowIndex] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTopicId, setSelectedTopicId] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Topic dialog state
  const [isTopicDialogOpen, setIsTopicDialogOpen] = useState(false);
  const [editingTopic, setEditingTopic] = useState<TextbookTopic | null>(null);
  const [topicForm, setTopicForm] = useState({
    id: '',
    title: '',
    themeId: '',
  });
  
  // Subtopic dialog state
  const [isSubtopicDialogOpen, setIsSubtopicDialogOpen] = useState(false);
  const [editingSubtopic, setEditingSubtopic] = useState<TextbookSubtopic | null>(null);
  const [parentTopicId, setParentTopicId] = useState<string>('');
  const [subtopicForm, setSubtopicForm] = useState({
    id: '',
    title: '',
    content: '',
    imageBefore: '',
    imageAfter: '',
  });
  
  // Delete dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: 'topic' | 'subtopic'; item: any; parentId?: string } | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
      return;
    }
    loadData();
  }, [isAuthenticated, navigate]);

  const loadData = () => {
    const loadedTopics = getTextbookTopics();
    setTopics(loadedTopics);
    setAppThemes(getThemes());
    setLoading(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Búsqueda en todo el libro
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    
    const results: { topicId: string; subtopicId: string; title: string; context: string }[] = [];
    const query = searchQuery.toLowerCase();
    
    topics.forEach(topic => {
      topic.subtopics.forEach(subtopic => {
        if (subtopic.title.toLowerCase().includes(query) || subtopic.content.toLowerCase().includes(query)) {
          const context = subtopic.content.substring(0, 100) + '...';
          results.push({
            topicId: topic.id,
            subtopicId: subtopic.id,
            title: `${topic.title} > ${subtopic.title}`,
            context
          });
        }
      });
    });
    
    return results;
  }, [searchQuery, topics]);

  const scrollToSubtopic = (topicId: string, subtopicId: string) => {
    setSelectedTopicId(topicId);
    setShowIndex(false);
    setTimeout(() => {
      const element = document.getElementById(`subtopic-${subtopicId}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 100);
  };

  const openTopicDialog = (topic?: TextbookTopic) => {
    if (topic) {
      setEditingTopic(topic);
      setTopicForm({
        id: topic.id,
        title: topic.title,
        themeId: topic.themeId,
      });
    } else {
      setEditingTopic(null);
      setTopicForm({
        id: '',
        title: '',
        themeId: appThemes[0]?.id || '',
      });
    }
    setIsTopicDialogOpen(true);
  };

  const saveTopicHandler = () => {
    if (!topicForm.title.trim()) {
      setMessage({ type: 'error', text: 'El título es obligatorio' });
      return;
    }

    const newTopic: TextbookTopic = {
      id: topicForm.id || `topic-${Date.now()}`,
      themeId: topicForm.themeId,
      title: topicForm.title,
      subtopics: editingTopic?.subtopics || [],
      order: editingTopic?.order ?? topics.length,
      isActive: true,
      createdAt: editingTopic?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveTextbookTopic(newTopic);
    loadData();
    setIsTopicDialogOpen(false);
    setMessage({ type: 'success', text: editingTopic ? 'Tema actualizado' : 'Tema añadido' });
    setTimeout(() => setMessage(null), 3000);
  };

  const openSubtopicDialog = (topicId: string, subtopic?: TextbookSubtopic) => {
    setParentTopicId(topicId);
    if (subtopic) {
      setEditingSubtopic(subtopic);
      setSubtopicForm({
        id: subtopic.id,
        title: subtopic.title,
        content: subtopic.content,
        imageBefore: subtopic.imageBefore || '',
        imageAfter: subtopic.imageAfter || '',
      });
    } else {
      setEditingSubtopic(null);
      setSubtopicForm({
        id: '',
        title: '',
        content: '',
        imageBefore: '',
        imageAfter: '',
      });
    }
    setIsSubtopicDialogOpen(true);
  };

  const saveSubtopicHandler = () => {
    if (!subtopicForm.title.trim()) {
      setMessage({ type: 'error', text: 'El título es obligatorio' });
      return;
    }

    const topic = getTextbookTopics(true).find(t => t.id === parentTopicId);
    if (!topic) return;

    const newSubtopic: TextbookSubtopic = {
      id: subtopicForm.id || `subtopic-${Date.now()}`,
      title: subtopicForm.title,
      content: subtopicForm.content,
      imageBefore: subtopicForm.imageBefore || undefined,
      imageAfter: subtopicForm.imageAfter || undefined,
      order: editingSubtopic?.order ?? topic.subtopics.length,
      isActive: true,
    };

    if (editingSubtopic) {
      const index = topic.subtopics.findIndex(s => s.id === editingSubtopic.id);
      if (index >= 0) {
        topic.subtopics[index] = newSubtopic;
      }
    } else {
      topic.subtopics.push(newSubtopic);
    }

    saveTextbookTopic(topic);
    loadData();
    setIsSubtopicDialogOpen(false);
    setMessage({ type: 'success', text: editingSubtopic ? 'Subtema actualizado' : 'Subtema añadido' });
    setTimeout(() => setMessage(null), 3000);
  };

  const openDeleteDialog = (type: 'topic' | 'subtopic', item: any, parentId?: string) => {
    setItemToDelete({ type, item, parentId });
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = () => {
    if (!itemToDelete) return;

    if (itemToDelete.type === 'topic') {
      deleteTextbookTopic(itemToDelete.item.id);
    } else if (itemToDelete.type === 'subtopic' && itemToDelete.parentId) {
      const topic = getTextbookTopics(true).find(t => t.id === itemToDelete.parentId);
      if (topic) {
        const subtopic = topic.subtopics.find(s => s.id === itemToDelete.item.id);
        if (subtopic) {
          subtopic.isActive = false;
          saveTextbookTopic(topic);
        }
      }
    }

    loadData();
    setIsDeleteDialogOpen(false);
    setItemToDelete(null);
    setMessage({ type: 'success', text: 'Elemento eliminado' });
    setTimeout(() => setMessage(null), 3000);
  };

  const moveTopic = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= topics.length) return;
    
    const allTopics = getTextbookTopics(true);
    [allTopics[index], allTopics[newIndex]] = [allTopics[newIndex], allTopics[index]];
    allTopics.forEach((t, i) => { t.order = i; saveTextbookTopic(t); });
    loadData();
  };

  const moveSubtopic = (topicId: string, index: number, direction: 'up' | 'down') => {
    const topic = getTextbookTopics(true).find(t => t.id === topicId);
    if (!topic) return;
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= topic.subtopics.length) return;
    
    [topic.subtopics[index], topic.subtopics[newIndex]] = [topic.subtopics[newIndex], topic.subtopics[index]];
    topic.subtopics.forEach((s, i) => { s.order = i; });
    saveTextbookTopic(topic);
    loadData();
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'before' | 'after') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      if (target === 'before') {
        setSubtopicForm({ ...subtopicForm, imageBefore: reader.result as string });
      } else {
        setSubtopicForm({ ...subtopicForm, imageAfter: reader.result as string });
      }
    };
    reader.readAsDataURL(file);
  };

  const removeImage = (target: 'before' | 'after') => {
    if (target === 'before') {
      setSubtopicForm({ ...subtopicForm, imageBefore: '' });
    } else {
      setSubtopicForm({ ...subtopicForm, imageAfter: '' });
    }
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

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card shadow-sm border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Autoescuela Xinzo Tests</h1>
                <p className="text-xs text-muted-foreground">Libro de Texto</p>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
              {/* Botón Modo Oscuro */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="text-muted-foreground hover:text-foreground"
              >
                {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              </Button>
              
              {/* Botón Índice */}
              <Button
                variant={showIndex ? 'default' : 'outline'}
                size="sm"
                onClick={() => setShowIndex(!showIndex)}
                className="hidden sm:flex items-center gap-2"
              >
                <List className="w-4 h-4" />
                Índice
              </Button>
              
              {/* Botón Modo Edición (solo admin) */}
              {isAdmin && (
                <Button
                  variant={isEditMode ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setIsEditMode(!isEditMode)}
                  className="flex items-center gap-2"
                >
                  {isEditMode ? <Eye className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                  <span className="hidden sm:inline">{isEditMode ? 'Ver' : 'Editar'}</span>
                </Button>
              )}
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2"
              >
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

              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="text-muted-foreground hover:text-red-600"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex">
        {/* Sidebar - Índice */}
        {showIndex && (
          <aside className="w-80 bg-card border-r border-border h-[calc(100vh-64px)] sticky top-16 overflow-y-auto hidden lg:block">
            <div className="p-4">
              <h2 className="font-bold text-lg mb-4 flex items-center gap-2">
                <List className="w-5 h-5" />
                Índice
              </h2>
              
              {/* Búsqueda */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Buscar en el libro..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              {/* Resultados de búsqueda */}
              {searchQuery && (
                <div className="mb-4 p-3 bg-muted rounded-lg">
                  <p className="text-sm font-medium mb-2">Resultados:</p>
                  {searchResults.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No se encontraron resultados</p>
                  ) : (
                    <div className="space-y-2">
                      {searchResults.map((result, idx) => (
                        <button
                          key={idx}
                          onClick={() => scrollToSubtopic(result.topicId, result.subtopicId)}
                          className="w-full text-left text-sm p-2 hover:bg-background rounded transition-colors"
                        >
                          <p className="font-medium text-primary">{result.title}</p>
                          <p className="text-xs text-muted-foreground truncate">{result.context}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              
              {/* Índice de temas */}
              <div className="space-y-2">
                {topics.map((topic, topicIndex) => (
                  <div key={topic.id}>
                    <button
                      onClick={() => {
                        setSelectedTopicId(topic.id);
                        setShowIndex(true);
                      }}
                      className={`w-full text-left p-2 rounded-lg font-medium flex items-center gap-2 transition-colors ${
                        selectedTopicId === topic.id ? 'bg-primary/10 text-primary' : 'hover:bg-muted'
                      }`}
                    >
                      <ChevronRight className={`w-4 h-4 transition-transform ${selectedTopicId === topic.id ? 'rotate-90' : ''}`} />
                      {topicIndex + 1}. {topic.title}
                    </button>
                    {selectedTopicId === topic.id && topic.subtopics.length > 0 && (
                      <div className="ml-4 mt-1 space-y-1">
                        {topic.subtopics.map((subtopic, idx) => (
                          <button
                            key={subtopic.id}
                            onClick={() => scrollToSubtopic(topic.id, subtopic.id)}
                            className="w-full text-left text-sm p-2 hover:bg-muted rounded transition-colors text-muted-foreground hover:text-foreground"
                          >
                            {topicIndex + 1}.{idx + 1} {subtopic.title}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </aside>
        )}

        {/* Main Content Area */}
        <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Messages */}
          {message && (
            <Alert className={`mb-6 ${message.type === 'success' ? 'bg-green-50 border-green-200 dark:bg-green-950/30' : 'bg-red-50 border-red-200 dark:bg-red-950/30'}`}>
              {message.type === 'success' ? <CheckCircle className="h-4 w-4 text-green-600" /> : <AlertCircle className="h-4 w-4 text-red-600" />}
              <AlertDescription>{message.text}</AlertDescription>
            </Alert>
          )}

          {/* Page Header */}
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold text-foreground mb-2">Manual del Conductor</h2>
            <p className="text-muted-foreground">Material oficial para la preparación del examen teórico</p>
            {isAdmin && (
              <Badge variant={isEditMode ? 'default' : 'secondary'} className="mt-3">
                {isEditMode ? 'Modo Edición' : 'Modo Vista'}
              </Badge>
            )}
          </div>

          {/* Add Topic Button */}
          {isAdmin && isEditMode && (
            <div className="mb-6">
              <Button onClick={() => openTopicDialog()} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Añadir Nuevo Tema
              </Button>
            </div>
          )}

          {/* Topics */}
          {topics.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-medium mb-2">Libro de texto vacío</h3>
                <p className="text-muted-foreground mb-4">
                  {isAdmin ? 'Añade temas y subtemas con contenido teórico.' : 'El contenido estará disponible pronto.'}
                </p>
                {isAdmin && <Button onClick={() => openTopicDialog()}><Plus className="w-4 h-4 mr-2" />Añadir primer tema</Button>}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-12">
              {topics.map((topic, topicIndex) => (
                <div key={topic.id} id={`topic-${topic.id}`} className="scroll-mt-20">
                  {/* Topic Header */}
                  <div className="border-b-2 border-primary pb-4 mb-6">
                    <div className="flex items-center justify-between">
                      <h3 className="text-2xl font-bold text-foreground">
                        Tema {topicIndex + 1}: {topic.title}
                      </h3>
                      {isAdmin && isEditMode && (
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="icon" onClick={() => moveTopic(topicIndex, 'up')} disabled={topicIndex === 0}>
                            <ChevronUp className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => moveTopic(topicIndex, 'down')} disabled={topicIndex === topics.length - 1}>
                            <ChevronDown className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openTopicDialog(topic)}>
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openDeleteDialog('topic', topic)} className="text-red-600">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Subtopics */}
                  <div className="space-y-8">
                    {topic.subtopics.map((subtopic, subtopicIndex) => (
                      <Card key={subtopic.id} id={`subtopic-${subtopic.id}`} className="overflow-hidden">
                        {isAdmin && isEditMode && (
                          <div className="bg-muted px-4 py-2 flex items-center justify-between border-b">
                            <span className="text-sm text-muted-foreground">Subtema {subtopicIndex + 1}</span>
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="icon" onClick={() => moveSubtopic(topic.id, subtopicIndex, 'up')} disabled={subtopicIndex === 0}>
                                <ChevronUp className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => moveSubtopic(topic.id, subtopicIndex, 'down')} disabled={subtopicIndex === topic.subtopics.length - 1}>
                                <ChevronDown className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => openSubtopicDialog(topic.id, subtopic)}>
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => openDeleteDialog('subtopic', subtopic, topic.id)} className="text-red-600">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        )}
                        
                        <CardContent className="p-6">
                          <h4 className="text-xl font-semibold text-foreground mb-4">{subtopic.title}</h4>
                          
                          {/* Image Before */}
                          {subtopic.imageBefore && (
                            <div className="mb-6">
                              <img src={subtopic.imageBefore} alt="" className="w-full max-h-80 object-contain rounded-lg border" />
                            </div>
                          )}
                          
                          {/* Content */}
                          <div className="prose dark:prose-invert max-w-none">
                            {subtopic.content.split('\n').map((paragraph, idx) => (
                              <p key={idx} className="text-foreground mb-4 leading-relaxed text-lg">{paragraph}</p>
                            ))}
                          </div>
                          
                          {/* Image After */}
                          {subtopic.imageAfter && (
                            <div className="mt-6">
                              <img src={subtopic.imageAfter} alt="" className="w-full max-h-80 object-contain rounded-lg border" />
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Add Subtopic Button */}
                  {isAdmin && isEditMode && (
                    <div className="mt-4">
                      <Button variant="outline" onClick={() => openSubtopicDialog(topic.id)} className="w-full">
                        <Plus className="w-4 h-4 mr-2" />
                        Añadir Subtema
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Topic Dialog */}
      <Dialog open={isTopicDialogOpen} onOpenChange={setIsTopicDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTopic ? 'Editar Tema' : 'Nuevo Tema'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Título</Label>
              <Input value={topicForm.title} onChange={(e) => setTopicForm({ ...topicForm, title: e.target.value })} placeholder="Ej: Señales de Tráfico" />
            </div>
            <div className="space-y-2">
              <Label>Tema asociado</Label>
              <select
                value={topicForm.themeId}
                onChange={(e) => setTopicForm({ ...topicForm, themeId: e.target.value })}
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
              >
                {appThemes.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTopicDialogOpen(false)}>Cancelar</Button>
            <Button onClick={saveTopicHandler}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Subtopic Dialog */}
      <Dialog open={isSubtopicDialogOpen} onOpenChange={setIsSubtopicDialogOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingSubtopic ? 'Editar Subtema' : 'Nuevo Subtema'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Título</Label>
              <Input value={subtopicForm.title} onChange={(e) => setSubtopicForm({ ...subtopicForm, title: e.target.value })} placeholder="Título del subtema" />
            </div>
            
            {/* Image Before */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><ImageIcon className="w-4 h-4" /> Imagen antes del texto</Label>
              {subtopicForm.imageBefore ? (
                <div className="relative">
                  <img src={subtopicForm.imageBefore} alt="" className="w-full max-h-40 object-contain rounded border" />
                  <Button variant="destructive" size="sm" onClick={() => removeImage('before')} className="absolute top-2 right-2"><X className="w-4 h-4" /></Button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'before')} id="img-before" />
                  <label htmlFor="img-before" className="cursor-pointer">
                    <ImageIcon className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <span className="text-sm text-muted-foreground">Haz clic para subir imagen</span>
                  </label>
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Type className="w-4 h-4" /> Contenido</Label>
              <textarea
                value={subtopicForm.content}
                onChange={(e) => setSubtopicForm({ ...subtopicForm, content: e.target.value })}
                placeholder="Escribe el contenido..."
                className="w-full px-3 py-2 rounded-md border border-input bg-background min-h-[200px] resize-y"
              />
            </div>
            
            {/* Image After */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2"><ImageIcon className="w-4 h-4" /> Imagen después del texto</Label>
              {subtopicForm.imageAfter ? (
                <div className="relative">
                  <img src={subtopicForm.imageAfter} alt="" className="w-full max-h-40 object-contain rounded border" />
                  <Button variant="destructive" size="sm" onClick={() => removeImage('after')} className="absolute top-2 right-2"><X className="w-4 h-4" /></Button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-border rounded-lg p-4 text-center">
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'after')} id="img-after" />
                  <label htmlFor="img-after" className="cursor-pointer">
                    <ImageIcon className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                    <span className="text-sm text-muted-foreground">Haz clic para subir imagen</span>
                  </label>
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSubtopicDialogOpen(false)}>Cancelar</Button>
            <Button onClick={saveSubtopicHandler}><Save className="w-4 h-4 mr-2" />Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">Eliminar</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de eliminar <strong>{itemToDelete?.item?.title}</strong>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleDelete}><Trash2 className="w-4 h-4 mr-2" />Eliminar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
