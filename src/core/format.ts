export function formatCompactInr(value: number | undefined): string {
  const safe = Number(value ?? 0);
  const abs = Math.abs(safe);
  if (abs >= 10000000) return `₹${(safe / 10000000).toFixed(2)} Cr`;
  if (abs >= 100000) return `₹${(safe / 100000).toFixed(1)} Lakh`;
  if (abs >= 1000) return `₹${(safe / 1000).toFixed(1)}K`;
  return `₹${Math.round(safe).toLocaleString('en-IN')}`;
}

export function formatLakhs(value: number | undefined): string {
  const safe = Number(value ?? 0) / 100000;
  return `₹${safe.toFixed(1)} Lakh`;
}

export function formatCrore(value: number | undefined): string {
  const safe = Number(value ?? 0) / 10000000;
  return `₹${safe.toFixed(2)} Cr`;
}

export function formatCompactNumber(value: number | undefined): string {
  const safe = Number(value ?? 0);
  const abs = Math.abs(safe);
  if (abs >= 10000000) return `${(safe / 10000000).toFixed(2)}Cr`;
  if (abs >= 100000) return `${(safe / 100000).toFixed(1)}L`;
  if (abs >= 1000) return `${(safe / 1000).toFixed(1)}K`;
  return `${Math.round(safe)}`;
}

export function formatMonths(value: number | undefined): string {
  const safe = Number(value ?? 0);
  return `${safe.toFixed(1)} months`;
}

export function formatRatio(value: number | undefined): string {
  return `${Number(value ?? 0).toFixed(2)}x`;
}

export function formatDate(iso: string | undefined): string {
  if (!iso) return '—';
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return '—';
  return parsed.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatDateTime(iso: string | undefined): string {
  if (!iso) return '—';
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return '—';
  return `${formatDate(iso)} ${parsed.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
}
