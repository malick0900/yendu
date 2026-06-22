import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Share2, Link2, Mail, MessageCircle, Facebook, Twitter } from 'lucide-react';
import { toast } from 'sonner';
import { resolveImage } from '@/components/ImageUpload';

/**
 * Airbnb-style "Partager" button + modal. Reusable on any listing page.
 * Props: { url, title, subtitle, image, className }
 */
export const ShareButton = ({ url, title = '', subtitle = '', image, className }) => {
  const [open, setOpen] = useState(false);
  const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
  const enc = encodeURIComponent(shareUrl);
  const encTitle = encodeURIComponent(title);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Lien copié');
    } catch {
      toast.error('Impossible de copier le lien');
    }
    setOpen(false);
  };

  const options = [
    { label: 'Copier le lien', icon: Link2, onClick: copyLink },
    { label: 'E-mail', icon: Mail, href: `mailto:?subject=${encTitle}&body=${enc}` },
    { label: 'WhatsApp', icon: MessageCircle, href: `https://wa.me/?text=${encodeURIComponent((title ? title + ' — ' : '') + shareUrl)}` },
    { label: 'Facebook', icon: Facebook, href: `https://www.facebook.com/sharer/sharer.php?u=${enc}` },
    { label: 'X (Twitter)', icon: Twitter, href: `https://twitter.com/intent/tweet?url=${enc}&text=${encTitle}` },
  ];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          data-testid="share-button"
          className={className || 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border bg-white hover:bg-muted text-sm'}
        >
          <Share2 className="h-4 w-4" /> Partager
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Partager cette annonce</DialogTitle>
        </DialogHeader>
        {(image || title) && (
          <div className="flex items-center gap-3 pb-1">
            {image && <img src={resolveImage(image)} alt="" className="h-14 w-14 rounded-xl object-cover border border-border" />}
            <div className="min-w-0 text-sm">
              <p className="font-semibold line-clamp-1">{title}</p>
              {subtitle && <p className="text-muted-foreground line-clamp-1">{subtitle}</p>}
            </div>
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {options.map((o) => {
            const Icon = o.icon;
            const cls = 'flex items-center gap-3 rounded-xl border border-border px-4 py-3 text-sm font-medium hover:bg-muted text-left';
            return o.href ? (
              <a key={o.label} href={o.href} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)} className={cls} data-testid={`share-${o.label}`}>
                <Icon className="h-5 w-5" /> {o.label}
              </a>
            ) : (
              <button key={o.label} type="button" onClick={o.onClick} className={cls} data-testid={`share-${o.label}`}>
                <Icon className="h-5 w-5" /> {o.label}
              </button>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareButton;
