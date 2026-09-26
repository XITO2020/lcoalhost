/**
 * Une licence est "permissive" ici si elle autorise la copie ET l'usage commercial (le site est monetise).
 * Tout ce qui contient NC (non commercial) est refuse, "Unknown" aussi : dans le doute, on ne copie pas.
 * ND (pas de derives) reste accepte : on copie a l'identique, sans modifier.
 */
export function isPermissiveLicense(label?: string | null): boolean {
  if (!label) return false;
  const l = label.toLowerCase();
  if (l.includes('non commercial') || l.includes('noncommercial') || /(^|[\s-])nc([\s-]|$)/.test(l)) return false;
  if (l.includes('public domain') || l.includes('cc0')) return true;
  if (l.startsWith('attribution') || /cc[\s-]?by/.test(l)) return true;
  return false;
}
