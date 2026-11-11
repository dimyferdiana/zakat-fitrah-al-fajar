import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { SupabaseClient } from '@supabase/supabase-js';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface Template { id: string; version: number; title: string; body: string }
interface DraftData { loanNumber: string; name: string; purpose: string; principal: number; disbursementDate: string; guarantor: string; guarantorRelationship: string; guarantorContact: string; schedule: { date: string; amount: number }[] }
const client = supabase as unknown as SupabaseClient;
const money = (value: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);
const starter = `CONTOH DRAFT — pengurus wajib meninjau dan melengkapi redaksi, pihak, serta saksi.

Perjanjian nomor {{nomor_pinjaman}}, tanggal {{tanggal_pencairan}}.
Pihak pengurus: [isi nama dan jabatan].
Nasabah: {{nama}}. Penjamin jika ada: {{penjamin}} ({{hubungan_penjamin}}, {{kontak_penjamin}}).
Tujuan penggunaan: {{tujuan}}. Pokok pinjaman: {{pokok}}.
Pinjaman dikembalikan sebesar pokok tanpa bunga atau biaya. Jumlah angsuran: {{jumlah_angsuran}}.
Jadwal pengembalian:
{{jadwal}}

Cara pembayaran: [isi cara pembayaran yang disepakati].
Penanganan kendala pembayaran: [isi ketentuan yang ditetapkan pengurus].
Kontak pengurus: [isi kontak].

Tanda tangan pengurus: ____________________
Tanda tangan nasabah: _____________________
Tanda tangan penjamin atau saksi bila diperlukan: ____________________`;

export function LoanContractTemplate({ isAdmin, draft, selected, onSelect }: { isAdmin: boolean; draft: DraftData | null; selected: string; onSelect: (id: string) => void }) {
  const cache = useQueryClient();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState(starter);
  const templates = useQuery({ queryKey: ['loan-contract-templates'], queryFn: async () => {
    const { data, error } = await client.from('loan_contract_templates').select('id,version,title,body').order('version', { ascending: false });
    if (error) throw error;
    return (data ?? []) as Template[];
  } });
  const save = useMutation({ mutationFn: async () => {
    if (!title.trim() || !body.trim()) throw new Error('Judul dan teks template wajib diisi.');
    const { error } = await client.rpc('loan_create_contract_template', { p_title: title.trim(), p_body: body });
    if (error) throw error;
  }, onSuccess: () => { setTitle(''); setBody(''); void cache.invalidateQueries({ queryKey: ['loan-contract-templates'] }); toast.success('Versi template tersimpan.'); },
  onError: error => toast.error(error instanceof Error ? error.message : 'Template tidak dapat disimpan.') });
  const template = templates.data?.find(item => item.id === selected);
  async function preview() {
    if (!template || !draft || !draft.disbursementDate) { toast.error('Pilih template, draft pinjaman, dan tanggal pencairan.'); return; }
    const substitutions: Record<string, string> = {
      nama: draft.name, nomor_pinjaman: draft.loanNumber, tujuan: draft.purpose, pokok: money(draft.principal),
      tanggal_pencairan: draft.disbursementDate, jumlah_angsuran: String(draft.schedule.length),
      penjamin: draft.guarantor || '-', hubungan_penjamin: draft.guarantorRelationship || '-', kontak_penjamin: draft.guarantorContact || '-',
      jadwal: draft.schedule.map((item, index) => `${index + 1}. ${item.date}: ${money(item.amount)}`).join('\n'),
    };
    let rendered = template.body.replace(/\{\{\s*([a-z_]+)\s*\}\}/g, (match, key: string) => substitutions[key] ?? match);
    if (draft.guarantor) rendered += `\n\nData penjamin: ${draft.guarantor}\nHubungan: ${draft.guarantorRelationship}\nKontak: ${draft.guarantorContact}`;
    const { default: jsPDF } = await import('jspdf');
    const pdf = new jsPDF({ unit: 'mm', format: 'a4' });
    pdf.setFontSize(12); pdf.text(`DRAFT - ${template.title} (versi ${template.version})`, 15, 18);
    pdf.setFontSize(10);
    const lines = pdf.splitTextToSize(rendered, 180) as string[];
    let y = 28;
    for (const line of lines) { if (y > 280) { pdf.addPage(); y = 18; } pdf.text(line, 15, y); y += 5; }
    pdf.save(`draft-kontrak-${draft.loanNumber}.pdf`);
  }
  return <div className="space-y-3 rounded border p-4 text-sm"><h2 className="font-semibold">Template dan draft kontrak</h2>
    <p>Pengurus menentukan isi dan pihak penandatangan. Setiap penyimpanan membuat versi baru; draft PDF bukan kontrak bertanda tangan.</p>
    <p className="text-muted-foreground">Placeholder: {'{{nama}}, {{nomor_pinjaman}}, {{tujuan}}, {{pokok}}, {{tanggal_pencairan}}, {{jumlah_angsuran}}, {{jadwal}}, {{penjamin}}, {{hubungan_penjamin}}, {{kontak_penjamin}}'}.</p>
    {isAdmin && <div className="space-y-2"><Input aria-label="Judul template" placeholder="Judul template" value={title} onChange={event => setTitle(event.target.value)} /><Textarea aria-label="Teks template" placeholder="Isi kontrak yang disiapkan pengurus" rows={5} value={body} onChange={event => setBody(event.target.value)} /><Button variant="outline" disabled={save.isPending} onClick={() => save.mutate()}>Simpan versi baru</Button></div>}
    {templates.error && <p role="alert" className="text-destructive">Template tidak dapat dimuat.</p>}
    <label className="block">Versi template<select className="h-10 w-full rounded border bg-background px-3" value={selected} onChange={event => onSelect(event.target.value)}><option value="">Pilih template</option>{templates.data?.map(item => <option key={item.id} value={item.id}>Versi {item.version} · {item.title}</option>)}</select></label>
    {template && <pre className="max-h-48 overflow-auto whitespace-pre-wrap rounded bg-muted p-3 font-sans">{template.body}</pre>}
    <Button variant="outline" disabled={!draft || !template} onClick={() => void preview().catch(() => toast.error('Draft PDF tidak dapat dibuat.'))}>Unduh preview draft PDF</Button>
  </div>;
}
