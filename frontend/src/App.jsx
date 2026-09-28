import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

import ChatContainer from './features/chat/components/ChatContainer';
import AdminLogin from './features/admin/components/AdminLogin';
import AdminDashboard from './features/admin/components/AdminDashboard';
import ProtectedAdminRoute from './features/admin/components/ProtectedAdminRoute';

const AdminPanelPage = lazy(() => import('./pages/AdminPanelPage'));

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
  return (
    <div className="min-h-screen bg-[var(--color-bg)] flex flex-col">
      <main className="flex-1 flex flex-col min-h-0">
        <Routes>
          <Route path="/" element={<ChatContainer />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route 
            path="/admin/editor" 
            element={
              <Suspense fallback={<div className="flex items-center justify-center h-full">Cargando editor...</div>}>
                <ProtectedAdminRoute>
                  <AdminPanelPage />
                </ProtectedAdminRoute>
              </Suspense>
            } 
          />
          <Route path="/admin" element={<ProtectedAdminRoute><AdminDashboard /></ProtectedAdminRoute>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;