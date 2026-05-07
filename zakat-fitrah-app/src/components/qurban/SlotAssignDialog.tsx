import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { X } from 'lucide-react'
import type { QurbanAnimal } from '@/types/qurban'
import {
  useAssignQurbanShare,
  useMuzakkiSearch,
  type MuzakkiMaster,
} from '@/hooks/useQurbanShares'
import { createMuzakkiRecord } from '@/hooks/useMuzakki'

export interface SlotAssignDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  animal: QurbanAnimal
  urutan: number
  suggestedNominal: number
}

export function SlotAssignDialog({
  open,
  onOpenChange,
  animal,
  urutan,
  suggestedNominal,
}: SlotAssignDialogProps) {
  const [activeTab, setActiveTab] = useState<'pilih' | 'baru'>('pilih')

  // Tab 1: search existing
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMuzakki, setSelectedMuzakki] = useState<MuzakkiMaster | null>(null)

  // Tab 2: new muzakki
  const [namaKk, setNamaKk] = useState('')
  const [alamat, setAlamat] = useState('')
  const [noHp, setNoHp] = useState('')
  const [namaError, setNamaError] = useState('')
  const [alamatError, setAlamatError] = useState('')

  // Shared
  const [nominal, setNominal] = useState(suggestedNominal)
  const [catatan, setCatatan] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const assignShare = useAssignQurbanShare()

  const { data: searchResults = [], isLoading: isSearching } = useMuzakkiSearch(
    searchQuery.length >= 2 ? searchQuery : ''
  )

  const resetForm = () => {
    setActiveTab('pilih')
    setSearchQuery('')
    setSelectedMuzakki(null)
    setNamaKk('')
    setAlamat('')
    setNoHp('')
    setNamaError('')
    setAlamatError('')
    setNominal(suggestedNominal)
    setCatatan('')
    setIsSubmitting(false)
  }

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) resetForm()
    onOpenChange(nextOpen)
  }

  const handleSimpan = async () => {
    setIsSubmitting(true)
    try {
      let muzakkiId: string

      if (activeTab === 'pilih') {
        if (!selectedMuzakki) {
          setIsSubmitting(false)
          return
        }
        muzakkiId = selectedMuzakki.id
      } else {
        // Validate new muzakki form
        let hasError = false
        if (!namaKk.trim()) {
          setNamaError('Nama wajib diisi')
          hasError = true
        } else {
          setNamaError('')
        }
        if (!alamat.trim()) {
          setAlamatError('Alamat wajib diisi')
          hasError = true
        } else {
          setAlamatError('')
        }
        if (hasError) {
          setIsSubmitting(false)
          return
        }
        const created = await createMuzakkiRecord({
          nama_kk: namaKk.trim(),
          alamat: alamat.trim(),
          no_telp: noHp.trim() || undefined,
        })
        muzakkiId = created.id
      }

      await assignShare.mutateAsync({
        animal_id: animal.id,
        muzakki_id: muzakkiId,
        urutan,
        nominal,
        catatan: catatan.trim() || undefined,
      })

      handleOpenChange(false)
    } catch (err) {
      console.error('SlotAssignDialog: failed to assign share', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const canSubmit =
    !isSubmitting &&
    (activeTab === 'pilih' ? !!selectedMuzakki : namaKk.trim().length > 0 && alamat.trim().length > 0)

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Tambah Peserta — Slot {urutan} ({animal.nomor})
          </DialogTitle>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as 'pilih' | 'baru')}
          className="mt-2"
        >
          <TabsList className="w-full">
            <TabsTrigger value="pilih" className="flex-1">
              Pilih dari data
            </TabsTrigger>
            <TabsTrigger value="baru" className="flex-1">
              Peserta Baru
            </TabsTrigger>
          </TabsList>

          {/* Tab 1: search existing muzakki */}
          <TabsContent value="pilih" className="space-y-3 mt-3">
            {selectedMuzakki ? (
              <div className="flex items-center justify-between rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm">
                <div>
                  <p className="font-medium text-green-800">{selectedMuzakki.nama_kk}</p>
                  {selectedMuzakki.no_telp && (
                    <p className="text-green-600 text-xs">{selectedMuzakki.no_telp}</p>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 text-green-600 hover:text-destructive"
                  onClick={() => {
                    setSelectedMuzakki(null)
                    setSearchQuery('')
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="search-muzakki">Cari nama / no HP</Label>
                <Input
                  id="search-muzakki"
                  placeholder="Minimal 2 karakter..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery.length >= 2 && (
                  <div className="rounded-md border divide-y max-h-48 overflow-y-auto">
                    {isSearching ? (
                      <p className="px-3 py-2 text-sm text-muted-foreground">Mencari...</p>
                    ) : searchResults.length === 0 ? (
                      <p className="px-3 py-2 text-sm text-muted-foreground">
                        Tidak ditemukan. Gunakan tab &quot;Peserta Baru&quot;.
                      </p>
                    ) : (
                      searchResults.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          className="w-full text-left px-3 py-2 hover:bg-muted transition-colors"
                          onClick={() => {
                            setSelectedMuzakki(m)
                            setSearchQuery('')
                          }}
                        >
                          <p className="text-sm font-medium">{m.nama_kk}</p>
                          {m.no_telp && (
                            <p className="text-xs text-muted-foreground">{m.no_telp}</p>
                          )}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* Tab 2: new muzakki form */}
          <TabsContent value="baru" className="space-y-3 mt-3">
            <div className="space-y-1">
              <Label htmlFor="nama-kk">
                Nama <span className="text-destructive">*</span>
              </Label>
              <Input
                id="nama-kk"
                placeholder="Nama lengkap"
                value={namaKk}
                onChange={(e) => {
                  setNamaKk(e.target.value)
                  if (namaError) setNamaError('')
                }}
              />
              {namaError && (
                <p className="text-xs text-destructive">{namaError}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="alamat">
                Alamat <span className="text-destructive">*</span>
              </Label>
              <Input
                id="alamat"
                placeholder="Alamat lengkap"
                value={alamat}
                onChange={(e) => {
                  setAlamat(e.target.value)
                  if (alamatError) setAlamatError('')
                }}
              />
              {alamatError && (
                <p className="text-xs text-destructive">{alamatError}</p>
              )}
            </div>
            <div className="space-y-1">
              <Label htmlFor="no-hp">
                No HP{' '}
                <span className="text-muted-foreground font-normal">(opsional)</span>
              </Label>
              <Input
                id="no-hp"
                type="tel"
                placeholder="08123456789"
                value={noHp}
                onChange={(e) => setNoHp(e.target.value)}
              />
            </div>
          </TabsContent>
        </Tabs>

        {/* Shared section */}
        <div className="space-y-3 mt-2 border-t pt-3">
          <div className="space-y-1">
            <Label htmlFor="nominal">
              Nominal (Rp) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="nominal"
              type="number"
              min={0}
              placeholder="0"
              value={nominal}
              onChange={(e) => setNominal(Number(e.target.value))}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="catatan">
              Catatan{' '}
              <span className="text-muted-foreground font-normal">(opsional)</span>
            </Label>
            <Input
              id="catatan"
              placeholder="Catatan tambahan"
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter className="mt-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isSubmitting}
          >
            Batal
          </Button>
          <Button
            type="button"
            disabled={!canSubmit}
            onClick={handleSimpan}
          >
            {isSubmitting ? 'Menyimpan...' : 'Simpan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
