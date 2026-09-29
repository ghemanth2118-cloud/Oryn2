import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Toaster } from 'sonner';
import { seedDatabaseIfEmpty } from './services/firestoreService';

// Layout & Pages
import AppLayout from './layouts/AppLayout';
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/DashboardPage';
import NewIncidentPage from './pages/NewIncidentPage';
import MemoryPage from './pages/MemoryPage';
import RunbooksPage from './pages/RunbooksPage';
import ReflectionPage from './pages/ReflectionPage';
import PostmortemPage from './pages/PostmortemPage';
import SettingsPage from './pages/SettingsPage';
import ProfilePage from './pages/ProfilePage';
import LoginPage from './pages/LoginPage';
import NotFoundPage from './pages/NotFoundPage';

import ErrorBoundary from './components/common/ErrorBoundary';

export default function App() {
  useEffect(() => {
    // Automatically seed Firestore / local replica on first start
    seedDatabaseIfEmpty();
  }, []);

  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <ErrorBoundary>
            <Toaster 
              position="top-right" 
              richColors 
              theme="dark"
            toastOptions={{
              style: {
                background: '#1e1f25',
                color: '#e3e1e9',
                border: '1px solid #464555',
                borderRadius: '12px'
              }
            }}
          />
          <Routes>
            {/* Public Landing & Auth */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />

            {/* Authenticated Application Suite */}
            <Route element={<AppLayout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/new-incident" element={<NewIncidentPage />} />
              <Route path="/memory" element={<MemoryPage />} />
              <Route path="/runbooks" element={<RunbooksPage />} />
              <Route path="/reflection" element={<ReflectionPage />} />
              <Route path="/postmortems" element={<PostmortemPage />} />
              <Route path="/postmortem" element={<Navigate to="/postmortems" replace />} />
              <Route path="/runbook" element={<Navigate to="/runbooks" replace />} />
              <Route path="/incidents" element={<Navigate to="/dashboard" replace />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/profile" element={<ProfilePage />} />
            </Route>

            {/* 404 Catch-All */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
          </ErrorBoundary>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
