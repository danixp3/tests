import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Admin from '@/pages/Admin';
import TestManagement from '@/pages/TestManagement';
import TestEditor from '@/pages/TestEditor';
import Test from '@/pages/Test';
import Textbook from '@/pages/Textbook';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/admin/tests" element={<TestManagement />} />
            <Route path="/admin/tests/edit/:testId" element={<TestEditor />} />
            <Route path="/test/:testId" element={<Test />} />
            <Route path="/textbook" element={<Textbook />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
