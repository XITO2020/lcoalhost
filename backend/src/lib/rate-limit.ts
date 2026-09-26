import type { NextFunction, Request, Response } from 'express';

const hits = new Map<string, number[]>();

setInterval(() => {
  const now = Date.now();
  for (const [k, v] of hits) if (!v.some((t) => now - t < 3600_000)) hits.delete(k);
}, 600_000).unref();

/** Fenetre glissante en memoire, par IP + nom de groupe. Suffisant pour un petit site derriere un seul nginx. */
export function limit(name: string, max: number, windowMs: number) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const key = `${name}:${req.ip}`;
    const now = Date.now();
    const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
    if (recent.length >= max) {
      res.status(429).json({ error: 'trop_de_requetes', message: 'Doucement : le convoyeur a besoin de souffler.' });
      return;
    }
    recent.push(now);
    hits.set(key, recent);
    next();
  };
}
