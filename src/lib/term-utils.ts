export function normalizeTermName(name: string): string {
  const n = (name || '').trim().toLowerCase();
  if (n === 'first term' || n === '1st term' || n === 'first' || n === '1st') return '1st Term';
  if (n === 'second term' || n === '2nd term' || n === 'second' || n === '2nd') return '2nd Term';
  if (n === 'third term' || n === '3rd term' || n === 'third' || n === '3rd') return '3rd Term';
  return name;
}


