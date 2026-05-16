import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { api, EXPERIENCE_CATEGORIES, formatXOF } from '@/lib/api';
import { ExperienceCard } from '@/components/ExperienceCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Skeleton } from '@/components/ui/skeleton';

const useQuery = () => {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
};

const ExperiencesPage = () => {
  const query = useQuery();
  const [destinations, setDestinations] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const [category, setCategory] = useState(query.get('category') || 'all');
  const [destination, setDestination] = useState(query.get('destination') || 'all');
  const [priceRange, setPriceRange] = useState([10000, 60000]);
  const [sort, setSort] = useState('recent');

  useEffect(() => { api.get('/destinations').then((r) => setDestinations(r.data)); }, []);

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (category !== 'all') params.category = category;
    if (destination !== 'all') params.destination = destination;
    params.min_price = priceRange[0];
    params.max_price = priceRange[1];
    if (sort) params.sort = sort;
    api.get('/experiences', { params }).then((r) => setItems(r.data)).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, destination, priceRange[0], priceRange[1], sort]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl">Expériences locales</h1>
          <p className="text-muted-foreground mt-1">Vivez le Sénégal de l’intérieur.</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-[180px]" data-testid="experiences-sort-select"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Récentes</SelectItem>
              <SelectItem value="price_asc">Prix croissant</SelectItem>
              <SelectItem value="price_desc">Prix décroissant</SelectItem>
              <SelectItem value="rating">Mieux notées</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-6" data-testid="experiences-category-tabs">
        <button onClick={() => setCategory('all')} className={`px-4 py-2 rounded-full text-sm font-medium border ${category === 'all' ? 'bg-foreground text-white border-foreground' : 'bg-white border-border hover:bg-muted'}`} data-testid="experience-cat-all">Toutes</button>
        {EXPERIENCE_CATEGORIES.map((c) => (
          <button key={c.value} onClick={() => setCategory(c.value)} className={`px-4 py-2 rounded-full text-sm font-medium border inline-flex items-center gap-1.5 ${category === c.value ? 'bg-foreground text-white border-foreground' : 'bg-white border-border hover:bg-muted'}`} data-testid={`experience-cat-${c.value}`}>
            <span>{c.icon}</span> {c.label}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-4 items-end mb-6">
        <div className="min-w-[200px]">
          <label className="text-xs font-medium block mb-1">Destination</label>
          <Select value={destination} onValueChange={setDestination}>
            <SelectTrigger data-testid="exp-filter-destination"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes</SelectItem>
              {destinations.map((d) => (<SelectItem key={d.slug} value={d.slug}>{d.name}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
        <div className="min-w-[260px] flex-1 max-w-md">
          <div className="flex items-center justify-between mb-1"><label className="text-xs font-medium">Prix</label><span className="text-xs text-muted-foreground">{formatXOF(priceRange[0])} — {formatXOF(priceRange[1])}</span></div>
          <Slider min={5000} max={80000} step={1000} value={priceRange} onValueChange={setPriceRange} data-testid="exp-filter-price-slider" />
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">{Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-96 w-full rounded-2xl" />)}</div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">Aucune expérience trouvée.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5" data-testid="experiences-grid">
          {items.map((e) => (<ExperienceCard key={e.id} item={e} />))}
        </div>
      )}
    </div>
  );
};

export default ExperiencesPage;
