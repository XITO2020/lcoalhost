// GENERE AUTOMATIQUEMENT par frontend/scripts/gen-pubs.js — NE PAS EDITER A LA MAIN, ca sera ecrase.
// Deposer/supprimer une image dans public/pubs/circles|squares (mondial) ou public/pubs/zone_fr_only/circles|squares
// (langue FR uniquement).
export const PUB_FILES = [...["free-rulers-hill.webp","memeral.png","quizz-library.webp","shonenind.webp"], ...(import.meta.env.DEV ? ["conspix.webp","refland1.webp","tbcity.webp"] : [])];
export const PUB_FILES_FR = [...["avcnews.webp","gsm.webp"], ...(import.meta.env.DEV ? ["zarmazon.webp"] : [])];
export const SQUARE_FILES = [...[], ...(import.meta.env.DEV ? [] : [])];
export const SQUARE_FILES_FR = [...["adtv1e1.webp","adtv1e2.webp"], ...(import.meta.env.DEV ? ["avcnewssport.webp"] : [])];
