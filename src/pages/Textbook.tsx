import { useState, useEffect, useRef } from 'react';
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
  Eye
} from 'lucide-react';

// Tipo para las secciones del libro de texto
interface TextbookSection {
  id: string;
  title: string;
  content: string;
  imageUrl?: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const STORAGE_KEY = 'autoescuela_textbook';

// Funciones de almacenamiento
const getTextbookSections = (includeInactive = false): TextbookSection[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  let sections: TextbookSection[] = data ? JSON.parse(data) : [];
  
  if (!includeInactive) {
    sections = sections.filter(s => s.isActive !== false);
  }
  
  // Ordenar por order
  sections.sort((a, b) => a.order - b.order);
  
  return sections;
};

const saveTextbookSection = (section: TextbookSection): void => {
  const sections = getTextbookSections(true);
  const existingIndex = sections.findIndex(s => s.id === section.id);
  
  section.updatedAt = new Date().toISOString();
  
  if (existingIndex >= 0) {
    sections[existingIndex] = section;
  } else {
    section.createdAt = new Date().toISOString();
    sections.push(section);
  }
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sections));
};

const deleteTextbookSection = (sectionId: string): void => {
  const sections = getTextbookSections(true);
  const section = sections.find(s => s.id === sectionId);
  if (section) {
    section.isActive = false;
    section.updatedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sections));
  }
};

