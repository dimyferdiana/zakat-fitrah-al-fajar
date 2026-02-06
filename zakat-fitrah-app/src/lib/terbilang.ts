/**
 * Terbilang helper - converts numbers to Indonesian words
 * Useful for receipt documents where the amount needs to be written out in words
 */

const UNITS = [
  '',
  'satu',
  'dua',
  'tiga',
  'empat',
  'lima',
  'enam',
  'tujuh',
  'delapan',
  'sembilan',
];

const TEENS = [
  'sepuluh',
  'sebelas',
  'dua belas',
  'tiga belas',
  'empat belas',
  'lima belas',
  'enam belas',
  'tujuh belas',
  'delapan belas',
  'sembilan belas',
];

const TENS = [
  '',
  '',
  'dua puluh',
  'tiga puluh',
  'empat puluh',
  'lima puluh',
  'enam puluh',
  'tujuh puluh',
  'delapan puluh',
  'sembilan puluh',
];

const SCALE = [
  '',
  'ribu',
  'juta',
  'miliar',
  'triliun',
  'kuadriliun',
  'kuintiliun',
];

function convertGroup(num: number): string {
  if (num === 0) {
    return '';
  }

  const hundreds = Math.floor(num / 100);
  const remainder = num % 100;
  const tens = Math.floor(remainder / 10);
  const ones = remainder % 10;

  let result = '';

  if (hundreds > 0) {
    if (hundreds === 1) {
      result += 'seratus';
    } else {
      result += UNITS[hundreds] + ' ratus';
    }
  }

  if (remainder >= 10 && remainder < 20) {
    if (result) result += ' ';
    result += TEENS[remainder - 10];
  } else {
    if (tens > 0) {
      if (result) result += ' ';
      result += TENS[tens];
    }

    if (ones > 0) {
      if (result) result += ' ';
      if (ones === 1 && (tens > 0 || hundreds > 0)) {
        result += 'satu';
      } else {
        result += UNITS[ones];
      }
    }
  }

  return result;
}

export function numberToTerbilang(num: number): string {
  if (num === 0) {
    return 'nol';
  }

  if (num < 0) {
    return 'minus ' + numberToTerbilang(Math.abs(num));
  }

  const isDecimal = num % 1 !== 0;
  if (isDecimal) {
    num = Math.floor(num);
  }

  if (num < 1000) {
    return convertGroup(num);
  }

  const groups: number[] = [];
  let n = num;

  while (n > 0) {
    groups.push(n % 1000);
    n = Math.floor(n / 1000);
  }

  let result = '';

  for (let i = groups.length - 1; i >= 0; i--) {
    if (groups[i] > 0) {
      const groupText = convertGroup(groups[i]);
      const scaleText = SCALE[i];

      if (i === 1 && groups[i] === 1) {
        result += 'seribu';
      } else {
        if (result) result += ' ';
        result += groupText;
        if (scaleText) result += ' ' + scaleText;
      }
    }
  }

  return result
    .trim()
    .split(/\s+/)
    .join(' ')
    .toLowerCase();
}

/**
 * Format number as Rupiah currency
 */
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Generate terbilang text from amount with "Rp" prefix
 */
export function getTerbilangText(amount: number): string {
  const words = numberToTerbilang(amount);
  return words.charAt(0).toUpperCase() + words.slice(1) + ' rupiah';
}
