import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Plus } from 'lucide-react'
import { QurbanTable } from '@/components/qurban/QurbanTable'
import { QurbanForm } from '@/components/qurban/QurbanForm'
import type { QurbanRegistrationWithParticipants } from '@/types/qurban'

export default function Qurban() {
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editData, setEditData] = useState<QurbanRegistrationWithParticipants | null>(null)

  const handleAdd = () => {
    setEditData(null)
    setDialogOpen(true)
  }

  const handleEdit = (data: QurbanRegistrationWithParticipants) => {
    setEditData(data)
    setDialogOpen(true)
  }

  const handleDownloadPdf = (_data: QurbanRegistrationWithParticipants) => {
    // PDF download will be implemented in Task 5.0
  }

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open)
    if (!open) {
      setEditData(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Data Qurban</h1>
          <p className="text-muted-foreground text-sm">
            Kelola pendaftaran dan data peserta qurban.
          </p>
        </div>
        <Button onClick={handleAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Tambah Pendaftaran
        </Button>
      </div>

      {/* Table */}
      <QurbanTable onEdit={handleEdit} onDownloadPdf={handleDownloadPdf} />

      {/* Form Dialog */}
      <QurbanForm
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        initialData={editData}
      />
    </div>
  )
}
