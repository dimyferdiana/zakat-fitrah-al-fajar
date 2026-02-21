import { useEffect } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const percentageField = z
  .number({ message: 'Persentase harus berupa angka' })
  .min(0, 'Persentase minimal 0')
  .max(100, 'Persentase maksimal 100');

const hakAmilConfigSchema = z.object({
  tahun_zakat_id: z.string().min(1, 'Tahun zakat wajib dipilih'),
  basis_mode: z.enum(['net_after_reconciliation', 'gross_before_reconciliation']),
  zakat_fitrah_pct: percentageField,
  zakat_maal_pct: percentageField,
  infak_pct: percentageField,
  fidyah_pct: percentageField,
  beras_pct: percentageField,
});

type HakAmilConfigFormValues = z.infer<typeof hakAmilConfigSchema>;

type BasisMode = HakAmilConfigFormValues['basis_mode'];

interface TahunZakatOption {
  id: string;
  label: string;
}

interface HakAmilConfigFormProps {
  tahunOptions: TahunZakatOption[];
  onSubmit: (values: HakAmilConfigFormValues) => void;
  isSubmitting?: boolean;
  initialValues?: Partial<HakAmilConfigFormValues>;
  submitLabel?: string;
}

const DEFAULT_FORM_VALUES: HakAmilConfigFormValues = {
  tahun_zakat_id: '',
  basis_mode: 'net_after_reconciliation',
  zakat_fitrah_pct: 12.5,
  zakat_maal_pct: 12.5,
  infak_pct: 20,
  fidyah_pct: 0,
  beras_pct: 0,
};

function getBasisLabel(mode: BasisMode) {
  if (mode === 'gross_before_reconciliation') {
    return 'Bruto sebelum rekonsiliasi';
  }
  return 'Neto setelah rekonsiliasi (default PRD)';
}

export function HakAmilConfigForm({
  tahunOptions,
  onSubmit,
  isSubmitting = false,
  initialValues,
  submitLabel = 'Simpan Konfigurasi',
}: HakAmilConfigFormProps) {
  const form = useForm<HakAmilConfigFormValues>({
    resolver: zodResolver(hakAmilConfigSchema),
    defaultValues: {
      ...DEFAULT_FORM_VALUES,
      ...initialValues,
    },
  });

  useEffect(() => {
    if (!initialValues) return;

    form.reset({
      ...DEFAULT_FORM_VALUES,
      ...initialValues,
    });
  }, [form, initialValues]);

  const basisMode = useWatch({
    control: form.control,
    name: 'basis_mode',
  });

  const handlePercentInput = (
    value: string,
    onChange: (value: number) => void,
  ) => {
    const parsed = Number(value);
    onChange(Number.isNaN(parsed) ? 0 : parsed);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
        <FormField
          control={form.control}
          name="tahun_zakat_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tahun Zakat *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih tahun zakat" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {tahunOptions.map((tahun) => (
                    <SelectItem key={tahun.id} value={tahun.id}>
                      {tahun.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="basis_mode"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Basis Perhitungan *</FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih basis" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="net_after_reconciliation">
                    Neto setelah rekonsiliasi
                  </SelectItem>
                  <SelectItem value="gross_before_reconciliation">
                    Bruto sebelum rekonsiliasi
                  </SelectItem>
                </SelectContent>
              </Select>
              <FormDescription>{getBasisLabel(basisMode)}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="zakat_fitrah_pct"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Zakat Fitrah (%)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.1"
                    min={0}
                    max={100}
                    {...field}
                    value={field.value}
                    onChange={(event) => handlePercentInput(event.target.value, field.onChange)}
                  />
                </FormControl>
                <FormDescription>Default PRD: 12.5%</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="zakat_maal_pct"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Zakat Maal (%)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.1"
                    min={0}
                    max={100}
                    {...field}
                    value={field.value}
                    onChange={(event) => handlePercentInput(event.target.value, field.onChange)}
                  />
                </FormControl>
                <FormDescription>Default PRD: 12.5%</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="infak_pct"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Infak (%)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.1"
                    min={0}
                    max={100}
                    {...field}
                    value={field.value}
                    onChange={(event) => handlePercentInput(event.target.value, field.onChange)}
                  />
                </FormControl>
                <FormDescription>Default PRD: 20%</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="fidyah_pct"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Fidyah (%)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.1"
                    min={0}
                    max={100}
                    {...field}
                    value={field.value}
                    onChange={(event) => handlePercentInput(event.target.value, field.onChange)}
                  />
                </FormControl>
                <FormDescription>Default PRD: 0% (tidak diambil)</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="beras_pct"
            render={({ field }) => (
              <FormItem className="md:col-span-2">
                <FormLabel>Beras (%)</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.1"
                    min={0}
                    max={100}
                    {...field}
                    value={field.value}
                    onChange={(event) => handlePercentInput(event.target.value, field.onChange)}
                  />
                </FormControl>
                <FormDescription>Default PRD: 0% (tidak diambil)</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex items-center justify-end gap-2">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Menyimpan...' : submitLabel}
          </Button>
        </div>
      </form>
    </Form>
  );
}
