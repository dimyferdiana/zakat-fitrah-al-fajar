import { Button } from '@/components/ui/button'
import { Download, Printer } from 'lucide-react'
import type { QurbanRegistrationWithParticipants } from '@/types/qurban'
import { downloadQurbanReceipt, printQurbanReceipt } from './qurbanReceipt'

interface BuktiQurbanProps {
  data: QurbanRegistrationWithParticipants
}

export function BuktiQurban({ data }: BuktiQurbanProps) {
  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => downloadQurbanReceipt(data)}
      >
        <Download className="mr-2 h-4 w-4" />
        Download PDF
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={() => printQurbanReceipt(data)}
      >
        <Printer className="mr-2 h-4 w-4" />
        Cetak
      </Button>
    </div>
  )
}
