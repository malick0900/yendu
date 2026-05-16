import React, { useEffect, useState } from 'react';
import { Routes, Route, NavLink, Navigate, useLocation } from 'react-router-dom';
import { api, formatXOF, formatDateFR, PROPERTY_AMENITIES, PROPERTY_TYPES, EXPERIENCE_CATEGORIES, BACKEND_URL } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar } from 'recharts';
import { LayoutDashboard, Building2, Sparkles, CalendarCheck, Users, MessageSquare, Plus, Pencil, Trash2, FileEdit, MapPin, FileDown, Activity, Bell, Calendar as CalIcon } from 'lucide-react';
import { toast } from 'sonner';
import { ImageUpload, resolveImage } from '@/components/ImageUpload';
import { useSiteContent } from '@/contexts/SiteContentContext';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const SIDEBAR = [
  { to: '/admin', label: "Vue d'ensemble", icon: LayoutDashboard, end: true, badgeKey: null },
  { to: '/admin/content', label: 'Contenu du site', icon: FileEdit, badgeKey: null },
  { to: '/admin/destinations', label: 'Destinations', icon: MapPin, badgeKey: null },
  { to: '/admin/properties', label: 'Hébergements', icon: Building2, badgeKey: null },
  { to: '/admin/experiences', label: 'Expériences', icon: Sparkles, badgeKey: null },
  { to: '/admin/bookings', label: 'Réservations', icon: CalendarCheck, badgeKey: 'pending_bookings' },
  { to: '/admin/users', label: 'Utilisateurs', icon: Users, badgeKey: null },
  { to: '/admin/reviews', label: 'Avis', icon: MessageSquare, badgeKey: null },
  { to: '/admin/notifications', label: 'Notifications', icon: Bell, badgeKey: 'unseen_bookings' },
  { to: '/admin/logs', label: 'Journal admin', icon: Activity, badgeKey: null },
];

const useAdminBadges = () => {
  const [counts, setCounts] = useState({ pending_bookings: 0, unseen_bookings: 0 });

  const refresh = async () => {
    try {
      const { data } = await api.get('/admin/bookings');
      const pending = data.filter((b) => b.status === 'pending').length;
      const lastSeen = localStorage.getItem('ts_admin_seen_bookings_at');
      const lastSeenMs = lastSeen ? new Date(lastSeen).getTime() : 0;
      const unseen = data.filter((b) => {
        const ts = b.created_at ? new Date(b.created_at).getTime() : 0;
        return ts > lastSeenMs;
      }).length;
      setCounts({ pending_bookings: pending, unseen_bookings: unseen });
    } catch {}
  };

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 30000);
    const onFocus = () => refresh();
    window.addEventListener('focus', onFocus);
    return () => { clearInterval(id); window.removeEventListener('focus', onFocus); };
  }, []);

  return { counts, refresh };
};

