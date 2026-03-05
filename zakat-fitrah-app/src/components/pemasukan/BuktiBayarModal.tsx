import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, ExternalLink } from 'lucide-react';

interface BuktiBayarModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  attachmentUrl?: string | null;
}

function isPdfFile(url: string) {
  return /\.pdf(?:$|[?#])/i.test(url);
}

export function BuktiBayarModal({ open, onOpenChange, attachmentUrl }: BuktiBayarModalProps) {
  const isPdf = attachmentUrl ? isPdfFile(attachmentUrl) : false;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Bukti Bayar</DialogTitle>
          <DialogDescription>
            Preview lampiran bukti bayar yang sudah diupload.
          </DialogDescription>
        </DialogHeader>

        {attachmentUrl ? (
          isPdf ? (
            <div className="h-[70vh] rounded-md border bg-muted/20 p-2">
              <iframe
                src={attachmentUrl}
                title="Preview bukti bayar PDF"
                className="h-full w-full rounded-md"
              />
            </div>
          ) : (
            <div className="max-h-[70vh] overflow-auto rounded-md border bg-muted/20 p-2">
              <img
                src={attachmentUrl}
                alt="Lampiran bukti bayar"
                className="mx-auto h-auto max-h-[65vh] w-auto rounded-md object-contain"
              />
            </div>
          )
        ) : (
          <div className="rounded-md border p-4 text-sm text-muted-foreground">
            Bukti bayar belum tersedia untuk data ini.
          </div>
        )}

        <DialogFooter>
          {attachmentUrl && (
            <>
              <Button variant="outline" asChild>
                <a href={attachmentUrl} target="_blank" rel="noreferrer">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Buka di Tab Baru
                </a>
              </Button>
              <Button asChild>
                <a href={attachmentUrl} download target="_blank" rel="noreferrer">
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </a>
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
