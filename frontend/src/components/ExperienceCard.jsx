import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Star, Clock } from 'lucide-react';
import { formatXOF, api, EXPERIENCE_CATEGORIES } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { resolveImage } from '@/components/ImageUpload';

export const ExperienceCard = ({ item, onFavoriteChange }) => {
  const { user } = useAuth();
  const [favored, setFavored] = useState(item._isFavorite || false);
  const images = item.images?.length ? item.images : ['https://images.unsplash.com/photo-1528975604071-b4dc52a2d18c?w=1200'];
  const cat = EXPERIENCE_CATEGORIES.find((c) => c.value === item.category);

  const toggleFav = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.error('Connectez-vous pour sauvegarder en favori');
      return;
    }
    try {
      if (favored) {
        await api.delete('/favorites', { params: { type: 'experience', target_id: item.id } });
        setFavored(false);
      } else {
        await api.post('/favorites', { type: 'experience', target_id: item.id });
        setFavored(true);
      }
      onFavoriteChange?.();
    } catch {
      toast.error('Erreur, réessayez');
    }
  };

  return (
    <Link to={`/experiences/${item.id}`} data-testid="experience-card-open-link" className="group block">
      <article data-testid="experience-card" className="rounded-2xl overflow-hidden bg-white border border-border transition-[box-shadow,transform] duration-200 hover:shadow-[0_18px_50px_rgba(20,19,18,0.12)] hover:-translate-y-0.5">
        <div className="relative aspect-[4/5] overflow-hidden bg-muted">
          <img src={resolveImage(images[0])} alt={item.title} loading="lazy" className="absolute inset-0 h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
          <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/65 to-transparent" />
          {cat && (
            <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 backdrop-blur px-2.5 py-1 text-[11px] font-semibold tracking-wide text-foreground">
              <span>{cat.icon}</span> {cat.label}
            </span>
          )}
          <button onClick={toggleFav} aria-label="favori" data-testid="experience-card-favorite-button" className="absolute right-3 top-3 inline-flex items-center justify-center h-9 w-9 rounded-full bg-white/95 backdrop-blur border border-border hover:scale-105 transition-transform">
            <Heart className={`h-4 w-4 ${favored ? 'fill-[hsl(var(--primary))] text-[hsl(var(--primary))]' : 'text-foreground/80'}`} />
          </button>
          <div className="absolute inset-x-0 bottom-0 p-4 text-white">
            <h3 className="font-display text-lg leading-snug line-clamp-2 drop-shadow-sm">{item.title}</h3>
            <p className="text-xs text-white/80 mt-1">{item.city}</p>
          </div>
        </div>
        <div className="p-4 flex items-center justify-between text-sm">
          <div className="flex items-center gap-3 text-muted-foreground">
            <span className="inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> {item.duration_hours}h</span>
            <span className="inline-flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-foreground text-foreground" /> {item.rating_avg?.toFixed(1) || '—'}</span>
          </div>
          <p className="font-semibold">{formatXOF(item.price)}</p>
        </div>
      </article>
    </Link>
  );
};
