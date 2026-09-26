// Demande de devis pub (Naim 24/09) : formulaire du 1er encart "your ad here" de l'aside gauche. SECURISE :
//  - texte SIMPLE uniquement (charset restreint : lettres, chiffres, espace, retour ligne, @ . , : ! ?) -> aucune
//    injection possible (HTML/script, entetes email, chemins, trojans reposent tous sur des caracteres exclus) ;
//  - 1 demande / IP / 24h (rate-limit en memoire, comme le reste du site : AUCUNE IP en base) ;
//  - handler async passe par wrap (Express 4 n'attrape pas les rejets async).
// La demande est stockee (QuoteRequest) et, si EMAIL_SERVER_HOST est configure, envoyee a tabascocity@proton.me
// via SMTP nodemailer (comme TabascoCity, memes noms de variables EMAIL_SERVER_*).
import { Router } from 'express';
import { z } from 'zod';
import { config } from '../config';
import { prisma } from '../lib/prisma';
import { limit } from '../lib/rate-limit';
import { wrap } from '../lib/wrap';

export const quoteRouter = Router();

// A-Za-z 0-9 espace retour-ligne @ . , : ! ? — RIEN d'autre (Naim). Pas de < > & " ' / \ ( ) etc. -> pas d'injection.
const ALLOWED = /^[A-Za-z0-9 \r\n@.,:!?]+$/;
const bodySchema = z.object({
  message: z.string().trim().min(10).max(1500).refine((s) => ALLOWED.test(s), 'caracteres_interdits'),
});

async function sendQuoteEmail(message: string): Promise<boolean> {
  // SMTP nodemailer, comme TabascoCity. Le charset restreint en amont (ALLOWED) interdit deja toute injection
  // d'entete email : le message ne contient ni CR/LF de controle exploitable en entete, ni caracteres speciaux.
  const nodemailer = await import('nodemailer');
  const transporter = nodemailer.default.createTransport({
    host: config.EMAIL_SERVER_HOST,
    port: config.EMAIL_SERVER_PORT,
    secure: config.EMAIL_SERVER_PORT === 465, // 465 = SSL ; 587 = STARTTLS (false). Meme logique que conspix (email.ts).
    auth: { user: config.EMAIL_SERVER_USER, pass: config.EMAIL_SERVER_PASSWORD },
  });
  await transporter.sendMail({
    from: config.EMAIL_FROM,
    to: config.QUOTE_TO_EMAIL,
    subject: 'nouvelle demande devis pub lcoalhost',
    text: message,
  });
  return true;
}

quoteRouter.post(
  '/quote',
  limit('quote', 1, 24 * 60 * 60_000), // 1 demande / IP / 24h
  wrap(async (req, res) => {
    const parsed = bodySchema.safeParse(req.body);
    if (!parsed.success) return void res.status(400).json({ error: 'requete_invalide', details: parsed.error.issues.map((i) => i.message) });
    const message = parsed.data.message.replace(/\r\n/g, '\n');

    let emailed = false;
    if (config.EMAIL_SERVER_HOST) {
      emailed = await sendQuoteEmail(message).catch((err) => {
        console.warn('[quote] envoi SMTP echoue (demande stockee quand meme):', (err as Error).message);
        return false;
      });
    }
    await prisma.quoteRequest.create({ data: { message, emailed } });
    res.status(201).json({ ok: true });
  }),
);
