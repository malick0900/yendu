import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, formatXOF, formatDateFR, EXPERIENCE_CATEGORIES } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, Star, MapPin, Heart, CalendarDays, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { resolveImage } from '@/components/ImageUpload';

const ExperienceDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [item, setItem] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState();
  const [participants, setParticipants] = useState('1');
  const [booking, setBooking] = useState(false);
  const [favored, setFavored] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get(`/experiences/${id}`).then((r) => setItem(r.data)).catch(() => toast.error('Expérience introuvable')).finally(() => setLoading(false));
    api.get('/reviews', { params: { type: 'experience', target_id: id } }).then((r) => setReviews(r.data));
  }, [id]);

  useEffect(() => {
    if (!user) return;
    api.get('/favorites/me').then((r) => setFavored(r.data.some((f) => f.type === 'experience' && f.target_id === id)));
  }, [user, id]);

  const reserve = async () => {
    if (!user) { navigate('/login'); return; }
    if (!date) { toast.error('Choisissez une date'); return; }
    setBooking(true);
    try {
      await api.post('/bookings', {
        type: 'experience', target_id: id,
        experience_date: date.toISOString().slice(0, 10),
        participants: Number(participants), guests: Number(participants),
      });
      toast.success('Réservation créée ! Notre équipe la confirmera sous peu.');
      navigate('/dashboard');
    } catch (e) { toast.error(e?.response?.data?.detail || 'Erreur'); }
    finally { setBooking(false); }
  };

  const toggleFav = async () => {
    if (!user) { navigate('/login'); return; }
    if (favored) { await api.delete('/favorites', { params: { type: 'experience', target_id: id } }); setFavored(false); }
    else { await api.post('/favorites', { type: 'experience', target_id: id }); setFavored(true); }
  };

  if (loading || !item) return <div className="max-w-6xl mx-auto px-4 py-8"><Skeleton className="h-80 w-full rounded-3xl" /></div>;
  const cat = EXPERIENCE_CATEGORIES.find((c) => c.value === item.category);
  const total = (item.price || 0) * Number(participants);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <h1 data-testid="experience-title" className="font-display text-3xl sm:text-4xl tracking-tight">{item.title}</h1>
      <div className="flex flex-wrap items-center gap-3 text-sm mt-2 text-muted-foreground">
        {cat && <span className="inline-flex items-center gap-1 text-foreground">{cat.icon} {cat.label}</span>}
        <span>·</span>
        <span className="inline-flex items-center gap-1"><Star className="h-4 w-4 fill-foreground text-foreground" /> <strong className="text-foreground">{item.rating_avg?.toFixed(1) || '—'}</strong> ({item.rating_count} avis)</span>
        <span>·</span>
        <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" /> {item.city}</span>
        <button onClick={toggleFav} data-testid="exp-favorite-button" className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-white hover:bg-muted">
          <Heart className={`h-4 w-4 ${favored ? 'fill-[hsl(var(--primary))] text-[hsl(var(--primary))]' : ''}`} /> {favored ? 'Sauvegardé' : 'Sauvegarder'}
        </button>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2 rounded-3xl overflow-hidden h-[420px]">
        <div className="col-span-2 md:col-span-1 row-span-2 relative"><img src={resolveImage(item.images?.[0])} alt={item.title} className="absolute inset-0 h-full w-full object-cover" /></div>
        {item.images?.slice(1, 3).map((src, i) => (
          <div key={i} className="hidden md:block relative"><img src={resolveImage(src)} alt="" className="absolute inset-0 h-full w-full object-cover" /></div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-10 mt-10">
        <div>
          <div className="flex flex-wrap gap-4 text-sm pb-6 border-b border-border">
            <span className="inline-flex items-center gap-2"><Clock className="h-4 w-4" /> {item.duration_hours}h</span>
            <span className="inline-flex items-center gap-2"><Users className="h-4 w-4" /> Max {item.max_participants} pers.</span>
            <span className="inline-flex items-center gap-2"><MapPin className="h-4 w-4" /> {item.meeting_point}</span>
          </div>

          <h2 className="font-display text-2xl mt-6">L’expérience</h2>
          <p className="mt-3 leading-relaxed text-foreground/85 whitespace-pre-line">{item.description}</p>

          <h3 className="font-display text-xl mt-8">Inclus</h3>
          <ul className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
            {(item.included || []).map((i) => (<li key={i} className="inline-flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--primary))]" /> {i}</li>))}
          </ul>

          <h3 className="font-display text-xl mt-8">Votre guide</h3>
          <div className="flex items-center gap-4 mt-3 rounded-2xl border border-border bg-white p-4">
            <Avatar className="h-14 w-14">
              <AvatarImage src={resolveImage(item.host_avatar)} />
              <AvatarFallback>{item.host_name?.[0]}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{item.host_name}</p>
              <p className="text-sm text-muted-foreground">{item.host_bio}</p>
            </div>
          </div>

          <h3 className="font-display text-xl mt-10">Avis ({reviews.length})</h3>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviews.length === 0 && <p className="text-sm text-muted-foreground">Pas encore d’avis.</p>}
            {reviews.map((r) => (
              <div key={r.id} className="rounded-2xl bg-white border border-border p-5">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9"><AvatarImage src={r.user_avatar || ''} /><AvatarFallback>{r.user_name?.[0]}</AvatarFallback></Avatar>
                  <div><p className="text-sm font-semibold">{r.user_name}</p><p className="text-xs text-muted-foreground">{formatDateFR(r.created_at)}</p></div>
                  <div className="ml-auto flex text-[hsl(var(--premium))]">{[...Array(r.rating)].map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-current" />)}</div>
                </div>
                <p className="text-sm mt-3">{r.comment}</p>
              </div>
            ))}
          </div>
        </div>

        <aside className="lg:sticky lg:top-24 self-start">
          <div className="rounded-3xl border border-border bg-white p-5 shadow-[0_18px_50px_rgba(20,19,18,0.10)]" data-testid="experience-booking-card">
            <p className="text-xl"><span className="font-semibold">{formatXOF(item.price)}</span> <span className="text-muted-foreground text-sm">/ pers.</span></p>
            <div className="mt-4 space-y-3">
              <Popover>
                <PopoverTrigger asChild>
                  <button data-testid="exp-booking-date-button" className="w-full flex items-center gap-2 px-4 py-3 rounded-xl border border-border text-left text-sm hover:bg-muted/40">
                    <CalendarDays className="h-4 w-4" /><span className={date ? '' : 'text-muted-foreground'}>{date ? format(date, 'd MMM yyyy', { locale: fr }) : 'Choisir la date'}</span>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="p-0"><Calendar mode="single" selected={date} onSelect={setDate} disabled={{ before: new Date() }} locale={fr} /></PopoverContent>
              </Popover>
              <Select value={participants} onValueChange={setParticipants}>
                <SelectTrigger data-testid="exp-booking-participants" className="h-12 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>{[...Array(item.max_participants).keys()].map((n) => (<SelectItem key={n+1} value={String(n+1)}>{n+1} participant{n+1 > 1 ? 's' : ''}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <Button onClick={reserve} disabled={booking} className="w-full mt-4 h-12 rounded-xl bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90" data-testid="exp-booking-reserve-button">
              {booking ? 'Réservation…' : 'Réserver'}
            </Button>
            <div className="mt-5 text-sm space-y-2">
              <div className="flex justify-between"><span>{formatXOF(item.price)} x {participants}</span><span>{formatXOF(total)}</span></div>
              <div className="flex justify-between pt-2 border-t border-border font-semibold"><span>Total</span><span>{formatXOF(total)}</span></div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default ExperienceDetailPage;
