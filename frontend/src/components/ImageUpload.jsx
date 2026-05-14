import React, { useState, useRef } from 'react';
import { api, BACKEND_URL } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Upload, X, Loader2, ImagePlus } from 'lucide-react';
import { toast } from 'sonner';

export const resolveImage = (url) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  if (url.startsWith('/api/')) return `${BACKEND_URL}${url}`;
  return url;
};

export const ImageUpload = ({ value, onChange, multiple = false }) => {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState('');

  const handleFiles = async (files) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      const uploaded = [];
      for (const f of files) {
        const form = new FormData();
        form.append('file', f);
        const { data } = await api.post('/admin/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } });
        uploaded.push(data.url);
      }
      if (multiple) {
        const current = Array.isArray(value) ? value : [];
        onChange([...current, ...uploaded]);
      } else {
        onChange(uploaded[0]);
      }
      toast.success(`${uploaded.length} image${uploaded.length > 1 ? 's' : ''} téléversée${uploaded.length > 1 ? 's' : ''}`);
    } catch (e) {
      toast.error(e?.response?.data?.detail || 'Erreur upload');
    } finally { setUploading(false); }
  };

  const addByUrl = () => {
    if (!urlInput) return;
    if (multiple) onChange([...(Array.isArray(value) ? value : []), urlInput]);
    else onChange(urlInput);
    setUrlInput('');
  };

  const removeAt = (i) => {
    if (multiple) onChange(value.filter((_, idx) => idx !== i));
    else onChange('');
  };

  const images = multiple ? (Array.isArray(value) ? value : []) : (value ? [value] : []);

  return (
    <div className="space-y-3" data-testid="image-upload">
      <div className="flex items-center gap-2 flex-wrap">
        <input ref={inputRef} type="file" multiple={multiple} accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={(e) => handleFiles(Array.from(e.target.files || []))} data-testid="image-upload-input" />
        <Button type="button" variant="outline" onClick={() => inputRef.current?.click()} disabled={uploading} data-testid="image-upload-button" className="rounded-xl">
          {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
          {multiple ? 'Téléverser des images' : 'Téléverser une image'}
        </Button>
        <div className="text-xs text-muted-foreground">ou</div>
        <input value={urlInput} onChange={(e) => setUrlInput(e.target.value)} placeholder="Coller une URL d'image" className="flex-1 min-w-[200px] px-3 py-2 rounded-xl border border-border text-sm" data-testid="image-url-input" />
        <Button type="button" variant="ghost" onClick={addByUrl} disabled={!urlInput} className="rounded-xl"><ImagePlus className="h-4 w-4" /></Button>
      </div>
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {images.map((url, i) => (
            <div key={`${url}-${i}`} className="relative group">
              <img src={resolveImage(url)} alt="" className="w-full h-24 object-cover rounded-lg border border-border" />
              <button type="button" onClick={() => removeAt(i)} className="absolute -top-2 -right-2 bg-white border border-border rounded-full p-0.5 shadow opacity-0 group-hover:opacity-100 transition-opacity" data-testid={`image-remove-${i}`}><X className="h-3.5 w-3.5" /></button>
            </div>
          ))}
        </div>
      )}
      {!images.length && !uploading && <p className="text-xs text-muted-foreground">Aucune image. Formats: JPG, PNG, WebP, GIF — max 10 Mo.</p>}
    </div>
  );
};