export default function Textbook() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [sections, setSections] = useState<TextbookSection[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditMode, setIsEditMode] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Section dialog state
  const [isSectionDialogOpen, setIsSectionDialogOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<TextbookSection | null>(null);
  const [sectionForm, setSectionForm] = useState({
    id: '',
    title: '',
    content: '',
    imageUrl: '',
  });
  
  // Delete dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [sectionToDelete, setSectionToDelete] = useState<TextbookSection | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/');
      return;
    }
    loadData();
  }, [isAuthenticated, navigate]);

  const loadData = () => {
    const loadedSections = getTextbookSections();
    setSections(loadedSections);
    setLoading(false);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const openSectionDialog = (section?: TextbookSection) => {
    if (section) {
      setEditingSection(section);
      setSectionForm({
        id: section.id,
        title: section.title,
        content: section.content,
        imageUrl: section.imageUrl || '',
      });
    } else {
      setEditingSection(null);
      setSectionForm({
        id: '',
        title: '',
        content: '',
        imageUrl: '',
      });
    }
    setIsSectionDialogOpen(true);
  };

  const saveSectionHandler = () => {
    if (!sectionForm.title.trim()) {
      setMessage({ type: 'error', text: 'El título es obligatorio' });
      return;
    }

    const newSection: TextbookSection = {
      id: sectionForm.id || `section-${Date.now()}`,
      title: sectionForm.title,
      content: sectionForm.content,
      imageUrl: sectionForm.imageUrl || undefined,
      order: editingSection ? editingSection.order : sections.length,
      isActive: true,
      createdAt: editingSection?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    saveTextbookSection(newSection);
    loadData();
    setIsSectionDialogOpen(false);
    setMessage({ type: 'success', text: editingSection ? 'Sección actualizada' : 'Sección añadida' });
    setTimeout(() => setMessage(null), 3000);
  };

  const openDeleteDialog = (section: TextbookSection) => {
    setSectionToDelete(section);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteSection = () => {
    if (!sectionToDelete) return;

    deleteTextbookSection(sectionToDelete.id);
    loadData();
    setIsDeleteDialogOpen(false);
    setSectionToDelete(null);
    setMessage({ type: 'success', text: 'Sección eliminada' });
    setTimeout(() => setMessage(null), 3000);
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= sections.length) return;
    
    const newSections = [...sections];
    [newSections[index], newSections[newIndex]] = [newSections[newIndex], newSections[index]];
    
    // Actualizar órdenes
    newSections.forEach((section, idx) => {
      section.order = idx;
      saveTextbookSection(section);
    });
    
    setSections(newSections);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Convertir a base64
    const reader = new FileReader();
    reader.onloadend = () => {
      setSectionForm({ ...sectionForm, imageUrl: reader.result as string });
    };
    reader.readAsDataURL(file);
  };

  const removeImage = () => {
    setSectionForm({ ...sectionForm, imageUrl: '' });
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
                <h1 className="text-xl font-bold text-foreground">Libro de Texto</h1>
                <p className="text-xs text-muted-foreground">Material de estudio</p>
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
              
              {/* Botón Modo Edición (solo admin) */}
              {isAdmin && (
                <Button
                  variant={isEditMode ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setIsEditMode(!isEditMode)}
                  className="flex items-center gap-2"
                >
                  {isEditMode ? (
                    <>
                      <Eye className="w-4 h-4" />
                      Ver
                    </>
                  ) : (
                    <>
                      <Edit2 className="w-4 h-4" />
                      Editar
                    </>
                  )}
                </Button>
              )}
              
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
                  <p className="text-xs text-muted-foreground capitalize">{user?.role === 'admin' ? 'Administrador' : 'Estudiante'}</p>
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
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
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

        {/* Page Header */}
        <div className="mb-8 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-2">Libro de Texto de Autoescuela</h2>
          <p className="text-muted-foreground">
            Material de estudio para preparar el examen teórico de conducir.
          </p>
          {isAdmin && (
            <Badge variant={isEditMode ? 'default' : 'secondary'} className="mt-3">
              {isEditMode ? 'Modo Edición' : 'Modo Vista'}
            </Badge>
          )}
        </div>

        {/* Add Section Button (solo en modo edición) */}
        {isAdmin && isEditMode && (
          <div className="mb-6">
            <Button onClick={() => openSectionDialog()} className="w-full flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Añadir Nueva Sección
            </Button>
          </div>
        )}

        {/* Sections */}
        {sections.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-medium text-foreground mb-2">Libro de texto vacío</h3>
              <p className="text-muted-foreground mb-4">
                {isAdmin 
                  ? 'Añade secciones con contenido teórico para que los estudiantes puedan estudiar.'
                  : 'El contenido del libro de texto estará disponible pronto.'}
              </p>
              {isAdmin && (
                <Button onClick={() => openSectionDialog()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Añadir primera sección
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {sections.map((section, index) => (
              <Card key={section.id} id={`section-${section.id}`} className="overflow-hidden">
                {/* Admin Controls (solo en modo edición) */}
                {isAdmin && isEditMode && (
                  <div className="bg-muted px-4 py-2 flex items-center justify-between border-b border-border">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-muted-foreground">Sección {index + 1}</span>
                      {section.isActive === false && (
                        <Badge variant="secondary">Inactiva</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => moveSection(index, 'up')}
                        disabled={index === 0}
                        className="h-8 w-8"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => moveSection(index, 'down')}
                        disabled={index === sections.length - 1}
                        className="h-8 w-8"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openSectionDialog(section)}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950"
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openDeleteDialog(section)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
                
                <CardContent className="p-6">
                  {/* Section Title */}
                  <h3 className="text-2xl font-bold text-foreground mb-4">{section.title}</h3>
                  
                  {/* Section Image */}
                  {section.imageUrl && (
                    <div className="mb-6">
                      <img 
                        src={section.imageUrl} 
                        alt={section.title}
                        className="w-full max-h-96 object-contain rounded-lg border border-border"
                      />
                    </div>
                  )}
                  
                  {/* Section Content */}
                  <div className="prose dark:prose-invert max-w-none">
                    {section.content.split('\n').map((paragraph, idx) => (
                      <p key={idx} className="text-foreground mb-4 leading-relaxed">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Section Dialog */}
      <Dialog open={isSectionDialogOpen} onOpenChange={setIsSectionDialogOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingSection ? 'Editar Sección' : 'Nueva Sección'}</DialogTitle>
            <DialogDescription>
              Añade o edita una sección del libro de texto.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Type className="w-4 h-4" />
                Título *
              </Label>
              <Input
                value={sectionForm.title}
                onChange={(e) => setSectionForm({ ...sectionForm, title: e.target.value })}
                placeholder="Ej: Señales de Prohibición"
              />
            </div>
            
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                Imagen
              </Label>
              {sectionForm.imageUrl ? (
                <div className="relative">
                  <img 
                    src={sectionForm.imageUrl} 
                    alt="Preview" 
                    className="w-full max-h-48 object-contain rounded-lg border border-border"
                  />
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={removeImage}
                    className="absolute top-2 right-2"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <ImageIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">Arrastra una imagen o haz clic para seleccionar</p>
                  <Button 
                    variant="outline" 
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Seleccionar Imagen
                  </Button>
                </div>
              )}
            </div>
            
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Contenido
              </Label>
              <textarea
                value={sectionForm.content}
                onChange={(e) => setSectionForm({ ...sectionForm, content: e.target.value })}
                placeholder="Escribe el contenido de la sección..."
                className="w-full px-3 py-2 rounded-md border border-input bg-background min-h-[200px] resize-y focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <p className="text-xs text-muted-foreground">
                Usa saltos de línea para separar párrafos.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSectionDialogOpen(false)}>
              <X className="w-4 h-4 mr-2" />
              Cancelar
            </Button>
            <Button onClick={saveSectionHandler}>
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
            <DialogTitle className="text-red-600">Eliminar Sección</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar la sección <strong>{sectionToDelete?.title}</strong>?
              <br /><br />
              <span className="text-amber-600">
                <AlertCircle className="w-4 h-4 inline mr-1" />
                Esta acción marcará la sección como inactiva.
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleDeleteSection} variant="destructive">
              <Trash2 className="w-4 h-4 mr-2" />
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
