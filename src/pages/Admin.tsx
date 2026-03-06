import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Search,
  Shield,
  GraduationCap,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  Moon,
  Sun,
  Calendar,
  Filter
} from 'lucide-react';
import { getUsers, saveUser, deleteUser, getDefaultExpirationDate, isUserExpired } from '@/services/storage';
import StudentAnalytics from '@/components/StudentAnalytics';
import type { User as UserType } from '@/types';

export default function Admin() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [users, setUsers] = useState<UserType[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [userFilter, setUserFilter] = useState<'all' | 'valid' | 'expiring' | 'expired'>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Analytics dialog state
  const [isAnalyticsOpen, setIsAnalyticsOpen] = useState(false);
  const [analyticsUser, setAnalyticsUser] = useState<{ id: string; name: string } | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    email: '',
    role: 'student' as 'student' | 'admin',
    expiresAt: '',
  });

  useEffect(() => {
    if (!isAuthenticated || !isAdmin) {
      navigate('/dashboard');
      return;
    }

    loadUsers();
  }, [isAuthenticated, isAdmin, navigate]);

  const loadUsers = () => {
    setUsers(getUsers());
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Función para verificar si un usuario está próximo a caducar (menos de 7 días)
  const isExpiringSoon = (user: UserType): boolean => {
    if (isUserExpired(user)) return false;
    const now = new Date();
    const expiresAt = new Date(user.expiresAt);
    const diffTime = expiresAt.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7 && diffDays > 0;
  };

  const filteredUsers = users.filter(u => {
    // Filtro de búsqueda
    const matchesSearch = 
      u.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (!matchesSearch) return false;
    
    // Filtro de estado
    switch (userFilter) {
      case 'valid':
        return !isUserExpired(u) && !isExpiringSoon(u);
      case 'expiring':
        return isExpiringSoon(u);
      case 'expired':
        return isUserExpired(u);
      default:
        return true;
    }
  });

  const handleAddUser = () => {
    // Validar
    if (!formData.username.trim() || !formData.password.trim() || !formData.name.trim()) {
      setMessage({ type: 'error', text: 'Por favor, completa todos los campos obligatorios' });
      return;
    }

    // Verificar si el usuario ya existe
    if (users.find(u => u.username === formData.username)) {
      setMessage({ type: 'error', text: 'El nombre de usuario ya existe' });
      return;
    }

    const newUser: UserType = {
      id: `user-${Date.now()}`,
      username: formData.username,
      password: formData.password,
      name: formData.name,
      email: formData.email,
      role: formData.role,
      createdAt: new Date().toISOString(),
      expiresAt: getDefaultExpirationDate(),
    };

    saveUser(newUser);
    loadUsers();
    setIsAddDialogOpen(false);
    resetForm();
    setMessage({ type: 'success', text: 'Usuario creado correctamente' });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleEditUser = () => {
    if (!selectedUser) return;

    if (!formData.username.trim() || !formData.name.trim()) {
      setMessage({ type: 'error', text: 'Por favor, completa todos los campos obligatorios' });
      return;
    }

    // Verificar si el nuevo username ya existe (excluyendo el usuario actual)
    const existingUser = users.find(u => u.username === formData.username && u.id !== selectedUser.id);
    if (existingUser) {
      setMessage({ type: 'error', text: 'El nombre de usuario ya existe' });
      return;
    }

    const updatedUser: UserType = {
      ...selectedUser,
      username: formData.username,
      name: formData.name,
      email: formData.email,
      role: formData.role,
      // Solo actualizar password si se proporcionó una nueva
      password: formData.password.trim() ? formData.password : selectedUser.password,
      // Actualizar fecha de expiración
      expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : selectedUser.expiresAt,
    };

    saveUser(updatedUser);
    loadUsers();
    setIsEditDialogOpen(false);
    setSelectedUser(null);
    resetForm();
    setMessage({ type: 'success', text: 'Usuario actualizado correctamente' });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleDeleteUser = () => {
    if (!selectedUser) return;

    // No permitir eliminar el propio usuario admin
    if (selectedUser.id === user?.id) {
      setMessage({ type: 'error', text: 'No puedes eliminar tu propio usuario' });
      setIsDeleteDialogOpen(false);
      setSelectedUser(null);
      return;
    }

    deleteUser(selectedUser.id);
    loadUsers();
    setIsDeleteDialogOpen(false);
    setSelectedUser(null);
    setMessage({ type: 'success', text: 'Usuario eliminado correctamente' });
    setTimeout(() => setMessage(null), 3000);
  };

  const openEditDialog = (user: UserType) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      password: '', // Dejar vacío para no cambiar
      name: user.name,
      email: user.email || '',
      role: user.role,
      expiresAt: user.expiresAt ? new Date(user.expiresAt).toISOString().split('T')[0] : '',
    });
    setIsEditDialogOpen(true);
  };

  const openDeleteDialog = (user: UserType) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };
  
  const openAnalytics = (user: UserType) => {
    setAnalyticsUser({ id: user.id, name: user.name });
    setIsAnalyticsOpen(true);
  };

  const resetForm = () => {
    setFormData({
      username: '',
      password: '',
      name: '',
      email: '',
      role: 'student',
      expiresAt: '',
    });
  };

  const openAddDialog = () => {
    resetForm();
    setIsAddDialogOpen(true);
  };

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
                <p className="text-xs text-muted-foreground">Panel de Administración</p>
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
                Volver al Dashboard
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
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Gestión de Usuarios
              </h2>
              <p className="text-muted-foreground">
                Administra los usuarios de la plataforma. Puedes añadir, editar o eliminar usuarios.
              </p>
            </div>
            <div className="flex gap-3">
              <Button 
                onClick={openAddDialog}
                className="bg-primary hover:bg-primary/90"
              >
                <Plus className="w-4 h-4 mr-2" />
                Añadir Usuario
              </Button>
            </div>
          </div>
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
                  <p className="text-muted-foreground text-sm">Total Usuarios</p>
                  <p className="text-3xl font-bold text-card-foreground">{users.length}</p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <User className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Estudiantes</p>
                  <p className="text-3xl font-bold text-card-foreground">
                    {users.filter(u => u.role === 'student').length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                  <GraduationCap className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-muted-foreground text-sm">Administradores</p>
                  <p className="text-3xl font-bold text-card-foreground">
                    {users.filter(u => u.role === 'admin').length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                  <Shield className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* User Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground mr-2">Filtrar por:</span>
              <Button
                variant={userFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setUserFilter('all')}
              >
                Todos
                <Badge variant="secondary" className="ml-2">{users.length}</Badge>
              </Button>
              <Button
                variant={userFilter === 'valid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setUserFilter('valid')}
                className="border-green-300 text-green-700 hover:bg-green-50 dark:border-green-700 dark:text-green-400 dark:hover:bg-green-950"
              >
                <CheckCircle className="w-4 h-4 mr-1" />
                Válidos
                <Badge variant="secondary" className="ml-2">
                  {users.filter(u => !isUserExpired(u) && !isExpiringSoon(u)).length}
                </Badge>
              </Button>
              <Button
                variant={userFilter === 'expiring' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setUserFilter('expiring')}
                className="border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-950"
              >
                <AlertCircle className="w-4 h-4 mr-1" />
                Próximos a caducar
                <Badge variant="secondary" className="ml-2">
                  {users.filter(u => isExpiringSoon(u)).length}
                </Badge>
              </Button>
              <Button
                variant={userFilter === 'expired' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setUserFilter('expired')}
                className="border-red-300 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-950"
              >
                <AlertCircle className="w-4 h-4 mr-1" />
                Caducados
                <Badge variant="secondary" className="ml-2">
                  {users.filter(u => isUserExpired(u)).length}
                </Badge>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Lista de Usuarios</CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Buscar usuarios..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rol</TableHead>
                  <TableHead>Creación</TableHead>
                  <TableHead>Expiración</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No se encontraron usuarios
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((u) => {
                    const expired = isUserExpired(u);
                    return (
                    <TableRow key={u.id} className={expired ? 'bg-red-50 dark:bg-red-950/30' : ''}>
                      <TableCell className="font-medium">{u.username}</TableCell>
                      <TableCell>{u.name}</TableCell>
                      <TableCell>{u.email || '-'}</TableCell>
                      <TableCell>
                        <Badge className={u.role === 'admin' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' : 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'}>
                          {u.role === 'admin' ? 'Administrador' : 'Estudiante'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(u.createdAt).toLocaleDateString('es-ES')}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className={`w-4 h-4 ${expired ? 'text-red-500' : 'text-green-500'}`} />
                          <span className={expired ? 'text-red-600 font-medium dark:text-red-400' : ''}>
                            {new Date(u.expiresAt).toLocaleDateString('es-ES')}
                          </span>
                          {expired && (
                            <Badge variant="destructive" className="text-xs">Caducado</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {u.role === 'student' && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openAnalytics(u)}
                              className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 dark:hover:bg-purple-950"
                              title="Ver análisis de rendimiento"
                            >
                              <TrendingUp className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(u)}
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950"
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openDeleteDialog(u)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                            disabled={u.id === user?.id}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>

      {/* Add User Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Añadir Nuevo Usuario</DialogTitle>
            <DialogDescription>
              Completa los datos del nuevo usuario. Todos los campos marcados con * son obligatorios.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-username">Usuario *</Label>
              <Input
                id="new-username"
                placeholder="Nombre de usuario"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">Contraseña *</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="Contraseña"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-name">Nombre completo *</Label>
              <Input
                id="new-name"
                placeholder="Nombre y apellidos"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-email">Email</Label>
              <Input
                id="new-email"
                type="email"
                placeholder="correo@ejemplo.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-role">Rol</Label>
              <select
                id="new-role"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as 'student' | 'admin' })}
                className="w-full h-10 px-3 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="student">Estudiante</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddUser} className="bg-primary hover:bg-primary/90">
              Crear Usuario
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
            <DialogDescription>
              Modifica los datos del usuario. Deja la contraseña en blanco si no deseas cambiarla.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-username">Usuario *</Label>
              <Input
                id="edit-username"
                placeholder="Nombre de usuario"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-password">Nueva Contraseña (opcional)</Label>
              <Input
                id="edit-password"
                type="password"
                placeholder="Dejar en blanco para no cambiar"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nombre completo *</Label>
              <Input
                id="edit-name"
                placeholder="Nombre y apellidos"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                placeholder="correo@ejemplo.com"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role">Rol</Label>
              <select
                id="edit-role"
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as 'student' | 'admin' })}
                className="w-full h-10 px-3 rounded-md border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="student">Estudiante</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-expires">Fecha de Expiración *</Label>
              <Input
                id="edit-expires"
                type="date"
                value={formData.expiresAt}
                onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Fecha hasta la que el usuario podrá acceder a la plataforma.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleEditUser} className="bg-primary hover:bg-primary/90">
              Guardar Cambios
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600">Eliminar Usuario</DialogTitle>
            <DialogDescription>
              ¿Estás seguro de que deseas eliminar al usuario <strong>{selectedUser?.name}</strong>?
              Esta acción no se puede deshacer.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleDeleteUser} variant="destructive">
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Student Analytics Dialog */}
      {analyticsUser && (
        <StudentAnalytics
          userId={analyticsUser.id}
          userName={analyticsUser.name}
          isOpen={isAnalyticsOpen}
          onClose={() => {
            setIsAnalyticsOpen(false);
            setAnalyticsUser(null);
          }}
        />
      )}
    </div>
  );
}
