import { supabase } from '@/lib/supabase';

export const PAYMENT_PROOF_BUCKET = 'bukti-bayar';
export const PAYMENT_PROOF_MAX_SIZE_BYTES = 1 * 1024 * 1024;

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function sanitizeFileName(fileName: string) {
  return fileName
    .toLowerCase()
    .replace(/[^a-z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function validatePaymentProofFile(file: File) {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return 'Format file harus JPG, PNG, atau WEBP';
  }

  if (file.size > PAYMENT_PROOF_MAX_SIZE_BYTES) {
    return 'Ukuran file maksimal 1 MB';
  }

  return null;
}

export async function uploadPaymentProofImage(input: {
  file: File;
  entity: 'pemasukan-uang' | 'pemasukan-beras';
  userId: string;
}) {
  const fileName = sanitizeFileName(input.file.name);
  const filePath = `${input.userId}/${input.entity}/${Date.now()}-${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from(PAYMENT_PROOF_BUCKET)
    .upload(filePath, input.file, {
      upsert: false,
      contentType: input.file.type,
    });

  if (uploadError) throw uploadError;

  const { data } = supabase.storage
    .from(PAYMENT_PROOF_BUCKET)
    .getPublicUrl(filePath);

  return {
    path: filePath,
    publicUrl: data.publicUrl,
  };
}
