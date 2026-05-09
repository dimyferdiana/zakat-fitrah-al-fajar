import { useState, useRef } from 'react'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import { Upload, CheckCircle } from 'lucide-react'
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { supabase } from '@/lib/supabase'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'

interface ParsedRow {
  nama_kk: string
  alamat: string
  no_telp?: string
  error?: string
}

interface WargaImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

function validateRow(raw: Record<string, string>): ParsedRow {
  const nama_kk = (raw['nama_kk'] || raw['Nama KK'] || raw['nama'] || '').trim()
  const alamat = (raw['alamat'] || raw['Alamat'] || '').trim()
  const no_telp = (raw['no_telp'] || raw['No Telp'] || raw['no_hp'] || '').trim() || undefined

  if (!nama_kk) return { nama_kk, alamat, no_telp, error: 'Nama KK wajib diisi' }
  if (!alamat) return { nama_kk, alamat, no_telp, error: 'Alamat wajib diisi' }
  return { nama_kk, alamat, no_telp }
}

export function WargaImportDialog({ open, onOpenChange }: WargaImportDialogProps) {
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [step, setStep] = useState<'upload' | 'preview' | 'done'>('upload')
  const [importResult, setImportResult] = useState<{ success: number; failed: number } | null>(null)
  const [isImporting, setIsImporting] = useState(false)

  const validRows = rows.filter((r) => !r.error)
  const invalidRows = rows.filter((r) => !!r.error)

  const handleFile = (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase()
    if (ext === 'csv') {
      Papa.parse<Record<string, string>>(file, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => {
          const parsed = result.data.map(validateRow)
          setRows(parsed)
          setStep('preview')
        },
      })
    } else if (ext === 'xlsx' || ext === 'xls') {
      const reader = new FileReader()
      reader.onload = (e) => {
        const data = new Uint8Array(e.target!.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const sheet = workbook.Sheets[workbook.SheetNames[0]]
        const jsonData = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: '' })
        const parsed = jsonData.map(validateRow)
        setRows(parsed)
        setStep('preview')
      }
      reader.readAsArrayBuffer(file)
    } else {
      toast.error('Format file tidak didukung. Gunakan .csv atau .xlsx')
    }
  }

  const handleImport = async () => {
    setIsImporting(true)
    const toInsert = validRows.map((r) => ({
      nama_kk: r.nama_kk,
      alamat: r.alamat,
      no_telp: r.no_telp || null,
    }))

    const { error } = await supabase.from('muzakki').insert(toInsert as any)
    setIsImporting(false)

    if (error) {
      toast.error(`Import gagal: ${error.message}`)
      return
    }

    await queryClient.invalidateQueries({ queryKey: ['muzakki-list'] })
    setImportResult({ success: validRows.length, failed: invalidRows.length })
    setStep('done')
    toast.success(`${validRows.length} warga berhasil diimport`)
  }

  const handleClose = () => {
    setRows([])
    setStep('upload')
    setImportResult(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import Warga dari CSV/Excel</DialogTitle>
        </DialogHeader>

        {step === 'upload' && (
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Upload file CSV atau Excel dengan kolom: <code className="bg-muted px-1 rounded">nama_kk</code>, <code className="bg-muted px-1 rounded">alamat</code>, <code className="bg-muted px-1 rounded">no_telp</code> (opsional)
            </p>
            <div
              className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-muted/40 transition-colors"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
            >
              <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-2" />
              <p className="text-sm">Klik atau drag & drop file di sini</p>
              <p className="text-xs text-muted-foreground mt-1">.csv atau .xlsx</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
            />
          </div>
        )}

        {step === 'preview' && (
          <div className="space-y-4">
            <p className="text-sm">
              <span className="font-medium text-green-600">{validRows.length} baris valid</span>
              {invalidRows.length > 0 && (
                <span className="font-medium text-destructive ml-2">, {invalidRows.length} baris gagal</span>
              )}
            </p>
            <div className="max-h-64 overflow-y-auto border rounded">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8">#</TableHead>
                    <TableHead>Nama KK</TableHead>
                    <TableHead>Alamat</TableHead>
                    <TableHead>No. Telp</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row, i) => (
                    <TableRow key={i} className={row.error ? 'bg-destructive/5' : ''}>
                      <TableCell className="text-xs">{i + 1}</TableCell>
                      <TableCell className="text-xs">{row.nama_kk || '-'}</TableCell>
                      <TableCell className="text-xs">{row.alamat || '-'}</TableCell>
                      <TableCell className="text-xs">{row.no_telp || '-'}</TableCell>
                      <TableCell>
                        {row.error
                          ? <Badge variant="destructive" className="text-xs">{row.error}</Badge>
                          : <Badge variant="default" className="text-xs bg-green-600">Valid</Badge>
                        }
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setStep('upload')}>Kembali</Button>
              <Button onClick={handleImport} disabled={validRows.length === 0 || isImporting}>
                {isImporting ? 'Mengimport...' : `Import ${validRows.length} Baris`}
              </Button>
            </DialogFooter>
          </div>
        )}

        {step === 'done' && importResult && (
          <div className="space-y-4 py-4 text-center">
            <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
            <p className="font-medium">Import Selesai</p>
            <p className="text-sm text-muted-foreground">
              {importResult.success} baris berhasil diimport
              {importResult.failed > 0 && `, ${importResult.failed} baris dilewati`}
            </p>
            <DialogFooter className="justify-center">
              <Button onClick={handleClose}>Tutup</Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
