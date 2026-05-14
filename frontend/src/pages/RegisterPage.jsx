import React, { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useGoogleSignIn, GOOGLE_CLIENT_ID } from '@/hooks/useGoogleSignIn';
import { toast } from 'sonner';

const RegisterPage = () => {
  const { registerEmail, setUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const onGoogleSuccess = useCallback((data) => {
    setUser(data.user);
    toast.success(`Bienvenue ${data.user.name}`);
    navigate('/dashboard');
  }, [navigate, setUser]);
  const onGoogleError = useCallback((err) => {
    toast.error(err?.response?.data?.detail || 'Échec de connexion Google');
  }, []);
  const googleBtnRef = useGoogleSignIn({ onSuccess: onGoogleSuccess, onError: onGoogleError });

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await registerEmail(form);
      toast.success('Bienvenue chez Teranga Stay !');
      navigate('/dashboard');
    } catch (e) {
      setError(e?.response?.data?.detail || 'Inscription impossible');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-[calc(100vh-160px)] grid grid-cols-1 lg:grid-cols-2">
      <div className="hidden lg:block relative">
        <img src="https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=1400&auto=format&fit=crop" alt="Sénégal" className="absolute inset-0 h-full w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 p-10 text-white">
          <p className="text-xs uppercase tracking-[0.2em] text-[hsl(var(--premium))] font-semibold">Teranga Stay</p>
          <h2 className="font-display text-3xl mt-2 max-w-md">Créez votre compte et vivez le Sénégal autrement.</h2>
        </div>
      </div>
      <div className="flex items-center justify-center p-6 sm:p-10">
        <form onSubmit={submit} className="w-full max-w-md rounded-3xl bg-white border border-border p-6 sm:p-8 shadow-[0_18px_50px_rgba(20,19,18,0.10)]" data-testid="register-form">
          <h1 className="font-display text-3xl">Créer un compte</h1>
          <p className="text-sm text-muted-foreground mt-1">Quelques secondes suffisent.</p>
          {GOOGLE_CLIENT_ID ? (
            <div ref={googleBtnRef} className="mt-6 flex justify-center" data-testid="register-google-button" />
          ) : (
            <p className="mt-6 text-xs text-muted-foreground text-center">Connexion Google indisponible (REACT_APP_GOOGLE_CLIENT_ID manquant)</p>
          )}
          <div className="flex items-center gap-3 my-6 text-xs text-muted-foreground"><div className="h-px bg-border flex-1" />ou<div className="h-px bg-border flex-1" /></div>
          <div className="space-y-4">
            <div><Label className="text-xs">Nom complet</Label><Input required value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="mt-1 h-12 rounded-xl" data-testid="register-name-input" /></div>
            <div><Label className="text-xs">Email</Label><Input type="email" required value={form.email} onChange={(e) => setForm({...form, email: e.target.value})} className="mt-1 h-12 rounded-xl" data-testid="register-email-input" /></div>
            <div><Label className="text-xs">Téléphone (optionnel)</Label><Input value={form.phone} onChange={(e) => setForm({...form, phone: e.target.value})} className="mt-1 h-12 rounded-xl" data-testid="register-phone-input" /></div>
            <div><Label className="text-xs">Mot de passe</Label><Input type="password" required minLength={6} value={form.password} onChange={(e) => setForm({...form, password: e.target.value})} className="mt-1 h-12 rounded-xl" data-testid="register-password-input" /></div>
          </div>
          {error && <p className="text-sm text-[hsl(var(--destructive))] mt-3" data-testid="register-error-text">{error}</p>}
          <Button type="submit" disabled={loading} className="w-full mt-6 h-12 rounded-xl bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90" data-testid="register-submit-button">{loading ? 'Création…' : 'Créer mon compte'}</Button>
          <p className="text-sm text-muted-foreground mt-5 text-center">Déjà un compte ? <Link to="/login" className="text-[hsl(var(--primary))] font-semibold" data-testid="register-login-link">Se connecter</Link></p>
        </form>
      </div>
    </div>
  );
};

export default RegisterPage;
