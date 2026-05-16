import React, { useEffect, useState } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

const ReviewFromTokenPage = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') || '';
  const [target, setTarget] = useState(null);
  const [error, setError] = useState('');
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!token) { setError('Lien invalide'); return; }
    api.get(`/reviews/token/${encodeURIComponent(token)}`)
      .then((r) => {
        setTarget(r.data);
        if (r.data.already_reviewed) setDone(true);
      })
      .catch((e) => setError(e?.response?.data?.detail || 'Lien invalide ou expiré'));
  }, [token]);

  const submit = async (e) => {
    e.preventDefault();
    if (!rating) { toast.error('Choisissez une note'); return; }
    if (comment.trim().length < 10) { toast.error('Votre commentaire doit faire au moins 10 caractères'); return; }
    setSubmitting(true);
    try {
      await api.post('/reviews/from-token', { token, rating, comment: comment.trim() });
      setDone(true);
    } catch (e) {
      toast.error(e?.response?.data?.detail || 'Erreur');
    } finally { setSubmitting(false); }
  };

  if (error) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <h1 className="font-display text-2xl">{error}</h1>
        <p className="text-sm text-muted-foreground mt-2">Si vous pensez qu'il s'agit d'une erreur, contactez-nous.</p>
        <Link to="/" className="inline-block mt-6 text-[hsl(var(--primary))] underline">Retour à l'accueil</Link>
      </div>
    );
  }

  if (!target) {
    return <div className="max-w-md mx-auto px-4 py-16 text-center text-muted-foreground">Chargement…</div>;
  }

  if (done) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <CheckCircle2 className="h-14 w-14 mx-auto text-[hsl(var(--primary))]" />
        <h1 className="font-display text-3xl mt-4">Merci pour votre avis !</h1>
        <p className="text-sm text-muted-foreground mt-2">Il aidera les futurs voyageurs à choisir leur prochain séjour.</p>
        <Button onClick={() => navigate('/')} className="mt-8 bg-[hsl(var(--primary))]">Découvrir d'autres séjours</Button>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-10">
      <h1 className="font-display text-3xl">Notez votre expérience</h1>
      {target.target_image && (
        <img src={target.target_image} alt={target.target_title} className="mt-5 rounded-2xl w-full aspect-video object-cover" />
      )}
      <p className="mt-4 text-lg font-semibold">{target.target_title}</p>

      <form onSubmit={submit} className="mt-6 space-y-5" data-testid="review-form">
        <div>
          <p className="text-sm font-medium mb-2">Votre note</p>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onMouseEnter={() => setHover(n)}
                onMouseLeave={() => setHover(0)}
                onClick={() => setRating(n)}
                aria-label={`${n} étoile${n > 1 ? 's' : ''}`}
                data-testid={`review-star-${n}`}
                className="p-1"
              >
                <Star className={`h-9 w-9 transition-colors ${(hover || rating) >= n ? 'fill-[hsl(var(--premium))] text-[hsl(var(--premium))]' : 'text-foreground/20'}`} />
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="comment" className="text-sm font-medium block mb-2">Votre commentaire</label>
          <Textarea
            id="comment"
            data-testid="review-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Qu'est-ce qui vous a marqué ? Que recommanderiez-vous aux prochains voyageurs ?"
            rows={5}
            required
            minLength={10}
          />
        </div>

        <Button type="submit" disabled={submitting} className="w-full h-12 rounded-xl bg-[hsl(var(--primary))]" data-testid="review-submit">
          {submitting ? 'Envoi…' : 'Publier mon avis'}
        </Button>
      </form>
    </div>
  );
};

export default ReviewFromTokenPage;
