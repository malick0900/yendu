import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api, formatXOF, formatDateFR } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Star, Heart, CalendarDays, MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { PropertyCard } from '@/components/PropertyCard';
import { ExperienceCard } from '@/components/ExperienceCard';

const STATUS_STYLE = {
  pending: 'bg-amber-100 text-amber-800',
  confirmed: 'bg-emerald-100 text-emerald-800',
  cancelled: 'bg-red-100 text-red-700',
  completed: 'bg-sky-100 text-sky-800',
};
const STATUS_LABEL = { pending: 'En attente', confirmed: 'Confirmée', cancelled: 'Annulée', completed: 'Terminée' };
const PAY_LABEL = { pending: 'Paiement en attente', paid: 'Payé', refunded: 'Remboursé' };

const ReviewDialog = ({ booking, onDone }) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const submit = async () => {
    try {
      await api.post('/reviews', { type: booking.type, target_id: booking.target_id, rating, comment });
      toast.success('Avis publié · Merci !');
      onDone?.();
    } catch (e) { toast.error(e?.response?.data?.detail || 'Erreur'); }
  };
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" data-testid="open-review-dialog">Laisser un avis</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Avis sur {booking.target_title}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Note</Label>
            <div className="flex gap-1 mt-2">{[1,2,3,4,5].map((n) => (
              <button key={n} onClick={() => setRating(n)} className="p-1"><Star className={`h-6 w-6 ${n <= rating ? 'fill-[hsl(var(--premium))] text-[hsl(var(--premium))]' : 'text-muted-foreground'}`} /></button>
            ))}</div>
          </div>
          <div><Label>Commentaire</Label><Textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={4} placeholder="Partagez votre expérience…" /></div>
        </div>
        <DialogFooter><Button onClick={submit} data-testid="submit-review-button">Publier</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const DashboardPage = () => {
  const { user, setUser } = useAuth();
  const [params, setParams] = useSearchParams();
  const [tab, setTab] = useState(params.get('tab') || 'bookings');
  const [bookings, setBookings] = useState([]);
  const [favs, setFavs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState({ name: user?.name || '', phone: user?.phone || '', avatar: user?.avatar || '' });

  const load = async () => {
    setLoading(true);
    try {
      const [bRes, fRes] = await Promise.all([api.get('/bookings/me'), api.get('/favorites/me')]);
      setBookings(bRes.data); setFavs(fRes.data);
    } finally { setLoading(false); }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, []);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { setParams({ tab }, { replace: true }); }, [tab]);

  const saveProfile = async () => {
    try {
      const { data } = await api.patch('/auth/me', profile);
      setUser(data);
      toast.success('Profil mis à jour');
    } catch { toast.error('Erreur'); }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Avatar className="h-14 w-14">
          <AvatarImage src={user?.avatar || ''} />
          <AvatarFallback className="bg-[hsl(var(--secondary))] text-white text-lg">{user?.name?.[0]}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="font-display text-3xl">Bonjour, {user?.name}</h1>
          <div className="text-sm text-muted-foreground flex flex-wrap items-center gap-2 mt-1"><span>{user?.email}</span><span>·</span><Badge variant="secondary">{user?.role === 'ADMIN' ? 'Administrateur' : 'Voyageur'}</Badge></div>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="bookings" data-testid="dashboard-tab-bookings"><CalendarDays className="h-4 w-4 mr-2" /> Mes réservations</TabsTrigger>
          <TabsTrigger value="favorites" data-testid="dashboard-tab-favorites"><Heart className="h-4 w-4 mr-2" /> Mes favoris</TabsTrigger>
          <TabsTrigger value="profile" data-testid="dashboard-tab-profile">Mon profil</TabsTrigger>
        </TabsList>

        <TabsContent value="bookings" className="mt-6">
          {loading ? <Skeleton className="h-40 w-full" /> : bookings.length === 0 ? (
            <div className="text-center py-20 border border-dashed rounded-2xl">
              <CalendarDays className="h-10 w-10 mx-auto text-muted-foreground" />
              <p className="mt-3">Aucune réservation pour le moment.</p>
              <div className="flex gap-2 justify-center mt-4">
                <Link to="/stays"><Button>Découvrir des logements</Button></Link>
                <Link to="/experiences"><Button variant="outline">Découvrir des expériences</Button></Link>
              </div>
            </div>
          ) : (
            <div className="space-y-4" data-testid="my-bookings-list">
              {bookings.map((b) => (
                <div key={b.id} data-testid="booking-row" className="flex flex-col sm:flex-row gap-4 rounded-2xl bg-white border border-border p-4">
                  {b.target_image && <img src={b.target_image} alt="" className="w-full sm:w-48 h-32 object-cover rounded-xl" />}
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Link to={`/${b.type === 'property' ? 'stays' : 'experiences'}/${b.target_id}`} className="font-semibold hover:underline">{b.target_title}</Link>
                        <p className="text-xs text-muted-foreground uppercase tracking-wide mt-0.5">{b.type === 'property' ? 'Logement' : 'Expérience'}</p>
                      </div>
                      <Badge className={STATUS_STYLE[b.status]}>{STATUS_LABEL[b.status]}</Badge>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-y-1 text-sm text-muted-foreground">
                      {b.type === 'property' ? (<><span>Du {formatDateFR(b.check_in)} au {formatDateFR(b.check_out)}</span><span>{b.guests} voyageur(s)</span></>) : (<><span>Le {formatDateFR(b.experience_date)}</span><span>{b.participants} participant(s)</span></>)}
                      <span className="col-span-2">{PAY_LABEL[b.payment_status]}</span>
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <p className="font-semibold">{formatXOF(b.total_price)}</p>
                      {(b.status === 'confirmed' || b.status === 'completed') && <ReviewDialog booking={b} onDone={load} />}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="favorites" className="mt-6">
          {loading ? <Skeleton className="h-40 w-full" /> : favs.length === 0 ? (
            <div className="text-center py-20 border border-dashed rounded-2xl">
              <Heart className="h-10 w-10 mx-auto text-muted-foreground" />
              <p className="mt-3">Pas encore de favoris.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5" data-testid="my-favorites-grid">
              {favs.map((f) => f.type === 'property' ? <PropertyCard key={f.id} item={{...f.target, _isFavorite: true}} onFavoriteChange={load} /> : <ExperienceCard key={f.id} item={{...f.target, _isFavorite: true}} onFavoriteChange={load} />)}
            </div>
          )}
        </TabsContent>

        <TabsContent value="profile" className="mt-6">
          <div className="max-w-lg rounded-2xl bg-white border border-border p-6 space-y-4">
            <div><Label>Nom</Label><Input value={profile.name} onChange={(e) => setProfile({...profile, name: e.target.value})} data-testid="profile-name-input" /></div>
            <div><Label>Téléphone</Label><Input value={profile.phone} onChange={(e) => setProfile({...profile, phone: e.target.value})} data-testid="profile-phone-input" /></div>
            <div><Label>Avatar (URL)</Label><Input value={profile.avatar} onChange={(e) => setProfile({...profile, avatar: e.target.value})} data-testid="profile-avatar-input" /></div>
            <Button onClick={saveProfile} className="bg-[hsl(var(--primary))]" data-testid="save-profile-button">Enregistrer</Button>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DashboardPage;
