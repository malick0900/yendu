import React from 'react';
import '@/App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { SiteContentProvider } from '@/contexts/SiteContentContext';
import { Toaster } from '@/components/ui/sonner';
import Layout from '@/components/Layout';
import HomePage from '@/pages/HomePage';
import StaysPage from '@/pages/StaysPage';
import StayDetailPage from '@/pages/StayDetailPage';
import ExperiencesPage from '@/pages/ExperiencesPage';
import ExperienceDetailPage from '@/pages/ExperienceDetailPage';
import DestinationPage from '@/pages/DestinationPage';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import DashboardPage from '@/pages/DashboardPage';
import AdminPage from '@/pages/AdminPage';
import AboutPage from '@/pages/AboutPage';
import ContactPage from '@/pages/ContactPage';
import FaqPage from '@/pages/FaqPage';
import ReviewFromTokenPage from '@/pages/ReviewFromTokenPage';

const ProtectedRoute = ({ children, role }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-[60vh] flex items-center justify-center text-muted-foreground">Chargement…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/dashboard" replace />;
  return children;
};

const AppRouter = () => (
  <Routes>
    <Route element={<Layout />}>
      <Route path="/" element={<HomePage />} />
      <Route path="/stays" element={<StaysPage />} />
      <Route path="/stays/:id" element={<StayDetailPage />} />
      <Route path="/experiences" element={<ExperiencesPage />} />
      <Route path="/experiences/:id" element={<ExperienceDetailPage />} />
      <Route path="/destinations/:slug" element={<DestinationPage />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/contact" element={<ContactPage />} />
      <Route path="/faq" element={<FaqPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/review" element={<ReviewFromTokenPage />} />
      <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
      <Route path="/admin/*" element={<ProtectedRoute role="ADMIN"><AdminPage /></ProtectedRoute>} />
      <Route path="*" element={<div className="min-h-[60vh] flex items-center justify-center"><div className="text-center"><h1 className="font-display text-3xl">Page introuvable</h1><p className="text-muted-foreground mt-2">Retournez à l’accueil</p></div></div>} />
    </Route>
  </Routes>
);

function App() {
  return (
    <AuthProvider>
      <SiteContentProvider>
        <BrowserRouter>
          <AppRouter />
          <Toaster position="top-center" richColors />
        </BrowserRouter>
      </SiteContentProvider>
    </AuthProvider>
  );
}

export default App;
