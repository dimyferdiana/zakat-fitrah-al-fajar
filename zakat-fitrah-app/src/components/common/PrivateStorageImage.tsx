import { useEffect, useState, type ImgHTMLAttributes } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth';
import { privateStoragePath } from '@/lib/privateStorage';

export function PrivateStorageImage({ src, bucket = 'qurban-photos', alt, ...props }: Omit<ImgHTMLAttributes<HTMLImageElement>, 'src'> & { src: string; bucket?: string }) {
  const { session, user, customer } = useAuth();
  const [image, setImage] = useState<{ source: string; url: string } | null>(null);
  const preview = src.startsWith('blob:') || src.startsWith('data:image/');
  useEffect(() => {
    if (preview) return;
    const path = privateStoragePath(src, bucket);
    if (!path) return;
    let disposed = false; let objectUrl: string | undefined;
    void supabase.storage.from(bucket).download(path).then(({ data, error }) => {
      if (disposed || error || !data) return;
      objectUrl = URL.createObjectURL(data); setImage({ source: src, url: objectUrl });
    });
    return () => { disposed = true; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [src, bucket, preview, session?.user.id, user?.role, customer?.id]);
  const resolved = preview ? src : image?.source === src ? image.url : undefined;
  return resolved ? <img {...props} src={resolved} alt={alt} /> : <span className={props.className} role="img" aria-label={alt || 'Foto tidak tersedia'}>Foto tidak tersedia</span>;
}