const AdminLayout = ({ children }) => {
  const { counts, refresh } = useAdminBadges();
  const location = useLocation();

  // Mark notifications as seen when entering /admin/notifications or /admin/bookings
  useEffect(() => {
    if (location.pathname === '/admin/notifications' || location.pathname === '/admin/bookings') {
      localStorage.setItem('ts_admin_seen_bookings_at', new Date().toISOString());
      setTimeout(refresh, 600);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="font-display text-3xl">Administration</h1>
      <p className="text-sm text-muted-foreground">Gérez tout le contenu, les réservations et le site Yendu.</p>
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
        <aside className="rounded-2xl bg-white border border-border p-3 h-fit">
          <nav className="flex lg:flex-col gap-1 overflow-x-auto">
            {SIDEBAR.map((it) => {
              const badgeCount = it.badgeKey ? counts[it.badgeKey] : 0;
              return (
                <NavLink key={it.to} to={it.to} end={it.end} data-testid={`admin-nav-${it.label.toLowerCase().replace(/[^a-z]/g, '-')}`} className={({ isActive }) => `relative inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium whitespace-nowrap ${isActive ? 'bg-[hsl(var(--secondary))] text-white' : 'hover:bg-muted'}`}>
                  <it.icon className="h-4 w-4" /> {it.label}
                  {badgeCount > 0 && (
                    <span data-testid={`admin-badge-${it.badgeKey}`} className="ml-auto inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold bg-[hsl(var(--primary))] text-white animate-pulse">{badgeCount > 99 ? '99+' : badgeCount}</span>
                  )}
                </NavLink>
              );
            })}
          </nav>
        </aside>
        <div>{children}</div>
      </div>
    </div>
  );
};

const Stat = ({ label, value, sub }) => (
  <div className="rounded-2xl bg-white border border-border p-5">
    <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
    <p className="text-3xl font-display mt-1">{value}</p>
    {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
  </div>
);

const Overview = () => {
  const [stats, setStats] = useState(null);
  useEffect(() => { api.get('/admin/stats').then((r) => setStats(r.data)); }, []);
  if (!stats) return <p className="text-muted-foreground">Chargement…</p>;
  return (
    <div className="space-y-6" data-testid="admin-overview">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Revenus payés" value={formatXOF(stats.revenue)} sub={`${stats.paid_bookings} payée(s)`} />
        <Stat label="Revenus en attente" value={formatXOF(stats.pending_revenue)} sub="Confirmées non payées" />
        <Stat label="Réservations totales" value={stats.total_bookings} sub={`${stats.pending_bookings} en attente`} />
        <Stat label="Taux d'occupation" value={`${stats.occupancy_rate}%`} sub="30 derniers jours" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Hébergements" value={stats.total_properties} />
        <Stat label="Expériences" value={stats.total_experiences} />
        <Stat label="Durée moyenne séjour" value={`${stats.avg_stay} nuits`} />
        <Stat label="Voyageurs inscrits" value={stats.total_travelers} sub={`${stats.total_users} utilisateurs au total`} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl bg-white border border-border p-5">
          <h3 className="font-display text-lg">Réservations sur 14 jours</h3>
          <div className="h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.chart_data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="date" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip />
                <Line type="monotone" dataKey="count" stroke="#C86B4A" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-2xl bg-white border border-border p-5">
          <h3 className="font-display text-lg">Top destinations</h3>
          <div className="h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.top_destinations}>
                <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                <XAxis dataKey="destination" fontSize={11} />
                <YAxis fontSize={11} />
                <Tooltip />
                <Bar dataKey="count" fill="#0F3D2E" radius={[6,6,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded-2xl bg-white border border-border p-5">
          <h3 className="font-display text-lg">Top hébergements</h3>
          <Table className="mt-3">
            <TableHeader><TableRow><TableHead>Titre</TableHead><TableHead className="text-right">Réservations</TableHead><TableHead className="text-right">Revenus</TableHead></TableRow></TableHeader>
            <TableBody>{stats.top_properties.map((p) => (<TableRow key={p.id}><TableCell className="text-sm">{p.title}</TableCell><TableCell className="text-right">{p.count}</TableCell><TableCell className="text-right text-sm">{formatXOF(p.revenue)}</TableCell></TableRow>))}</TableBody>
          </Table>
        </div>
        <div className="rounded-2xl bg-white border border-border p-5">
          <h3 className="font-display text-lg">Top expériences</h3>
          <Table className="mt-3">
            <TableHeader><TableRow><TableHead>Titre</TableHead><TableHead className="text-right">Réservations</TableHead><TableHead className="text-right">Revenus</TableHead></TableRow></TableHeader>
            <TableBody>{stats.top_experiences.map((e) => (<TableRow key={e.id}><TableCell className="text-sm">{e.title}</TableCell><TableCell className="text-right">{e.count}</TableCell><TableCell className="text-right text-sm">{formatXOF(e.revenue)}</TableCell></TableRow>))}</TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

// SITE CONTENT CMS
const ContentAdmin = () => {
  const { content: ctxContent, reload } = useSiteContent();
  const [content, setContent] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (ctxContent) setContent(JSON.parse(JSON.stringify(ctxContent))); }, [ctxContent]);
  const setField = (k, v) => setContent((c) => ({ ...c, [k]: v }));

  const save = async () => {
    setSaving(true);
    try { await api.patch('/admin/site/content', { content }); toast.success('Contenu du site mis à jour'); reload(); }
    catch { toast.error('Erreur'); }
    finally { setSaving(false); }
  };

  const resetToDefaults = async () => {
    if (!window.confirm('Remettre tout le contenu aux valeurs par défaut ? Les modifications actuelles seront perdues.')) return;
    setSaving(true);
    try {
      const { data } = await api.post('/admin/site/content/reset');
      setContent(JSON.parse(JSON.stringify(data)));
      toast.success('Contenu réinitialisé');
      reload();
    } catch { toast.error('Erreur lors du reset'); }
    finally { setSaving(false); }
  };

  if (!content) return <p>Chargement…</p>;

  return (
    <div data-testid="admin-content">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-display text-2xl">Contenu du site</h2>
        <div className="flex gap-2">
          <Button onClick={resetToDefaults} disabled={saving} variant="outline" data-testid="reset-content-button">Reset par défaut</Button>
          <Button onClick={save} disabled={saving} className="bg-[hsl(var(--primary))]" data-testid="save-content-button">{saving ? 'Enregistrement…' : 'Enregistrer'}</Button>
        </div>
      </div>

      <Tabs defaultValue="hero">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="hero" data-testid="content-tab-hero">Hero</TabsTrigger>
          <TabsTrigger value="sections" data-testid="content-tab-sections">Sections accueil</TabsTrigger>
          <TabsTrigger value="testimonials" data-testid="content-tab-testimonials">Témoignages</TabsTrigger>
          <TabsTrigger value="about" data-testid="content-tab-about">À propos</TabsTrigger>
          <TabsTrigger value="contact" data-testid="content-tab-contact">Contact / footer</TabsTrigger>
          <TabsTrigger value="faq" data-testid="content-tab-faq">FAQ</TabsTrigger>
        </TabsList>

        <TabsContent value="hero" className="mt-6 space-y-4 rounded-2xl bg-white border border-border p-5">
          <div><Label>Image du hero</Label><div className="mt-2"><ImageUpload value={content.hero_image} onChange={(v) => setField('hero_image', v)} /></div></div>
          <div><Label>Badge (petit texte au-dessus du titre)</Label><Input value={content.hero_badge || ''} onChange={(e) => setField('hero_badge', e.target.value)} data-testid="content-hero-badge" /></div>
          <div><Label>Titre du hero (utilisez Entrée pour saut de ligne)</Label><Textarea rows={2} value={content.hero_title || ''} onChange={(e) => setField('hero_title', e.target.value)} data-testid="content-hero-title" /></div>
          <div><Label>Sous-titre</Label><Textarea rows={2} value={content.hero_subtitle || ''} onChange={(e) => setField('hero_subtitle', e.target.value)} data-testid="content-hero-subtitle" /></div>
        </TabsContent>

        <TabsContent value="sections" className="mt-6 space-y-6">
          <div className="rounded-2xl bg-white border border-border p-5 space-y-3">
            <h3 className="font-semibold">Section Destinations vedettes</h3>
            <div><Label>Titre</Label><Input value={content.destinations_title || ''} onChange={(e) => setField('destinations_title', e.target.value)} /></div>
            <div><Label>Sous-titre</Label><Input value={content.destinations_subtitle || ''} onChange={(e) => setField('destinations_subtitle', e.target.value)} /></div>
          </div>
          <div className="rounded-2xl bg-white border border-border p-5 space-y-3">
            <h3 className="font-semibold">Section Hébergements premium</h3>
            <div><Label>Titre</Label><Input value={content.properties_title || ''} onChange={(e) => setField('properties_title', e.target.value)} /></div>
            <div><Label>Sous-titre</Label><Input value={content.properties_subtitle || ''} onChange={(e) => setField('properties_subtitle', e.target.value)} /></div>
          </div>
          <div className="rounded-2xl bg-white border border-border p-5 space-y-3">
            <h3 className="font-semibold">Section Expériences tendances</h3>
            <div><Label>Titre</Label><Input value={content.experiences_title || ''} onChange={(e) => setField('experiences_title', e.target.value)} /></div>
            <div><Label>Sous-titre</Label><Input value={content.experiences_subtitle || ''} onChange={(e) => setField('experiences_subtitle', e.target.value)} /></div>
          </div>
          <div className="rounded-2xl bg-white border border-border p-5 space-y-3">
            <h3 className="font-semibold">Section éditoriale Teranga</h3>
            <div><Label>Titre</Label><Input value={content.teranga_title || ''} onChange={(e) => setField('teranga_title', e.target.value)} /></div>
            <div><Label>Texte</Label><Textarea rows={4} value={content.teranga_text || ''} onChange={(e) => setField('teranga_text', e.target.value)} /></div>
            <div><Label>Image</Label><div className="mt-2"><ImageUpload value={content.teranga_image} onChange={(v) => setField('teranga_image', v)} /></div></div>
          </div>
        </TabsContent>

        <TabsContent value="testimonials" className="mt-6 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Témoignages clients</h3>
            <Button size="sm" variant="outline" onClick={() => setField('testimonials', [...(content.testimonials || []), { name: '', city: '', text: '', img: '', rating: 5 }])}><Plus className="h-4 w-4 mr-1" /> Ajouter</Button>
          </div>
          <div><Label>Titre de section</Label><Input value={content.testimonials_title || ''} onChange={(e) => setField('testimonials_title', e.target.value)} /></div>
          {(content.testimonials || []).map((t, idx) => (
            <div key={idx} className="rounded-2xl bg-white border border-border p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
              <div><Label>Nom</Label><Input value={t.name || ''} onChange={(e) => { const arr = [...content.testimonials]; arr[idx] = { ...arr[idx], name: e.target.value }; setField('testimonials', arr); }} /></div>
              <div><Label>Ville</Label><Input value={t.city || ''} onChange={(e) => { const arr = [...content.testimonials]; arr[idx] = { ...arr[idx], city: e.target.value }; setField('testimonials', arr); }} /></div>
              <div className="md:col-span-2"><Label>Texte</Label><Textarea rows={3} value={t.text || ''} onChange={(e) => { const arr = [...content.testimonials]; arr[idx] = { ...arr[idx], text: e.target.value }; setField('testimonials', arr); }} /></div>
              <div className="md:col-span-2"><Label>Avatar</Label><ImageUpload value={t.img} onChange={(v) => { const arr = [...content.testimonials]; arr[idx] = { ...arr[idx], img: v }; setField('testimonials', arr); }} /></div>
              <div className="md:col-span-2 flex items-center justify-between">
                <div className="flex items-center gap-2"><Label>Note</Label><Input type="number" min={1} max={5} className="w-20" value={t.rating || 5} onChange={(e) => { const arr = [...content.testimonials]; arr[idx] = { ...arr[idx], rating: parseInt(e.target.value) || 5 }; setField('testimonials', arr); }} /></div>
                <Button variant="ghost" size="sm" onClick={() => setField('testimonials', content.testimonials.filter((_, i) => i !== idx))}><Trash2 className="h-4 w-4 mr-1" /> Supprimer</Button>
              </div>
            </div>
          ))}
        </TabsContent>

        <TabsContent value="about" className="mt-6 space-y-3 rounded-2xl bg-white border border-border p-5">
          <div><Label>Kicker (petit texte au-dessus du titre)</Label><Input value={content.about_kicker || ''} onChange={(e) => setField('about_kicker', e.target.value)} /></div>
          <div><Label>Titre</Label><Input value={content.about_title || ''} onChange={(e) => setField('about_title', e.target.value)} /></div>
          <div><Label>Texte (séparez les paragraphes par 2 retours à la ligne)</Label><Textarea rows={10} value={content.about_text || ''} onChange={(e) => setField('about_text', e.target.value)} data-testid="content-about-text" /></div>
        </TabsContent>

        <TabsContent value="contact" className="mt-6 space-y-3 rounded-2xl bg-white border border-border p-5">
          <div><Label>Tagline du footer</Label><Textarea rows={2} value={content.footer_tagline || ''} onChange={(e) => setField('footer_tagline', e.target.value)} /></div>
          <div><Label>Email de contact</Label><Input value={content.contact_email || ''} onChange={(e) => setField('contact_email', e.target.value)} data-testid="content-contact-email" /></div>
          <div><Label>Téléphone</Label><Input value={content.contact_phone || ''} onChange={(e) => setField('contact_phone', e.target.value)} /></div>
          <div><Label>Adresse</Label><Input value={content.contact_address || ''} onChange={(e) => setField('contact_address', e.target.value)} /></div>
        </TabsContent>

        <TabsContent value="faq" className="mt-6 space-y-3">
          <div className="flex justify-end"><Button size="sm" variant="outline" onClick={() => setField('faqs', [...(content.faqs || []), { q: '', a: '' }])}><Plus className="h-4 w-4 mr-1" /> Ajouter</Button></div>
          {(content.faqs || []).map((f, idx) => (
            <div key={idx} className="rounded-2xl bg-white border border-border p-4 space-y-2">
              <div><Label>Question</Label><Input value={f.q} onChange={(e) => { const arr = [...content.faqs]; arr[idx] = { ...arr[idx], q: e.target.value }; setField('faqs', arr); }} /></div>
              <div><Label>Réponse</Label><Textarea rows={3} value={f.a} onChange={(e) => { const arr = [...content.faqs]; arr[idx] = { ...arr[idx], a: e.target.value }; setField('faqs', arr); }} /></div>
              <div className="flex justify-end"><Button variant="ghost" size="sm" onClick={() => setField('faqs', content.faqs.filter((_, i) => i !== idx))}><Trash2 className="h-4 w-4 mr-1" /> Supprimer</Button></div>
            </div>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
};

// DESTINATIONS
const emptyDest = { name: '', slug: '', tagline: '', short_description: '', description: '', hero_image: '', country: 'Sénégal' };
const DestinationForm = ({ initial, onSubmit, onClose }) => {
  const [f, setF] = useState(initial || emptyDest);
  const setField = (k, v) => setF((p) => ({ ...p, [k]: v }));
  return (
    <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2">
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Nom</Label><Input value={f.name} onChange={(e) => setField('name', e.target.value)} data-testid="dest-form-name" /></div>
        <div><Label>Slug (URL)</Label><Input value={f.slug} onChange={(e) => setField('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-'))} data-testid="dest-form-slug" /></div>
        <div className="col-span-2"><Label>Tagline</Label><Input value={f.tagline || ''} onChange={(e) => setField('tagline', e.target.value)} /></div>
        <div className="col-span-2"><Label>Description courte</Label><Input value={f.short_description} onChange={(e) => setField('short_description', e.target.value)} /></div>
        <div className="col-span-2"><Label>Description complète</Label><Textarea rows={4} value={f.description} onChange={(e) => setField('description', e.target.value)} /></div>
        <div className="col-span-2"><Label>Image hero</Label><div className="mt-2"><ImageUpload value={f.hero_image} onChange={(v) => setField('hero_image', v)} /></div></div>
      </div>
      <DialogFooter><Button variant="outline" onClick={onClose}>Annuler</Button><Button onClick={() => onSubmit(f)} data-testid="dest-form-submit">Enregistrer</Button></DialogFooter>
    </div>
  );
};

const DestinationsAdmin = () => {
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null); const [open, setOpen] = useState(false);
  const load = () => api.get('/destinations').then((r) => setItems(r.data));
  useEffect(() => { load(); }, []);
  const save = async (f) => {
    try {
      if (editing) { await api.patch(`/admin/destinations/${editing.id}`, f); toast.success('Mis à jour'); }
      else { await api.post('/admin/destinations', f); toast.success('Créée'); }
      setOpen(false); setEditing(null); load();
    } catch (e) { toast.error(e?.response?.data?.detail || 'Erreur'); }
  };
  const del = async (id) => { if (!window.confirm('Supprimer ?')) return; await api.delete(`/admin/destinations/${id}`); toast.success('Supprimé'); load(); };
  return (
    <div data-testid="admin-destinations">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-display text-2xl">Destinations ({items.length})</h2>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
          <DialogTrigger asChild><Button data-testid="add-destination-button" onClick={() => { setEditing(null); setOpen(true); }}><Plus className="h-4 w-4 mr-1" /> Ajouter</Button></DialogTrigger>
          <DialogContent className="max-w-2xl"><DialogHeader><DialogTitle>{editing ? 'Modifier' : 'Nouvelle'} destination</DialogTitle></DialogHeader><DestinationForm initial={editing} onSubmit={save} onClose={() => { setOpen(false); setEditing(null); }} /></DialogContent>
        </Dialog>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((d) => (
          <div key={d.id} className="rounded-2xl bg-white border border-border overflow-hidden">
            <div className="relative h-32"><img src={resolveImage(d.hero_image)} alt="" className="absolute inset-0 h-full w-full object-cover" /></div>
            <div className="p-4">
              <p className="font-semibold">{d.name}</p>
              <p className="text-xs text-muted-foreground line-clamp-2">{d.short_description}</p>
              <div className="flex gap-2 mt-3">
                <Button size="sm" variant="outline" onClick={() => { setEditing(d); setOpen(true); }} data-testid={`edit-destination-${d.slug}`}><Pencil className="h-3.5 w-3.5 mr-1" /> Modifier</Button>
                <Button size="sm" variant="ghost" onClick={() => del(d.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// PROPERTY FORM (with ImageUpload + availability)
const emptyProp = { title: '', description: '', destination_slug: 'dakar', city: '', address: '', lat: 14.7, lng: -17.4, type: 'apartment', price_per_night: 50000, max_guests: 2, bedrooms: 1, beds: 1, bathrooms: 1, amenities: [], images: [], is_premium: false, is_published: true };
const PropertyForm = ({ initial, destinations, onSubmit, onClose }) => {
  const [f, setF] = useState(initial || emptyProp);
  const setField = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const toggleAmenity = (a) => setF((p) => ({ ...p, amenities: p.amenities.includes(a) ? p.amenities.filter((x) => x !== a) : [...p.amenities, a] }));
  return (
    <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2"><Label>Titre</Label><Input value={f.title} onChange={(e) => setField('title', e.target.value)} data-testid="prop-form-title" /></div>
        <div className="col-span-2"><Label>Description</Label><Textarea rows={3} value={f.description} onChange={(e) => setField('description', e.target.value)} data-testid="prop-form-description" /></div>
        <div><Label>Destination</Label><Select value={f.destination_slug} onValueChange={(v) => setField('destination_slug', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{destinations.map((d) => <SelectItem key={d.slug} value={d.slug}>{d.name}</SelectItem>)}</SelectContent></Select></div>
        <div><Label>Ville</Label><Input value={f.city} onChange={(e) => setField('city', e.target.value)} /></div>
        <div className="col-span-2"><Label>Adresse</Label><Input value={f.address} onChange={(e) => setField('address', e.target.value)} /></div>
        <div><Label>Latitude</Label><Input type="number" step="0.0001" value={f.lat} onChange={(e) => setField('lat', parseFloat(e.target.value))} /></div>
        <div><Label>Longitude</Label><Input type="number" step="0.0001" value={f.lng} onChange={(e) => setField('lng', parseFloat(e.target.value))} /></div>
        <div><Label>Type</Label><Select value={f.type} onValueChange={(v) => setField('type', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{PROPERTY_TYPES.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent></Select></div>
        <div><Label>Prix / nuit (FCFA)</Label><Input type="number" value={f.price_per_night} onChange={(e) => setField('price_per_night', parseInt(e.target.value) || 0)} data-testid="prop-form-price" /></div>
        <div><Label>Voyageurs max</Label><Input type="number" value={f.max_guests} onChange={(e) => setField('max_guests', parseInt(e.target.value) || 1)} /></div>
        <div><Label>Chambres</Label><Input type="number" value={f.bedrooms} onChange={(e) => setField('bedrooms', parseInt(e.target.value) || 1)} /></div>
        <div><Label>Lits</Label><Input type="number" value={f.beds} onChange={(e) => setField('beds', parseInt(e.target.value) || 1)} /></div>
        <div><Label>Salles de bain</Label><Input type="number" value={f.bathrooms} onChange={(e) => setField('bathrooms', parseInt(e.target.value) || 1)} /></div>
      </div>
      <div>
        <Label>Équipements</Label>
        <div className="grid grid-cols-2 gap-1 mt-2">{PROPERTY_AMENITIES.map((a) => (
          <label key={a} className="text-sm flex items-center gap-2"><Checkbox checked={f.amenities.includes(a)} onCheckedChange={() => toggleAmenity(a)} /> {a}</label>
        ))}</div>
      </div>
      <div><Label>Images</Label><div className="mt-2"><ImageUpload multiple value={f.images} onChange={(v) => setField('images', v)} /></div></div>
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm"><Switch checked={f.is_premium} onCheckedChange={(v) => setField('is_premium', v)} /> Premium</label>
        <label className="flex items-center gap-2 text-sm"><Switch checked={f.is_published} onCheckedChange={(v) => setField('is_published', v)} /> Publié</label>
      </div>
      <DialogFooter><Button variant="outline" onClick={onClose}>Annuler</Button><Button onClick={() => onSubmit(f)} data-testid="prop-form-submit">Enregistrer</Button></DialogFooter>
    </div>
  );
};

// Availability blocking dialog
const AvailabilityDialog = ({ propertyId, onClose }) => {
  const [items, setItems] = useState([]);
  const [range, setRange] = useState({ from: undefined, to: undefined });
  const [reason, setReason] = useState('');
  const load = () => api.get(`/admin/properties/${propertyId}/availability`).then((r) => setItems(r.data));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [propertyId]);
  const block = async () => {
    if (!range.from || !range.to) { toast.error('Choisissez une plage de dates'); return; }
    await api.post(`/admin/properties/${propertyId}/availability`, { property_id: propertyId, start_date: range.from.toISOString().slice(0, 10), end_date: range.to.toISOString().slice(0, 10), reason });
    toast.success('Période bloquée'); setRange({ from: undefined, to: undefined }); setReason(''); load();
  };
  const unblock = async (id) => { await api.delete(`/admin/availability/${id}`); toast.success('Débloqué'); load(); };
  return (
    <DialogContent className="max-w-2xl">
      <DialogHeader><DialogTitle>Bloquer des dates</DialogTitle></DialogHeader>
      <div className="space-y-4">
        <div className="rounded-xl border border-border p-3"><Calendar mode="range" selected={range} onSelect={(r) => setRange(r || { from: undefined, to: undefined })} numberOfMonths={2} disabled={{ before: new Date() }} locale={fr} /></div>
        <div><Label>Motif (optionnel)</Label><Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ex: maintenance, congés…" /></div>
        <Button onClick={block} data-testid="block-dates-button">Bloquer cette période</Button>
        <div>
          <h4 className="font-semibold mt-4 mb-2">Périodes bloquées</h4>
          {items.length === 0 ? <p className="text-sm text-muted-foreground">Aucune.</p> : (
            <ul className="space-y-2">{items.map((i) => (
              <li key={i.id} className="flex justify-between items-center text-sm border-b border-border pb-2">
                <span>Du {formatDateFR(i.start_date)} au {formatDateFR(i.end_date)} {i.reason && <span className="text-muted-foreground">— {i.reason}</span>}</span>
                <Button size="sm" variant="ghost" onClick={() => unblock(i.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
              </li>
            ))}</ul>
          )}
        </div>
      </div>
    </DialogContent>
  );
};

const PropertiesAdmin = () => {
  const [items, setItems] = useState([]); const [destinations, setDestinations] = useState([]);
  const [editing, setEditing] = useState(null); const [open, setOpen] = useState(false);
  const [availabilityFor, setAvailabilityFor] = useState(null);
  const load = () => api.get('/admin/properties').then((r) => setItems(r.data));
  useEffect(() => { load(); api.get('/destinations').then((r) => setDestinations(r.data)); }, []);
  const save = async (f) => {
    try {
      if (editing) { await api.patch(`/admin/properties/${editing.id}`, f); toast.success('Hébergement mis à jour'); }
      else { await api.post('/admin/properties', f); toast.success('Hébergement créé'); }
      setOpen(false); setEditing(null); load();
    } catch (e) { toast.error(e?.response?.data?.detail || 'Erreur'); }
  };
  const del = async (id) => { if (!window.confirm('Supprimer ?')) return; await api.delete(`/admin/properties/${id}`); toast.success('Supprimé'); load(); };
  return (
    <div data-testid="admin-properties">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-display text-2xl">Hébergements ({items.length})</h2>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
          <DialogTrigger asChild><Button data-testid="add-property-button" onClick={() => { setEditing(null); setOpen(true); }}><Plus className="h-4 w-4 mr-1" /> Ajouter</Button></DialogTrigger>
          <DialogContent className="max-w-3xl"><DialogHeader><DialogTitle>{editing ? 'Modifier' : 'Nouvel'} hébergement</DialogTitle></DialogHeader><PropertyForm initial={editing} destinations={destinations} onSubmit={save} onClose={() => { setOpen(false); setEditing(null); }} /></DialogContent>
        </Dialog>
      </div>
      <div className="rounded-2xl bg-white border border-border overflow-x-auto" data-testid="admin-stays-table">
        <Table>
          <TableHeader><TableRow><TableHead>Titre</TableHead><TableHead>Destination</TableHead><TableHead>Prix</TableHead><TableHead>Publié</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
          <TableBody>{items.map((p) => (
            <TableRow key={p.id}>
              <TableCell><div className="flex items-center gap-3"><img src={resolveImage(p.images?.[0])} alt="" className="w-12 h-12 rounded object-cover" /><div><p className="font-medium text-sm">{p.title}</p><p className="text-xs text-muted-foreground">{p.city}</p></div></div></TableCell>
              <TableCell className="text-sm capitalize">{p.destination_slug}</TableCell>
              <TableCell className="text-sm">{formatXOF(p.price_per_night)}</TableCell>
              <TableCell>{p.is_published ? <Badge className="bg-emerald-100 text-emerald-800">Oui</Badge> : <Badge variant="secondary">Non</Badge>}</TableCell>
              <TableCell className="text-right">
                <Button size="icon" variant="ghost" title="Disponibilités" onClick={() => setAvailabilityFor(p.id)} data-testid={`availability-property-${p.id}`}><CalIcon className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" onClick={() => { setEditing(p); setOpen(true); }} data-testid={`edit-property-${p.id}`}><Pencil className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" onClick={() => del(p.id)} data-testid={`delete-property-${p.id}`}><Trash2 className="h-4 w-4" /></Button>
              </TableCell>
            </TableRow>
          ))}</TableBody>
        </Table>
      </div>
      <Dialog open={!!availabilityFor} onOpenChange={(v) => { if (!v) setAvailabilityFor(null); }}>
        {availabilityFor && <AvailabilityDialog propertyId={availabilityFor} onClose={() => setAvailabilityFor(null)} />}
      </Dialog>
    </div>
  );
};

// EXPERIENCES
const emptyExp = { title: '', description: '', destination_slug: 'dakar', city: '', lat: 14.7, lng: -17.4, category: 'culture', duration_hours: 2, price: 20000, max_participants: 10, included: [], meeting_point: '', host_name: '', host_bio: '', host_avatar: '', images: [], is_trending: false, is_published: true };
const ExperienceForm = ({ initial, destinations, onSubmit, onClose }) => {
  const [f, setF] = useState(initial || emptyExp);
  const [incInput, setIncInput] = useState('');
  const setField = (k, v) => setF((p) => ({ ...p, [k]: v }));
  return (
    <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-2">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2"><Label>Titre</Label><Input value={f.title} onChange={(e) => setField('title', e.target.value)} data-testid="exp-form-title" /></div>
        <div className="col-span-2"><Label>Description</Label><Textarea rows={3} value={f.description} onChange={(e) => setField('description', e.target.value)} /></div>
        <div><Label>Destination</Label><Select value={f.destination_slug} onValueChange={(v) => setField('destination_slug', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{destinations.map((d) => <SelectItem key={d.slug} value={d.slug}>{d.name}</SelectItem>)}</SelectContent></Select></div>
        <div><Label>Ville</Label><Input value={f.city} onChange={(e) => setField('city', e.target.value)} /></div>
        <div><Label>Catégorie</Label><Select value={f.category} onValueChange={(v) => setField('category', v)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{EXPERIENCE_CATEGORIES.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent></Select></div>
        <div><Label>Durée (h)</Label><Input type="number" step="0.5" value={f.duration_hours} onChange={(e) => setField('duration_hours', parseFloat(e.target.value) || 1)} /></div>
        <div><Label>Prix (FCFA)</Label><Input type="number" value={f.price} onChange={(e) => setField('price', parseInt(e.target.value) || 0)} data-testid="exp-form-price" /></div>
        <div><Label>Max participants</Label><Input type="number" value={f.max_participants} onChange={(e) => setField('max_participants', parseInt(e.target.value) || 1)} /></div>
        <div><Label>Latitude</Label><Input type="number" step="0.0001" value={f.lat} onChange={(e) => setField('lat', parseFloat(e.target.value))} /></div>
        <div><Label>Longitude</Label><Input type="number" step="0.0001" value={f.lng} onChange={(e) => setField('lng', parseFloat(e.target.value))} /></div>
        <div className="col-span-2"><Label>Point de rendez-vous</Label><Input value={f.meeting_point} onChange={(e) => setField('meeting_point', e.target.value)} /></div>
        <div><Label>Nom guide</Label><Input value={f.host_name} onChange={(e) => setField('host_name', e.target.value)} /></div>
        <div><Label>Avatar guide</Label><div className="mt-2"><ImageUpload value={f.host_avatar} onChange={(v) => setField('host_avatar', v)} /></div></div>
        <div className="col-span-2"><Label>Bio guide</Label><Textarea rows={2} value={f.host_bio} onChange={(e) => setField('host_bio', e.target.value)} /></div>
      </div>
      <div>
        <Label>Inclus</Label>
        <div className="flex gap-2 mt-2"><Input value={incInput} onChange={(e) => setIncInput(e.target.value)} placeholder="Ex: Matériel inclus" /><Button type="button" onClick={() => { if (incInput) { setF((p) => ({ ...p, included: [...p.included, incInput] })); setIncInput(''); } }}>Ajouter</Button></div>
        <div className="flex flex-wrap gap-1 mt-2">{f.included.map((i, idx) => <Badge key={idx} variant="secondary" className="cursor-pointer" onClick={() => setF((p) => ({ ...p, included: p.included.filter((_, j) => j !== idx) }))}>{i} ×</Badge>)}</div>
      </div>
      <div><Label>Images</Label><div className="mt-2"><ImageUpload multiple value={f.images} onChange={(v) => setField('images', v)} /></div></div>
      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm"><Switch checked={f.is_trending} onCheckedChange={(v) => setField('is_trending', v)} /> Tendance</label>
        <label className="flex items-center gap-2 text-sm"><Switch checked={f.is_published} onCheckedChange={(v) => setField('is_published', v)} /> Publié</label>
      </div>
      <DialogFooter><Button variant="outline" onClick={onClose}>Annuler</Button><Button onClick={() => onSubmit(f)} data-testid="exp-form-submit">Enregistrer</Button></DialogFooter>
    </div>
  );
};

const ExperiencesAdmin = () => {
  const [items, setItems] = useState([]); const [destinations, setDestinations] = useState([]);
  const [editing, setEditing] = useState(null); const [open, setOpen] = useState(false);
  const load = () => api.get('/admin/experiences').then((r) => setItems(r.data));
  useEffect(() => { load(); api.get('/destinations').then((r) => setDestinations(r.data)); }, []);
  const save = async (f) => {
    try {
      if (editing) { await api.patch(`/admin/experiences/${editing.id}`, f); toast.success('Mis à jour'); }
      else { await api.post('/admin/experiences', f); toast.success('Créée'); }
      setOpen(false); setEditing(null); load();
    } catch (e) { toast.error(e?.response?.data?.detail || 'Erreur'); }
  };
  const del = async (id) => { if (!window.confirm('Supprimer ?')) return; await api.delete(`/admin/experiences/${id}`); toast.success('Supprimé'); load(); };
  return (
    <div data-testid="admin-experiences">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-display text-2xl">Expériences ({items.length})</h2>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditing(null); }}>
          <DialogTrigger asChild><Button data-testid="add-experience-button" onClick={() => { setEditing(null); setOpen(true); }}><Plus className="h-4 w-4 mr-1" /> Ajouter</Button></DialogTrigger>
          <DialogContent className="max-w-3xl"><DialogHeader><DialogTitle>{editing ? 'Modifier' : 'Nouvelle'} expérience</DialogTitle></DialogHeader><ExperienceForm initial={editing} destinations={destinations} onSubmit={save} onClose={() => { setOpen(false); setEditing(null); }} /></DialogContent>
        </Dialog>
      </div>
      <div className="rounded-2xl bg-white border border-border overflow-x-auto" data-testid="admin-experiences-table">
        <Table>
          <TableHeader><TableRow><TableHead>Titre</TableHead><TableHead>Catégorie</TableHead><TableHead>Prix</TableHead><TableHead>Publié</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
          <TableBody>{items.map((e) => (
            <TableRow key={e.id}>
              <TableCell><div className="flex items-center gap-3"><img src={resolveImage(e.images?.[0])} alt="" className="w-12 h-12 rounded object-cover" /><div><p className="font-medium text-sm">{e.title}</p><p className="text-xs text-muted-foreground">{e.city}</p></div></div></TableCell>
              <TableCell className="text-sm capitalize">{e.category}</TableCell>
              <TableCell className="text-sm">{formatXOF(e.price)}</TableCell>
              <TableCell>{e.is_published ? <Badge className="bg-emerald-100 text-emerald-800">Oui</Badge> : <Badge variant="secondary">Non</Badge>}</TableCell>
              <TableCell className="text-right">
                <Button size="icon" variant="ghost" onClick={() => { setEditing(e); setOpen(true); }} data-testid={`edit-experience-${e.id}`}><Pencil className="h-4 w-4" /></Button>
                <Button size="icon" variant="ghost" onClick={() => del(e.id)} data-testid={`delete-experience-${e.id}`}><Trash2 className="h-4 w-4" /></Button>
              </TableCell>
            </TableRow>
          ))}</TableBody>
        </Table>
      </div>
    </div>
  );
};

const downloadCSV = async (path, filename) => {
  const token = localStorage.getItem('ts_token');
  const resp = await fetch(`${BACKEND_URL}${path}`, { headers: { Authorization: `Bearer ${token}` }, credentials: 'include' });
  if (!resp.ok) { toast.error('Erreur export'); return; }
  const blob = await resp.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  window.URL.revokeObjectURL(url);
};

const BookingsAdmin = () => {
  const [items, setItems] = useState([]); const [filter, setFilter] = useState('all');
  const load = () => { const params = filter !== 'all' ? { status: filter } : {}; api.get('/admin/bookings', { params }).then((r) => setItems(r.data)); };
  useEffect(load, [filter]);
  const update = async (id, patch) => { try { await api.patch(`/admin/bookings/${id}`, patch); toast.success('Mis à jour'); load(); } catch { toast.error('Erreur'); } };
  return (
    <div data-testid="admin-bookings">
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <h2 className="font-display text-2xl">Réservations ({items.length})</h2>
        <div className="flex gap-2 flex-wrap">
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-[180px]" data-testid="booking-filter"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes</SelectItem>
              <SelectItem value="pending">En attente</SelectItem>
              <SelectItem value="confirmed">Confirmées</SelectItem>
              <SelectItem value="cancelled">Annulées</SelectItem>
              <SelectItem value="completed">Terminées</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => downloadCSV('/api/admin/export/bookings.csv', 'teranga-bookings.csv')} data-testid="export-bookings-csv"><FileDown className="h-4 w-4 mr-1" /> Exporter CSV</Button>
        </div>
      </div>
      <div className="rounded-2xl bg-white border border-border overflow-x-auto" data-testid="admin-reservations-table">
        <Table>
          <TableHeader><TableRow><TableHead>Client</TableHead><TableHead>Réservation</TableHead><TableHead>Dates</TableHead><TableHead>Total</TableHead><TableHead>Statut</TableHead><TableHead>Paiement</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
          <TableBody>{items.map((b) => (
            <TableRow key={b.id}>
              <TableCell><div><p className="font-medium text-sm">{b.user_name}</p><p className="text-xs text-muted-foreground">{b.user_email}</p></div></TableCell>
              <TableCell className="text-sm"><span className="capitalize text-xs text-muted-foreground">{b.type}</span><br/>{b.target_title}</TableCell>
              <TableCell className="text-sm">{b.type === 'property' ? `${formatDateFR(b.check_in)} → ${formatDateFR(b.check_out)}` : formatDateFR(b.experience_date)}</TableCell>
              <TableCell className="text-sm font-medium">{formatXOF(b.total_price)}</TableCell>
              <TableCell><Badge className={b.status === 'pending' ? 'bg-amber-100 text-amber-800' : b.status === 'confirmed' ? 'bg-emerald-100 text-emerald-800' : b.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-sky-100 text-sky-800'}>{b.status}</Badge></TableCell>
              <TableCell><Badge variant={b.payment_status === 'paid' ? 'default' : 'secondary'}>{b.payment_status}</Badge></TableCell>
              <TableCell className="text-right">
                <div className="flex gap-1 justify-end flex-wrap">
                  {b.status === 'pending' && <Button size="sm" variant="outline" onClick={() => update(b.id, { status: 'confirmed' })} data-testid={`confirm-booking-${b.id}`}>Confirmer</Button>}
                  {b.status !== 'cancelled' && <Button size="sm" variant="outline" onClick={() => update(b.id, { status: 'cancelled' })} data-testid={`cancel-booking-${b.id}`}>Annuler</Button>}
                  {b.payment_status !== 'paid' && <Button size="sm" onClick={() => update(b.id, { payment_status: 'paid' })} data-testid={`mark-paid-${b.id}`}>Marquer payé</Button>}
                </div>
              </TableCell>
            </TableRow>
          ))}</TableBody>
        </Table>
      </div>
    </div>
  );
};

const UsersAdmin = () => {
  const [items, setItems] = useState([]);
  const load = () => api.get('/admin/users').then((r) => setItems(r.data));
  useEffect(load, []);
  const setRole = async (user_id, role) => { await api.patch(`/admin/users/${user_id}`, { role }); toast.success('Rôle mis à jour'); load(); };
  return (
    <div data-testid="admin-users">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-display text-2xl">Utilisateurs ({items.length})</h2>
        <Button variant="outline" onClick={() => downloadCSV('/api/admin/export/users.csv', 'teranga-users.csv')} data-testid="export-users-csv"><FileDown className="h-4 w-4 mr-1" /> Exporter CSV</Button>
      </div>
      <div className="rounded-2xl bg-white border border-border overflow-x-auto" data-testid="admin-users-table">
        <Table>
          <TableHeader><TableRow><TableHead>Nom</TableHead><TableHead>Email</TableHead><TableHead>Rôle</TableHead><TableHead>Provider</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
          <TableBody>{items.map((u) => (
            <TableRow key={u.user_id}>
              <TableCell><div className="flex items-center gap-2"><img src={resolveImage(u.avatar) || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=0F3D2E&color=fff`} className="w-8 h-8 rounded-full object-cover" alt="" /><span className="text-sm font-medium">{u.name}</span></div></TableCell>
              <TableCell className="text-sm">{u.email}</TableCell>
              <TableCell><Badge variant={u.role === 'ADMIN' ? 'default' : 'secondary'}>{u.role}</Badge></TableCell>
              <TableCell className="text-sm">{u.provider}</TableCell>
              <TableCell className="text-right">
                <Select value={u.role} onValueChange={(v) => setRole(u.user_id, v)}>
                  <SelectTrigger className="w-[140px] ml-auto" data-testid={`role-select-${u.user_id}`}><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="TRAVELER">Voyageur</SelectItem><SelectItem value="ADMIN">Admin</SelectItem></SelectContent>
                </Select>
              </TableCell>
            </TableRow>
          ))}</TableBody>
        </Table>
      </div>
    </div>
  );
};

const ReviewsAdmin = () => {
  const [items, setItems] = useState([]);
  const load = () => api.get('/admin/reviews').then((r) => setItems(r.data));
  useEffect(load, []);
  const toggle = async (id, vis) => { await api.patch(`/admin/reviews/${id}`, { is_visible: vis }); toast.success(vis ? 'Visible' : 'Masqué'); load(); };
  return (
    <div data-testid="admin-reviews">
      <h2 className="font-display text-2xl mb-4">Avis ({items.length})</h2>
      <div className="space-y-3">{items.map((r) => (
        <div key={r.id} className="rounded-2xl bg-white border border-border p-4">
          <div className="flex justify-between gap-3">
            <div>
              <p className="text-sm font-medium">{r.user_name} <span className="text-xs text-muted-foreground">· {formatDateFR(r.created_at)}</span></p>
              <p className="text-xs text-muted-foreground">{r.type} : {r.target_id}</p>
              <p className="text-sm mt-2">{r.comment}</p>
            </div>
            <div className="text-right">
              <div className="flex justify-end">{[...Array(r.rating)].map((_, i) => <span key={i} className="text-[hsl(var(--premium))]">★</span>)}</div>
              <Button size="sm" variant="outline" className="mt-2" onClick={() => toggle(r.id, !r.is_visible)} data-testid={`toggle-review-${r.id}`}>{r.is_visible ? 'Masquer' : 'Afficher'}</Button>
            </div>
          </div>
        </div>
      ))}</div>
    </div>
  );
};

const NotificationsAdmin = () => {
  const [items, setItems] = useState([]); const [smtp, setSmtp] = useState(null);
  useEffect(() => { api.get('/admin/notifications').then((r) => setItems(r.data)); api.get('/admin/notifications/status').then((r) => setSmtp(r.data)); }, []);
  return (
    <div data-testid="admin-notifications">
      <h2 className="font-display text-2xl mb-2">Notifications</h2>
      <div className="rounded-xl bg-muted/40 p-3 text-sm mb-4">
        <p>SMTP : {smtp?.smtp_configured ? <Badge className="bg-emerald-100 text-emerald-800">configuré</Badge> : <Badge variant="secondary">non configuré (mode log uniquement)</Badge>}</p>
        <p className="text-xs text-muted-foreground mt-1">Pour envoyer des emails réels, configurez SMTP_HOST, SMTP_USER, SMTP_PASSWORD dans le .env du backend.</p>
      </div>
      <div className="rounded-2xl bg-white border border-border overflow-x-auto" data-testid="admin-notifications-table">
        <Table>
          <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Destinataire</TableHead><TableHead>Sujet</TableHead><TableHead>Type</TableHead><TableHead>Statut</TableHead></TableRow></TableHeader>
          <TableBody>{items.map((n) => (
            <TableRow key={n.id}>
              <TableCell className="text-xs">{formatDateFR(n.created_at)}</TableCell>
              <TableCell className="text-sm">{n.to}</TableCell>
              <TableCell className="text-sm">{n.subject}</TableCell>
              <TableCell><Badge variant="secondary" className="text-xs">{n.type}</Badge></TableCell>
              <TableCell><Badge className={n.status === 'sent' ? 'bg-emerald-100 text-emerald-800' : n.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-800'}>{n.status}</Badge></TableCell>
            </TableRow>
          ))}</TableBody>
        </Table>
      </div>
    </div>
  );
};

const LogsAdmin = () => {
  const [items, setItems] = useState([]);
  useEffect(() => { api.get('/admin/logs').then((r) => setItems(r.data)); }, []);
  return (
    <div data-testid="admin-logs">
      <h2 className="font-display text-2xl mb-4">Journal admin ({items.length})</h2>
      <div className="rounded-2xl bg-white border border-border overflow-x-auto" data-testid="admin-logs-table">
        <Table>
          <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Admin</TableHead><TableHead>Action</TableHead><TableHead>Détails</TableHead></TableRow></TableHeader>
          <TableBody>{items.map((l) => (
            <TableRow key={l.id}>
              <TableCell className="text-xs">{formatDateFR(l.created_at)}</TableCell>
              <TableCell className="text-sm">{l.admin_name || l.admin_email}</TableCell>
              <TableCell><Badge variant="secondary" className="text-xs">{l.action}</Badge></TableCell>
              <TableCell className="text-xs font-mono text-muted-foreground">{JSON.stringify(l.meta)}</TableCell>
            </TableRow>
          ))}</TableBody>
        </Table>
      </div>
    </div>
  );
};

const AdminPage = () => (
  <AdminLayout>
    <Routes>
      <Route index element={<Overview />} />
      <Route path="content" element={<ContentAdmin />} />
      <Route path="destinations" element={<DestinationsAdmin />} />
      <Route path="properties" element={<PropertiesAdmin />} />
      <Route path="experiences" element={<ExperiencesAdmin />} />
      <Route path="bookings" element={<BookingsAdmin />} />
      <Route path="users" element={<UsersAdmin />} />
      <Route path="reviews" element={<ReviewsAdmin />} />
      <Route path="notifications" element={<NotificationsAdmin />} />
      <Route path="logs" element={<LogsAdmin />} />
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  </AdminLayout>
);

export default AdminPage;
