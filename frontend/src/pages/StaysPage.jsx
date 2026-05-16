import React, { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { api, PROPERTY_AMENITIES, PROPERTY_TYPES, formatXOF } from '@/lib/api';
import { PropertyCard } from '@/components/PropertyCard';
import { MapView } from '@/components/MapView';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { SlidersHorizontal, MapPin, List, Map as MapIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const useQuery = () => {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
};

const StaysPage = () => {
  const query = useQuery();
  const [destinations, setDestinations] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('list');

  const [destination, setDestination] = useState(query.get('destination') || 'all');
  const [type, setType] = useState('all');
  const [priceRange, setPriceRange] = useState([20000, 250000]);
  const [guests, setGuests] = useState(query.get('guests') || 'all');
  const [amenities, setAmenities] = useState([]);
  const [sort, setSort] = useState('recent');

  useEffect(() => { api.get('/destinations').then((r) => setDestinations(r.data)); }, []);

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (destination !== 'all') params.destination = destination;
    if (type !== 'all') params.type = type;
    params.min_price = priceRange[0];
    params.max_price = priceRange[1];
    if (guests !== 'all') params.guests = guests;
    if (amenities.length) params.amenities = amenities.join(',');
    if (sort) params.sort = sort;
    api.get('/properties', { params }).then((r) => setItems(r.data)).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destination, type, priceRange[0], priceRange[1], guests, amenities, sort]);

  const toggleAmenity = (a) => setAmenities((prev) => prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]);
  const clearFilters = () => { setDestination('all'); setType('all'); setPriceRange([20000, 250000]); setGuests('all'); setAmenities([]); setSort('recent'); };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl">Hébergements au Sénégal</h1>
          <p className="text-muted-foreground mt-1">{loading ? 'Recherche…' : `${items.length} hébergement${items.length > 1 ? 's' : ''} disponible${items.length > 1 ? 's' : ''}`}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Tabs value={view} onValueChange={setView} className="hidden lg:block">
            <TabsList>
              <TabsTrigger value="list" data-testid="stays-list-tab"><List className="h-4 w-4 mr-2" /> Liste</TabsTrigger>
              <TabsTrigger value="map" data-testid="stays-map-tab"><MapIcon className="h-4 w-4 mr-2" /> Carte</TabsTrigger>
            </TabsList>
          </Tabs>
          <Select value={sort} onValueChange={setSort}>
            <SelectTrigger className="w-[180px]" data-testid="stays-sort-select"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Récents</SelectItem>
              <SelectItem value="price_asc">Prix croissant</SelectItem>
              <SelectItem value="price_desc">Prix décroissant</SelectItem>
              <SelectItem value="rating">Mieux notés</SelectItem>
            </SelectContent>
          </Select>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" data-testid="filters-open-button" className="rounded-full"><SlidersHorizontal className="h-4 w-4 mr-2" /> Filtres</Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[360px] overflow-y-auto">
              <h2 className="font-display text-2xl mb-6 mt-6">Filtres</h2>
              <div className="space-y-6 pb-10">
                <div>
                  <label className="text-sm font-medium mb-2 block">Destination</label>
                  <Select value={destination} onValueChange={setDestination}>
                    <SelectTrigger data-testid="filter-destination"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes</SelectItem>
                      {destinations.map((d) => (<SelectItem key={d.slug} value={d.slug}>{d.name}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Type d’hébergement</label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger data-testid="filter-type"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous</SelectItem>
                      {PROPERTY_TYPES.map((t) => (<SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Voyageurs</label>
                  <Select value={guests} onValueChange={setGuests}>
                    <SelectTrigger data-testid="filter-guests"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Indifférent</SelectItem>
                      {[1,2,3,4,5,6,7,8].map((n) => (<SelectItem key={n} value={String(n)}>{n}+</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2"><label className="text-sm font-medium">Prix par nuit</label><span className="text-xs text-muted-foreground">{formatXOF(priceRange[0])} — {formatXOF(priceRange[1])}</span></div>
                  <Slider min={10000} max={300000} step={5000} value={priceRange} onValueChange={setPriceRange} data-testid="filter-price-slider" />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Équipements</label>
                  <div className="grid grid-cols-2 gap-2">
                    {PROPERTY_AMENITIES.map((a) => (
                      <label key={a} className="flex items-center gap-2 text-sm cursor-pointer">
                        <Checkbox checked={amenities.includes(a)} onCheckedChange={() => toggleAmenity(a)} data-testid={`filter-amenity-${a}`} /> {a}
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2 pt-3 border-t border-border">
                  <Button variant="outline" onClick={clearFilters} className="flex-1" data-testid="filters-clear-button">Réinitialiser</Button>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>

      <div className={`grid gap-6 ${view === 'map' ? 'lg:grid-cols-[1fr_460px]' : 'grid-cols-1'}`}>
        <div>
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-80 w-full rounded-2xl" />)}</div>
          ) : items.length === 0 ? (
            <div className="text-center py-20">
              <MapPin className="h-10 w-10 mx-auto text-muted-foreground" />
              <p className="mt-3 font-medium">Aucun hébergement avec ces critères</p>
              <Button variant="outline" className="mt-4" onClick={clearFilters}>Réinitialiser les filtres</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5" data-testid="stays-grid">
              {items.map((p) => (<PropertyCard key={p.id} item={p} />))}
            </div>
          )}
        </div>
        {view === 'map' && (
          <div className="hidden lg:block sticky top-24 self-start">
            <MapView items={items} type="property" height={700} />
          </div>
        )}
      </div>
    </div>
  );
};

export default StaysPage;
