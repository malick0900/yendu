import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Star } from 'lucide-react';
import { formatXOF, api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { resolveImage } from '@/components/ImageUpload';

export const PropertyCard = ({ item, onFavoriteChange }) => {
  const { user } = useAuth();
  const [favored, setFavored] = useState(item._isFavorite || false);
  const [hoverIdx, setHoverIdx] = useState(0);
  const images = item.images?.length ? item.images : ['https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200'];

  const toggleFav = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.error('Connectez-vous pour sauvegarder en favori');
      return;
    }
    try {
      if (favored) {
        await api.delete('/favorites', { params: { type: 'property', target_id: item.id } });
        setFavored(false);
      } else {
        await api.post('/favorites', { type: 'property', target_id: item.id });
        setFavored(true);
      }
      onFavoriteChange?.();
    } catch {
      toast.error('Erreur, réessayez');
    }
  };

  return (
    <Link to={`/stays/${item.id}`} data-testid="stay-card-open-link" className="group block" >
      <article data-testid="stay-card" className="rounded-2xl overflow-hidden bg-white border border-border transition-[box-shadow,transform] duration-200 hover:shadow-[0_18px_50px_rgba(20,19,18,0.12)] hover:-translate-y-0.5">
        <div className="relative aspect-[4/3] overflow-hidden bg-muted">
          <img
            src={resolveImage(images[hoverIdx % images.length])}
            alt={item.title}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover"
            onMouseEnter={() => images.length > 1 && setHoverIdx((i) => i + 1)}
          />
          {item.is_premium && (
            <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full bg-white/95 backdrop-blur px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-[hsl(var(--secondary))] border border-[hsl(var(--premium))]/40">
              <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--premium))]" /> Premium
            </span>
          )}
          <button onClick={toggleFav} aria-label="favori" data-testid="stay-card-favorite-button" className="absolute right-3 top-3 inline-flex items-center justify-center h-9 w-9 rounded-full bg-white/95 backdrop-blur border border-border hover:scale-105 transition-transform">
            <Heart className={`h-4 w-4 ${favored ? 'fill-[hsl(var(--primary))] text-[hsl(var(--primary))]' : 'text-foreground/80'}`} />
          </button>
        </div>
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-[15px] leading-tight line-clamp-1">{item.title}</h3>
            <div className="flex items-center gap-1 text-sm text-foreground/80 shrink-0">
              <Star className="h-3.5 w-3.5 fill-foreground" /> {item.rating_avg?.toFixed(1) || '—'}
            </div>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">{item.city} · {item.bedrooms} ch · {item.max_guests} voy.</p>
          <p className="mt-2 text-[15px]"><span className="font-semibold">{formatXOF(item.price_per_night)}</span> <span className="text-muted-foreground text-sm">/ nuit</span></p>
        </div>
      </article>
    </Link>
  );
};
