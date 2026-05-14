import axios from 'axios';

export const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
export const API = `${BACKEND_URL}/api`;

export const api = axios.create({
  baseURL: API,
  withCredentials: true,
});

// Attach JWT from localStorage on each request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('ts_token');
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const formatXOF = (n) => {
  if (n === null || n === undefined) return '';
  return new Intl.NumberFormat('fr-FR').format(Number(n)) + ' FCFA';
};

export const formatDateFR = (d) => {
  try {
    const date = typeof d === 'string' ? new Date(d) : d;
    return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
  } catch {
    return '';
  }
};

export const PROPERTY_AMENITIES = [
  'Wifi', 'Piscine', 'Climatisation', 'Vue mer', 'Vue fleuve', 'Vue nature',
  'Parking', 'Cuisine équipée', 'Balcon', 'Petit-déjeuner inclus',
  'Accès plage', 'Pirogue', 'Patrimoine UNESCO',
];

export const PROPERTY_TYPES = [
  { value: 'villa', label: 'Villa' },
  { value: 'apartment', label: 'Appartement' },
  { value: 'riad', label: 'Suite / Riad' },
  { value: 'guesthouse', label: 'Maison d’hôtes' },
];

export const EXPERIENCE_CATEGORIES = [
  { value: 'culture', label: 'Culture', icon: '🎭' },
  { value: 'gastronomie', label: 'Gastronomie', icon: '🍽️' },
  { value: 'aventure', label: 'Aventure', icon: '🏞️' },
  { value: 'nightlife', label: 'Nightlife', icon: '🌃' },
  { value: 'lifestyle', label: 'Lifestyle', icon: '✨' },
];
