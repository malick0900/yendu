import React, { useState, useCallback } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useGoogleSignIn, GOOGLE_CLIENT_ID } from '@/hooks/useGoogleSignIn';
import { toast } from 'sonner';

const LoginPage = () => {
  const { loginEmail, setUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onGoogleSuccess = useCallback((data) => {
    setUser(data.user);
    toast.success(`Bienvenue ${data.user.name} · Connexion Google réussie`);
    const params = new URLSearchParams(location.search);
    navigate(params.get('next') || '/dashboard');
  }, [location.search, navigate, setUser]);

  const onGoogleError = useCallback((err) => {
    toast.error(err?.response?.data?.detail || 'Échec de connexion Google');
  }, []);

  const googleBtnRef = useGoogleSignIn({ onSuccess: onGoogleSuccess, onError: onGoogleError });

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await loginEmail(email, password);
      toast.success(`Bienvenue ${user.name} · Connexion réussie`);
      const params = new URLSearchParams(location.search);
      const next = params.get('next') || '/dashboard';
      navigate(next);
    } catch (e) {
      setError(e?.response?.data?.detail || 'Connexion impossible');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-[calc(100vh-160px)] grid grid-cols-1 lg:grid-cols-2">
      <div className="hidden lg:block relative">
        <img src="https://images.unsplash.com/photo-1716997338016-93b456b3ea8f?w=1400&auto=format&fit=crop" alt="Dakar" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-10 text-white">
          <p className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--premium))] font-semibold">Yendu</p>
          <h2 className="font-display text-3xl mt-2 max-w-md">Reprenez votre voyage là où vous l’aviez laissé.</h2>
        </div>
      </div>
      <div className="flex items-center justify-center p-6 sm:p-10">
        <form onSubmit={submit} className="w-full max-w-md rounded-3xl bg-white border border-border p-6 sm:p-8 shadow-[0_18px_50px_rgba(20,19,18,0.10)]" data-testid="login-form">
          <h1 className="font-display text-3xl">Connexion</h1>
          <p className="text-sm text-muted-foreground mt-1">Heureux de vous revoir.</p>
          {GOOGLE_CLIENT_ID ? (
            <div ref={googleBtnRef} className="mt-6 flex justify-center" data-testid="auth-google-button" />
          ) : (
            <p className="mt-6 text-xs text-muted-foreground text-center">Connexion Google indisponible (REACT_APP_GOOGLE_CLIENT_ID manquant)</p>
          )}
          <div className="flex items-center gap-3 my-6 text-xs text-muted-foreground"><div className="h-px bg-border flex-1" />ou<div className="h-px bg-border flex-1" /></div>
          <div className="space-y-4">
            <div><Label htmlFor="email" className="text-xs">Email</Label><Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 h-12 rounded-xl" data-testid="auth-email-input" /></div>
            <div><Label htmlFor="password" className="text-xs">Mot de passe</Label><Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 h-12 rounded-xl" data-testid="auth-password-input" /></div>
          </div>
          {error && <p className="text-sm text-[hsl(var(--destructive))] mt-3" data-testid="auth-error-text">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full mt-6 h-12 rounded-xl bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90" data-testid="auth-submit-button">{loading ? 'Connexion…' : 'Se connecter'}</Button>
          <p className="text-sm text-muted-foreground mt-5 text-center">Pas de compte ? <Link to="/register" className="text-[hsl(var(--primary))] font-semibold" data-testid="auth-register-link">Créer un compte</Link></p>
          <div className="mt-6 p-3 rounded-xl bg-muted/50 text-xs text-muted-foreground">
            <p><strong>Comptes de test :</strong></p>
            <p>Admin · admin@terangastay.sn / Admin123!</p>
            <p>Voyageur · traveler@example.com / Traveler123!</p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
