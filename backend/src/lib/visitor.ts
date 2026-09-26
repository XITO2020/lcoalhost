import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';
import { config } from '../config';

declare module 'express-serve-static-core' {
  interface Request {
    visitorId: string;
  }
}

const COOKIE = 'lh_vid';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** Visiteur anonyme : un UUID en cookie httpOnly. Pas de compte, pas de mot de passe, pas de donnee perso. */
export function visitor(req: Request, res: Response, next: NextFunction): void {
  const cur = req.cookies?.[COOKIE];
  if (typeof cur === 'string' && UUID.test(cur)) {
    req.visitorId = cur;
  } else {
    req.visitorId = randomUUID();
    res.cookie(COOKIE, req.visitorId, {
      httpOnly: true,
      sameSite: 'lax',
      secure: config.isProd,
      maxAge: 365 * 86400_000,
    });
  }
  next();
}
