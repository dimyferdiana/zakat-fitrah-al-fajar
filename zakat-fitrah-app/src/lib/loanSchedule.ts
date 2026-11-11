export interface Installment {
  dueDate: string;
  amount: number;
}

function parseDate(value: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error('Tanggal tidak valid');
  const date = new Date(`${value}T00:00:00Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new Error('Tanggal tidak valid');
  }
  return date;
}

function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function makeSchedule(principal: number, count: number, firstDue: string, frequency: 'weekly' | 'monthly'): Installment[] {
  if (!Number.isSafeInteger(principal) || principal <= 0 || !Number.isSafeInteger(count) || count <= 0 || count > principal) {
    throw new Error('Nominal dan jumlah angsuran harus bilangan bulat positif');
  }
  const first = parseDate(firstDue);
  const base = Math.floor(principal / count);
  return Array.from({ length: count }, (_, index) => {
    let date: Date;
    if (frequency === 'weekly') {
      date = new Date(first.getTime() + index * 7 * 86400000);
    } else {
      const targetMonth = first.getUTCMonth() + index;
      const lastDay = new Date(Date.UTC(first.getUTCFullYear(), targetMonth + 1, 0)).getUTCDate();
      date = new Date(Date.UTC(first.getUTCFullYear(), targetMonth, Math.min(first.getUTCDate(), lastDay)));
    }
    return { dueDate: isoDate(date), amount: base + (index === count - 1 ? principal - base * count : 0) };
  });
}

export function validateSchedule(schedule: Installment[], principal: number, disbursementDate: string): void {
  parseDate(disbursementDate);
  if (!Number.isSafeInteger(principal) || principal <= 0 || schedule.length === 0) throw new Error('Jadwal atau pokok tidak valid');
  let previous = '';
  let total = 0;
  for (const installment of schedule) {
    parseDate(installment.dueDate);
    if (installment.dueDate < disbursementDate || installment.dueDate <= previous) throw new Error('Tanggal angsuran harus unik, berurutan, dan tidak sebelum pencairan');
    if (!Number.isSafeInteger(installment.amount) || installment.amount <= 0) throw new Error('Nominal angsuran harus positif');
    total += installment.amount;
    previous = installment.dueDate;
  }
  if (total !== principal) throw new Error('Jumlah angsuran harus sama dengan pokok');
}

/** Calendar days from the planned disbursement to the last installment. */
export function scheduleDurationDays(disbursementDate: string, schedule: Installment[]): number {
  if (schedule.length === 0) throw new Error('Jadwal belum tersedia');
  const start = parseDate(disbursementDate);
  const end = parseDate(schedule[schedule.length - 1].dueDate);
  const days = (end.getTime() - start.getTime()) / 86400000;
  if (days < 0) throw new Error('Jatuh tempo terakhir tidak boleh sebelum pencairan');
  return days;
}
