import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { MapPin, CalendarDays, Users, Search } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { api } from '@/lib/api';

export const SearchBar = ({ defaultMode = 'stays', onSearch }) => {
  const navigate = useNavigate();
  const [mode, setMode] = useState(defaultMode);
  const [destinations, setDestinations] = useState([]);
  const [destination, setDestination] = useState('all');
  const [range, setRange] = useState({ from: undefined, to: undefined });
  const [guests, setGuests] = useState('2');

  useEffect(() => {
    api.get('/destinations').then((r) => setDestinations(r.data)).catch(() => {});
  }, []);

  const submit = (e) => {
    e?.preventDefault?.();
    const params = new URLSearchParams();
    if (destination && destination !== 'all') params.set('destination', destination);
    if (range.from) params.set('check_in', range.from.toISOString().slice(0, 10));
    if (range.to) params.set('check_out', range.to.toISOString().slice(0, 10));
    if (guests) params.set('guests', guests);
    if (onSearch) {
      onSearch({ destination, range, guests, mode });
    } else {
      navigate(`/${mode}?${params.toString()}`);
    }
  };

  return (
    <form onSubmit={submit} data-testid="hero-search-form" className="w-full max-w-5xl mx-auto">
      <div className="flex justify-center mb-3 gap-2">
        <button type="button" onClick={() => setMode('stays')} data-testid="search-mode-stays" className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${mode === 'stays' ? 'bg-white text-foreground shadow-sm' : 'bg-white/25 text-white hover:bg-white/40'}`}>Logements</button>
        <button type="button" onClick={() => setMode('experiences')} data-testid="search-mode-experiences" className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${mode === 'experiences' ? 'bg-white text-foreground shadow-sm' : 'bg-white/25 text-white hover:bg-white/40'}`}>Expériences</button>
      </div>
      <div className="rounded-3xl md:rounded-full bg-white/95 backdrop-blur border border-border shadow-[0_18px_50px_rgba(20,19,18,0.18)] p-2 grid grid-cols-1 md:grid-cols-[1.3fr_1fr_0.9fr_auto] gap-1">
        <div className="flex items-center gap-2 px-4 rounded-full hover:bg-muted/60 transition-colors h-12">
          <MapPin className="h-4 w-4 text-foreground/60" />
          <Select value={destination} onValueChange={setDestination}>
            <SelectTrigger data-testid="hero-search-destination-input" className="border-0 shadow-none p-0 h-auto focus:ring-0 bg-transparent">
              <SelectValue placeholder="Où part-on ?" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes les destinations</SelectItem>
              {destinations.map((d) => (
                <SelectItem key={d.slug} value={d.slug}>{d.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <button type="button" data-testid="hero-search-dates-button" className="flex items-center gap-2 px-4 rounded-full hover:bg-muted/60 transition-colors h-12 text-left text-sm">
              <CalendarDays className="h-4 w-4 text-foreground/60" />
              <span className={range.from ? '' : 'text-muted-foreground'}>
                {range.from ? (range.to ? `${format(range.from, 'd MMM', { locale: fr })} — ${format(range.to, 'd MMM', { locale: fr })}` : format(range.from, 'd MMM yyyy', { locale: fr })) : 'Dates'}
              </span>
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="p-0" data-testid="date-picker-calendar">
            <Calendar mode="range" selected={range} onSelect={(r) => setRange(r || { from: undefined, to: undefined })} numberOfMonths={2} disabled={{ before: new Date() }} locale={fr} />
          </PopoverContent>
        </Popover>

        <div className="flex items-center gap-2 px-4 rounded-full hover:bg-muted/60 transition-colors h-12">
          <Users className="h-4 w-4 text-foreground/60" />
          <Select value={guests} onValueChange={setGuests}>
            <SelectTrigger data-testid="hero-search-guests-select" className="border-0 shadow-none p-0 h-auto focus:ring-0 bg-transparent">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[1,2,3,4,5,6,7,8].map((n) => (
                <SelectItem key={n} value={String(n)}>{n} voyageur{n > 1 ? 's' : ''}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button type="submit" data-testid="hero-search-submit-button" className="h-12 px-5 rounded-full bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/90 text-white">
          <Search className="h-4 w-4 mr-2" /> Rechercher
        </Button>
      </div>
    </form>
  );
}
