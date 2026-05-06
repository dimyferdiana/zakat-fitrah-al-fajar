import { useRef, useState } from 'react'
import { Camera, Trash2, Loader2, ImageOff } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { useQueryClient } from '@tanstack/react-query'

interface PhotoUploadProps {
  registrationId: string
  currentPhotoUrl?: string | null
  onUploadComplete?: (url: string) => void
}

export function PhotoUpload({ registrationId, currentPhotoUrl, onUploadComplete }: PhotoUploadProps) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(currentPhotoUrl ?? null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('File harus berupa gambar (JPEG, PNG, WebP, atau GIF)')
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Ukuran file maksimal 5MB')
      return
    }

    setIsUploading(true)

    try {
      const ext = file.name.split('.').pop() || 'jpg'
      const filePath = `${registrationId}/${Date.now()}.${ext}`

      const { error: uploadError } = await supabase.storage
        .from('qurban-photos')
        .upload(filePath, file, { upsert: true })

      if (uploadError) throw uploadError

      const { data: publicUrlData } = supabase.storage
        .from('qurban-photos')
        .getPublicUrl(filePath)

      const publicUrl = publicUrlData.publicUrl

      // Save photo_url to the registration record
      const { error: updateError } = await supabase
        .from('qurban_registrations')
        .update({ photo_url: publicUrl, updated_at: new Date().toISOString() })
        .eq('id', registrationId)

      if (updateError) throw updateError

      setPhotoUrl(publicUrl)
      onUploadComplete?.(publicUrl)
      queryClient.invalidateQueries({ queryKey: ['qurban'] })
      toast.success('Foto berhasil diunggah')
    } catch (err) {
      toast.error(`Gagal mengunggah foto: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setIsUploading(false)
      // Reset input so the same file can be re-selected if needed
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleRemovePhoto = async () => {
    try {
      const { error } = await supabase
        .from('qurban_registrations')
        .update({ photo_url: null, updated_at: new Date().toISOString() })
        .eq('id', registrationId)

      if (error) throw error

      setPhotoUrl(null)
      queryClient.invalidateQueries({ queryKey: ['qurban'] })
      toast.success('Foto berhasil dihapus')
    } catch (err) {
      toast.error(`Gagal menghapus foto: ${err instanceof Error ? err.message : 'Unknown error'}`)
    }
  }

  return (
    <div className="space-y-3">
      {/* Thumbnail preview */}
      <div className="flex items-start gap-3">
        <div className="h-24 w-24 shrink-0 rounded-md border bg-muted overflow-hidden flex items-center justify-center">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt="Foto hewan qurban"
              className="h-full w-full object-cover"
            />
          ) : (
            <ImageOff className="h-8 w-8 text-muted-foreground" />
          )}
        </div>

        <div className="flex flex-col gap-2">
          {/* Upload button */}
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isUploading}
            onClick={() => fileInputRef.current?.click()}
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Mengunggah...
              </>
            ) : (
              <>
                <Camera className="h-4 w-4 mr-2" />
                {photoUrl ? 'Ganti Foto' : 'Upload Foto'}
              </>
            )}
          </Button>

          {/* Remove button — only shown when photo exists */}
          {photoUrl && !isUploading && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleRemovePhoto}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Hapus Foto
            </Button>
          )}

          <p className="text-xs text-muted-foreground">
            JPEG, PNG, WebP, GIF — maks. 5MB
          </p>
        </div>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />
    </div>
  )
}
