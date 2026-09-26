// Filet pour handlers async (23/09) : Express 4 ne rattrape PAS les promesses rejetees -> une erreur dans un
// handler async (ZodError, Prisma, base indisponible) devenait un rejet non gere et ARRETAIT tout le processus
// API. `wrap` renvoie l'erreur au gestionnaire global de index.ts (400 ZodError / 500 sinon), l'API reste en vie.
import type { NextFunction, Request, RequestHandler, Response } from 'express';

export const wrap = (fn: (req: Request, res: Response) => Promise<unknown>): RequestHandler => (req, res, next: NextFunction) => {
  fn(req, res).catch(next);
};
