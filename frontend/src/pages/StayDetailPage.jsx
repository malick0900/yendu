import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api, formatXOF, formatDateFR } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogTrigger } from '@/components/ui/dialog';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Bed, Bath, Users, Star, MapPin, Wifi, Coffee, Heart, ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { format, differenceInCalendarDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import L from 'leaflet';
import { resolveImage } from '@/components/ImageUpload';
import Seo, { SITE_URL } from '@/components/Seo';

const markerIcon = L.divIcon({ className: 'ts-marker-wrap', html: '<div class="ts-marker ts-marker--active"><span class="ts-marker__dot"></span>Ici</div>', iconSize: [60, 32], iconAnchor: [30, 16] });

const StayDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [item, setItem] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState({ from: undefined, to: undefined });
  const [guests, setGuests] = useState('2');
  const [booking, setBooking] = useState(false);
  const [favored, setFavored] = useState(false);
  const [disabledDays, setDisabledDays] = useState([{ before: new Date() }]);

  useEffect(() => {
    setLoading(true);
    api.get(`/properties/${id}`).then((r) => setItem(r.data)).catch(() => toast.error('Logement introuvable')).finally(() => setLoading(false));
    api.get('/reviews', { params: { type: 'property', target_id: id } }).then((r) => setReviews(r.data));
    api.get(`/properties/${id}/availability`).then((r) => {
      // Backend returns half-open ranges; for the date picker we disable from start_date up to the day BEFORE end_date,
      // so a guest can still check in the morning a previous guest checks out.
      const blocks = (r.data || [])
        .map((b) => {
          try {
            const from = new Date(b.start_date);
            const end = new Date(b.end_date);
            const to = new Date(end);
            to.setDate(to.getDate() - 1);
            return to >= from ? { from, to } : null;
          } catch { return null; }
        })
        .filter(Boolean);
      setDisabledDays([{ before: new Date() }, ...blocks]);
    }).catch(() => {});
  }, [id]);

  useEffect(() => {
    if (!user) return;
    api.get('/favorites/me').then((r) => {
      setFavored(r.data.some((f) => f.type === 'property' && f.target_id === id));
    });
  }, [user, id]);

  const [promoInput, setPromoInput] = useState('');
  const [promo, setPromo] = useState(null); // { code, discount_percent }
  const [promoChecking, setPromoChecking] = useState(false);

  const nights = range.from && range.to ? Math.max(differenceInCalendarDays(range.to, range.from), 1) : 0;
  const gross = nights * (item?.price_per_night || 0);
  const discount = promo ? Math.floor((gross * promo.discount_percent) / 100) : 0;
  const total = gross - discount;

  const applyPromo = async () => {
    const code = promoInput.trim().toUpperCase();
    if (!code) return;
    setPromoChecking(true);
    try {
      const { data } = await api.post('/promo-codes/validate', { code });
      setPromo(data);
      setPromoInput(data.code);
      toast.success(`-${data.discount_percent}% appliqué`);
    } catch (e) {
      setPromo(null);
      toast.error(e?.response?.data?.detail || 'Code invalide');
    } finally { setPromoChecking(false); }
  };

  const removePromo = () => { setPromo(null); setPromoInput(''); };

  const reserve = async () => {
    if (!user) { navigate('/login?next=/stays/' + id); return; }
    if (!range.from || !range.to) { toast.error('Choisissez les dates de séjour'); return; }
    setBooking(true);
    try {
      await api.post('/bookings', {
        type: 'property', target_id: id,
        check_in: range.from.toISOString().slice(0, 10),
        check_out: range.to.toISOString().slice(0, 10),
        guests: Number(guests), participants: Number(guests),
        promo_code: promo?.code || null,
      });
      toast.success('Réservation créée ! Notre équipe la confirmera sous peu.');
      navigate('/dashboard');
    } catch (e) {
      toast.error(e?.response?.data?.detail || 'Erreur lors de la réservation');
    } finally { setBooking(false); }
  };

  const toggleFav = async () => {
    if (!user) { navigate('/login'); return; }
    if (favored) {
      await api.delete('/favorites', { params: { type: 'property', target_id: id } });
      setFavored(false);
    } else {
      await api.post('/favorites', { type: 'property', target_id: id });
      setFavored(true);
    }
  };

  if (loading || !item) {
    return <div className="max-w-6xl mx-auto px-4 py-8 space-y-4"><Skeleton className="h-96 w-full rounded-3xl" /><Skeleton className="h-8 w-2/3" /><Skeleton className="h-40 w-full" /></div>;
  }

  const images = item.images || [];
  const seoImage = resolveImage(images[0]);
  const seoDesc = (item.description || `${item.title} à ${item.city || 'Sénégal'} — réservez sur Yendou.`).slice(0, 160);
  const stayJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: item.title,
    description: item.description || seoDesc,
    image: images.map(resolveImage).filter(Boolean),
    ...(item.rating_count > 0 ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: item.rating_avg, reviewCount: item.rating_count } } : {}),
    offers: { '@type': 'Offer', price: item.price_per_night, priceCurrency: 'XOF', availability: 'https://schema.org/InStock', url: `${SITE_URL}/stays/${id}` },
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      <Seo title={item.title} description={seoDesc} image={seoImage} type="product" path={`/stays/${id}`} jsonLd={stayJsonLd} />
      <h1 data-testid="stay-title" className="font-display text-3xl sm:text-4xl tracking-tight">{item.title}</h1>
      <div className="flex flex-wrap items-center gap-3 text-sm mt-2 text-muted-foreground">
        <span className="inline-flex items-center gap-1"><Star className="h-4 w-4 fill-foreground text-foreground" /> <strong className="text-foreground">{item.rating_avg?.toFixed(1) || '—'}</strong> ({item.rating_count} avis)</span>
        <span>·</span>
        <span className="inline-flex items-center gap-1"><MapPin className="h-4 w-4" /> {item.city}</span>
        <button onClick={toggleFav} data-testid="stay-favorite-button" className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-white hover:bg-muted">
          <Heart className={`h-4 w-4 ${favored ? 'fill-[hsl(var(--primary))] text-[hsl(var(--primary))]' : ''}`} /> {favored ? 'Sauvegardé' : 'Sauvegarder'}
        </button>
      </div>

      {/* Gallery */}
      <div className="mt-5 grid grid-cols-4 gap-2 rounded-3xl overflow-hidden h-[420px]" data-testid="stay-gallery">
        <div className="col-span-4 md:col-span-2 row-span-2 relative">
          <img src={resolveImage(images[0])} alt={item.title} className="absolute inset-0 h-full w-full object-cover" />
        </div>
        {[1,2,3,4].map((i) => images[i] && (
          <div key={i} className="hidden md:block relative">
            <img src={resolveImage(images[i])} alt={`photo-${i}`} className="absolute inset-0 h-full w-full object-cover" />
          </div>
        ))}
        <Dialog>
          <DialogTrigger asChild>
            <button data-testid="stay-gallery-open-button" className="absolute right-4 bottom-4 bg-white border border-border px-3 py-1.5 rounded-full text-sm font-medium shadow hover:bg-muted">Voir toutes les photos</button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl">
            <Carousel className="w-full" data-testid="stay-gallery-carousel">
              <CarouselContent>{images.map((src, i) => (
                <CarouselItem key={i}><img src={resolveImage(src)} alt={`p-${i}`} className="w-full h-[500px] object-cover rounded-2xl" /></CarouselItem>
              ))}</CarouselContent>
              <CarouselPrevious /><CarouselNext />
            </Carousel>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-10 mt-10">
        <div>
          <div className="flex flex-wrap gap-4 text-sm pb-6 border-b border-border">
            <span className="inline-flex items-center gap-2"><Users className="h-4 w-4" /> {item.max_guests} voyageurs</span>
            <span className="inline-flex items-center gap-2"><Bed className="h-4 w-4" /> {item.bedrooms} chambre{item.bedrooms > 1 ? 's' : ''}</span>
            <span className="inline-flex items-center gap-2"><Bath className="h-4 w-4" /> {item.bathrooms} salle{item.bathrooms > 1 ? 's' : ''} de bain</span>
          </div>
          <h2 className="font-display text-2xl mt-6">À propos de ce lieu</h2>
          <p className="mt-3 leading-relaxed text-foreground/85 whitespace-pre-line">{item.description}</p>

          <h3 className="font-display text-xl mt-8">Équipements</h3>
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
            {(item.amenities || []).map((a) => (
              <div key={a} className="inline-flex items-center gap-2 text-sm rounded-xl border border-border bg-white px-3 py-2">
                {a === 'Wifi' ? <Wifi className="h-4 w-4" /> : a === 'Petit-déjeuner inclus' ? <Coffee className="h-4 w-4" /> : <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--primary))]" />}
                {a}
              </div>
            ))}
          </div>

          <h3 className="font-display text-xl mt-8">Où vous serez</h3>
          <div className="mt-3 h-72 rounded-2xl overflow-hidden border border-border">
            <MapContainer center={[item.lat, item.lng]} zoom={14} className="h-full w-full" scrollWheelZoom={false}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Marker position={[item.lat, item.lng]} icon={markerIcon} />
            </MapContainer>
          </div>
          <p className="text-sm text-muted-foreground mt-2">{item.address}</p>

          <h3 className="font-display text-xl mt-10">Avis voyageurs ({reviews.length})</h3>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {reviews.length === 0 && <p className="text-sm text-muted-foreground">Pas encore d’avis. Soyez le premier !</p>}
            {reviews.map((r) => (
              <div key={r.id} className="rounded-2xl bg-white border border-border p-5">
                <div className="flex items-center gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={r.user_avatar || ''} />
                    <AvatarFallback className="text-xs bg-[hsl(var(--secondary))] text-white">{r.user_name?.[0]}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-semibold">{r.user_name}</p>
                    <p className="text-xs text-muted-foreground">{formatDateFR(r.created_at)}</p>
                  </div>
                  <div className="ml-auto flex text-[hsl(var(--premium))]">{[...Array(r.rating)].map((_, i) => <Star key={i} className="h-3.5 w-3.5 fill-current" />)}</div>
                </div>
                <p className="text-sm mt-3 leading-relaxed">{r.comment}</p>
              </div>
            ))}
          </div>
        </div>

        <aside className="lg:sticky lg:top-24 self-start">
          <div className="rounded-3xl border border-border bg-white p-5 shadow-[0_18px_50px_rgba(20,19,18,0.10)]" data-testid="booking-card">
            <p className="text-xl"><span className="font-semibold">{formatXOF(item.price_per_night)}</span> <span className="text-muted-foreground text-sm">/ nuit</span></p>
            <div className="mt-4 space-y-3">
              <Popover>
                <PopoverTrigger asChild>
                  <button data-testid="booking-dates-button" className="w-full flex items-center gap-2 px-4 py-3 rounded-xl border border-border text-left text-sm hover:bg-muted/40">
                    <CalendarDays className="h-4 w-4" />
                    <span className={range.from ? '' : 'text-muted-foreground'}>{range.from ? (range.to ? `${format(range.from, 'd MMM', { locale: fr })} — ${format(range.to, 'd MMM', { locale: fr })}` : format(range.from, 'd MMM', { locale: fr })) : 'Arrivée — Départ'}</span>
                  </button>
                </PopoverTrigger>
                <PopoverContent className="p-0"><Calendar mode="range" selected={range} onSelect={(r) => setRange(r || { from: undefined, to: undefined })} numberOfMonths={1} disabled={disabledDays} locale={fr} /></PopoverContent>
              </Popover>
              <Select value={guests} onValueChange={setGuests}>
                <SelectTrigger data-testid="booking-guests-select" className="h-12 rounded-xl"><SelectValue /></SelectTrigger>
                <SelectContent>{[...Array(item.max_guests).keys()].map((n) => (<SelectItem key={n+1} value={String(n+1)}>{n+1} voyageur{n+1 > 1 ? 's' : ''}</SelectItem>))}</SelectContent>
              </Select>
            </div>
            <div className="mt-3">
              {promo ? (
                <div className="flex items-center justify-between rounded-xl bg-[hsl(var(--primary))]/10 px-3 py-2 text-sm" data-testid="booking-promo-applied">
                  <span><strong className="font-mono">{promo.code}</strong> · -{promo.discount_percent}% appliqué</span>
                  <button onClick={removePromo} className="text-xs text-muted-foreground hover:text-foreground underline">Retirer</button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input placeholder="Code promo (optionnel)" value={promoInput} onChange={(e) => setPromoInput(e.target.value.toUpperCase())} className="h-11 rounded-xl uppercase" data-testid="booking-promo-input" />
                  <Button type="button" variant="outline" onClick={applyPromo} disabled={promoChecking || !promoInput.trim()} data-testid="booking-promo-apply" className="h-11 rounded-xl">{promoChecking ? '…' : 'Appliquer'}</Button>
                </div>
              )}
            </div>
            <Button onClick={reserve} disabled={booking} className="w-full mt-3 h-12 rounded-xl bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-base" data-testid="booking-reserve-button">
              {booking ? 'Réservation…' : 'Réserver'}
            </Button>
            {nights > 0 && (
              <div className="mt-5 text-sm space-y-2">
                <div className="flex justify-between"><span>{formatXOF(item.price_per_night)} x {nights} nuit{nights > 1 ? 's' : ''}</span><span>{formatXOF(gross)}</span></div>
                {discount > 0 && (
                  <div className="flex justify-between text-[hsl(var(--primary))]"><span>Code {promo.code}</span><span>−{formatXOF(discount)}</span></div>
                )}
                <div className="flex justify-between pt-2 border-t border-border font-semibold text-base"><span>Total</span><span>{formatXOF(total)}</span></div>
                <p className="text-xs text-muted-foreground pt-2">Paiement manuel — confirmation par l'équipe Yendou.</p>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default StayDetailPage;
