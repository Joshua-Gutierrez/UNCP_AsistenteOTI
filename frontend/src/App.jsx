import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import ChatContainer from './components/Chat/ChatContainer';
import AdminPanel from './components/Admin/AdminPanel';
import AdminLogin from './components/Admin/AdminLogin';
import AdminDashboard from './components/Admin/AdminDashboard';
import { Toaster } from 'react-hot-toast';

function NavBar() {
  const location = useLocation();

  return (
    <nav className="bg-[var(--color-bg-elevated)] border-b border-[var(--color-border)] sticky top-0 z-50">
      <div className="container h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-[var(--color-text)] hover:text-[var(--color-secondary)] transition-colors" aria-label="UNCP Asistente - Inicio">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-[var(--color-primary)]">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
          </div>
          <span className="font-bold text-lg hidden sm:block">UNCP Asistente</span>
        </Link>

        <div className="flex items-center gap-1 md:gap-3">
          <Link
            to="/"
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              location.pathname === '/'
                ? 'bg-[var(--color-primary)] text-white'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg)]'
            }`}
          >
            <svg className="w-4 h-4 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
            </svg>
            <span className="hidden sm:inline">Chat</span>
          </Link>
          <Link
            to="/admin"
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              location.pathname.startsWith('/admin')
                ? 'bg-[var(--color-secondary)] text-[var(--color-primary-dark)]'
                : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)] hover:bg-[var(--color-bg)]'
            }`}
          >
            <svg className="w-4 h-4 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="hidden sm:inline">Admin</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}

function App() {
  return (
    <Router>
      <Toaster 
        position="top-right" 
        toastOptions={{ 
          className: 'text-sm font-sans',
          style: {
            background: 'var(--color-bg-card)',
            color: 'var(--color-text-primary)',
            border: '1px solid var(--color-border-strong)',
            boxShadow: 'var(--shadow-lg)'
          },
          success: {
            style: {
              background: 'var(--color-success-base)',
              border: 'none',
              color: '#ffffff',
            },
            iconTheme: {
              primary: '#ffffff',
              secondary: 'var(--color-success-base)',
            }
          },
          error: {
            style: {
              background: 'var(--color-danger-base)',
              border: 'none',
              color: '#ffffff',
            },
            iconTheme: {
              primary: '#ffffff',
              secondary: 'var(--color-danger-base)',
            }
          }
        }} 
      />
      <AppShell />
    </Router>
  );
}

function AppShell() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col">
      {!isAdmin && <NavBar />}
      <main className="flex-1 flex flex-col min-h-0">
        <Routes>
          <Route path="/" element={<ChatContainer />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/editor" element={<ProtectedAdminRoute><AdminPanel /></ProtectedAdminRoute>} />
          <Route path="/admin" element={<ProtectedAdminRoute><AdminDashboard /></ProtectedAdminRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function ProtectedAdminRoute({ children }) {
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState(null);

  useEffect(() => {
    fetch('http://localhost:8000/api/v1/admin/me', { credentials: 'include' })
      .then((response) => {
        if (response.status === 401) {
          navigate('/admin/login', { replace: true });
          return false;
        }
        return response.ok;
      })
      .then(setAuthorized)
      .catch(() => setAuthorized(false));
  }, [navigate]);

  if (authorized === null) return <div className="admin-dashboard__status">Comprobando sesión...</div>;
  return authorized ? children : null;
}

export default App;