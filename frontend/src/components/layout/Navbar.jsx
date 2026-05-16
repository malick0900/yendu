import React, { useEffect, useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { api, formatXOF } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Menu, Heart, User, LogOut, LayoutDashboard, ShieldCheck, Bell } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

const NAV_ITEMS = [
  { to: '/stays', label: 'Logements' },
  { to: '/experiences', label: 'Expériences' },
  { to: '/about', label: 'À propos' },
];

export const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [adminBadge, setAdminBadge] = useState(0);
  const [recentBookings, setRecentBookings] = useState([]);

  useEffect(() => {
    if (!user || user.role !== 'ADMIN') { setAdminBadge(0); setRecentBookings([]); return; }
    let mounted = true;
    const refresh = async () => {
      try {
        const { data } = await api.get('/admin/bookings');
        if (!mounted) return;
        const lastSeen = localStorage.getItem('ts_admin_seen_bookings_at');
        const lastSeenMs = lastSeen ? new Date(lastSeen).getTime() : 0;
        const unseen = data.filter((b) => (b.created_at ? new Date(b.created_at).getTime() : 0) > lastSeenMs).length;
        setAdminBadge(unseen);
        // Keep the 5 most recent pending bookings for the bell dropdown
        const recent = [...data]
          .filter((b) => b.status === 'pending')
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 5);
        setRecentBookings(recent);
      } catch {}
    };
    refresh();
    const id = setInterval(refresh, 30000);
    const onFocus = () => refresh();
    window.addEventListener('focus', onFocus);
    return () => { mounted = false; clearInterval(id); window.removeEventListener('focus', onFocus); };
  }, [user]);

  const markBookingsSeen = () => {
    localStorage.setItem('ts_admin_seen_bookings_at', new Date().toISOString());
    setAdminBadge(0);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  return (
    <header
      data-testid="top-navigation"
      className="sticky top-0 z-50 backdrop-blur-md bg-white/85 supports-[backdrop-filter]:bg-white/75 border-b border-border"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 sm:h-24 flex items-center justify-between gap-4">
        <Link to="/" data-testid="navbar-logo-link" className="flex items-center gap-2 group">
          <img src="/assets/yendu-logo.png" alt="Yendu" className="h-12 sm:h-14 w-auto object-contain rounded-lg" />
          <span className="sr-only">Yendu</span>
        </Link>

        <nav className="hidden md:flex items-center gap-7 text-sm">
          {NAV_ITEMS.map((it) => (
            <NavLink
              key={it.to}
              to={it.to}
              data-testid={`nav-${it.to.slice(1)}-link`}
              className={({ isActive }) =>
                `font-medium transition-colors hover:text-[hsl(var(--primary))] ${isActive ? 'text-[hsl(var(--primary))]' : 'text-foreground/80'}`
              }
            >
              {it.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {user?.role === 'ADMIN' && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button data-testid="navbar-admin-bell" aria-label="Notifications" className="relative inline-flex items-center justify-center h-10 w-10 rounded-full border border-border bg-white hover:bg-muted transition-colors">
                  <Bell className="h-4 w-4 text-foreground/70" />
                  {adminBadge > 0 && (
                    <span data-testid="navbar-admin-badge" className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 inline-flex items-center justify-center rounded-full bg-[hsl(var(--primary))] text-white text-[10px] font-bold animate-pulse">{adminBadge > 99 ? '99+' : adminBadge}</span>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80" onCloseAutoFocus={(e) => e.preventDefault()}>
                <DropdownMenuLabel className="flex items-center justify-between">
                  <span>Nouvelles réservations</span>
                  {adminBadge > 0 && <span className="text-xs text-[hsl(var(--primary))] font-semibold">{adminBadge} non lue{adminBadge > 1 ? 's' : ''}</span>}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {recentBookings.length === 0 ? (
                  <p className="px-3 py-6 text-sm text-muted-foreground text-center">Aucune réservation en attente</p>
                ) : (
                  recentBookings.map((b) => (
                    <DropdownMenuItem
                      key={b.id}
                      data-testid={`navbar-notif-${b.id}`}
                      onClick={() => { markBookingsSeen(); navigate('/admin/bookings'); }}
                      className="flex flex-col items-start gap-0.5 py-2 cursor-pointer"
                    >
                      <div className="flex items-center justify-between w-full">
                        <span className="font-medium text-sm truncate max-w-[200px]">{b.target_title}</span>
                        <span className="text-xs text-[hsl(var(--primary))] font-semibold whitespace-nowrap ml-2">{formatXOF(b.total_price)}</span>
                      </div>
                      <span className="text-xs text-muted-foreground truncate max-w-full">
                        {b.user_name} · {b.created_at ? formatDistanceToNow(new Date(b.created_at), { addSuffix: true, locale: fr }) : ''}
                      </span>
                    </DropdownMenuItem>
                  ))
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => { markBookingsSeen(); navigate('/admin/bookings'); }} className="justify-center text-sm font-medium text-[hsl(var(--primary))]">
                  Voir toutes les réservations
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button data-testid="navbar-user-menu" className="relative flex items-center gap-2 rounded-full border border-border bg-white hover:bg-muted transition-colors px-2 py-1.5">
                  <Menu className="h-4 w-4 text-foreground/70" />
                  <Avatar className="h-7 w-7">
                    <AvatarImage src={user.avatar || ''} alt={user.name} />
                    <AvatarFallback className="text-xs bg-[hsl(var(--secondary))] text-white">{user.name?.[0]?.toUpperCase() || 'U'}</AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col">
                    <span className="font-semibold">{user.name}</span>
                    <span className="text-xs text-muted-foreground">{user.email}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate('/dashboard')} data-testid="navbar-dashboard-link">
                  <LayoutDashboard className="h-4 w-4 mr-2" /> Tableau de bord
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/dashboard?tab=favorites')} data-testid="navbar-favorites-link">
                  <Heart className="h-4 w-4 mr-2" /> Mes favoris
                </DropdownMenuItem>
                {user.role === 'ADMIN' && (
                  <DropdownMenuItem onClick={() => navigate('/admin/bookings')} data-testid="navbar-admin-link">
                    <ShieldCheck className="h-4 w-4 mr-2" /> Administration
                    {adminBadge > 0 && <span className="ml-auto inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold bg-[hsl(var(--primary))] text-white">{adminBadge > 99 ? '99+' : adminBadge}</span>}
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} data-testid="navbar-logout-button">
                  <LogOut className="h-4 w-4 mr-2" /> Se déconnecter
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Link to="/login" data-testid="navbar-login-link"><Button variant="ghost" size="sm">Connexion</Button></Link>
              <Link to="/register" data-testid="navbar-register-link"><Button size="sm" className="bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90">Créer un compte</Button></Link>
            </div>
          )}

          {/* Mobile */}
          <Sheet>
            <SheetTrigger asChild>
              <button data-testid="mobile-nav-open-button" className="md:hidden inline-flex items-center justify-center h-10 w-10 rounded-full border border-border bg-white">
                <Menu className="h-5 w-5" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <div className="mt-8 flex flex-col gap-1">
                {NAV_ITEMS.map((it) => (
                  <Link key={it.to} to={it.to} className="py-3 px-3 rounded-xl hover:bg-muted text-base font-medium" data-testid={`mobile-nav-${it.to.slice(1)}-link`}>{it.label}</Link>
                ))}
                <div className="mt-4 pt-4 border-t border-border flex flex-col gap-2">
                  {!user ? (
                    <>
                      <Link to="/login"><Button variant="outline" className="w-full" data-testid="mobile-login-link">Connexion</Button></Link>
                      <Link to="/register"><Button className="w-full bg-[hsl(var(--primary))]" data-testid="mobile-register-link">Créer un compte</Button></Link>
                    </>
                  ) : (
                    <>
                      <Link to="/dashboard"><Button variant="outline" className="w-full">Tableau de bord</Button></Link>
                      {user.role === 'ADMIN' && (
                        <Link to="/admin"><Button variant="outline" className="w-full">Administration</Button></Link>
                      )}
                      <Button onClick={handleLogout} variant="ghost" className="w-full">Se déconnecter</Button>
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};
