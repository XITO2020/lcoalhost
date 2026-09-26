// Police pixel 5x7 maison (majuscules, chiffres, quelques signes). Partagee par le hero et le panneau 3D.
// Chaque glyphe = 7 lignes de 5 colonnes, "X" = pixel allume, lignes separees par "/".
const G = {
  A: '.XXX./X...X/X...X/XXXXX/X...X/X...X/X...X',
  B: 'XXXX./X...X/X...X/XXXX./X...X/X...X/XXXX.',
  C: '.XXX./X...X/X..../X..../X..../X...X/.XXX.',
  D: 'XXXX./X...X/X...X/X...X/X...X/X...X/XXXX.',
  E: 'XXXXX/X..../X..../XXXX./X..../X..../XXXXX',
  F: 'XXXXX/X..../X..../XXXX./X..../X..../X....',
  G: '.XXX./X...X/X..../X.XXX/X...X/X...X/.XXXX',
  H: 'X...X/X...X/X...X/XXXXX/X...X/X...X/X...X',
  I: '.XXX./..X../..X../..X../..X../..X../.XXX.',
  J: '..XXX/...X./...X./...X./...X./X..X./.XX..',
  K: 'X...X/X..X./X.X../XX.../X.X../X..X./X...X',
  L: 'X..../X..../X..../X..../X..../X..../XXXXX',
  M: 'X...X/XX.XX/X.X.X/X.X.X/X...X/X...X/X...X',
  N: 'X...X/XX..X/X.X.X/X..XX/X...X/X...X/X...X',
  O: '.XXX./X...X/X...X/X...X/X...X/X...X/.XXX.',
  P: 'XXXX./X...X/X...X/XXXX./X..../X..../X....',
  Q: '.XXX./X...X/X...X/X...X/X.X.X/X..X./.XX.X',
  R: 'XXXX./X...X/X...X/XXXX./X.X../X..X./X...X',
  S: '.XXXX/X..../X..../.XXX./....X/....X/XXXX.',
  T: 'XXXXX/..X../..X../..X../..X../..X../..X..',
  U: 'X...X/X...X/X...X/X...X/X...X/X...X/.XXX.',
  V: 'X...X/X...X/X...X/X...X/X...X/.X.X./..X..',
  W: 'X...X/X...X/X...X/X.X.X/X.X.X/XX.XX/X...X',
  X: 'X...X/X...X/.X.X./..X../.X.X./X...X/X...X',
  Y: 'X...X/X...X/.X.X./..X../..X../..X../..X..',
  Z: 'XXXXX/....X/...X./..X../.X.../X..../XXXXX',
  0: '.XXX./X...X/X..XX/X.X.X/XX..X/X...X/.XXX.',
  1: '..X../.XX../..X../..X../..X../..X../.XXX.',
  2: '.XXX./X...X/....X/...X./..X../.X.../XXXXX',
  3: 'XXXXX/...X./..X../...X./....X/X...X/.XXX.',
  4: '...X./..XX./.X.X./X..X./XXXXX/...X./...X.',
  5: 'XXXXX/X..../XXXX./....X/....X/X...X/.XXX.',
  6: '..XX./.X.../X..../XXXX./X...X/X...X/.XXX.',
  7: 'XXXXX/....X/...X./..X../.X.../.X.../.X...',
  8: '.XXX./X...X/X...X/.XXX./X...X/X...X/.XXX.',
  9: '.XXX./X...X/X...X/.XXXX/....X/...X./.XX..',
  ':': '...../..X../..X../...../..X../..X../.....',
  '-': '...../...../...../XXX../...../...../.....',
  '.': '...../...../...../...../...../.XX../.XX..',
  '!': '..X../..X../..X../..X../..X../...../..X..',
  ' ': '...../...../...../...../...../...../.....',
};

const ROWS = Object.fromEntries(Object.entries(G).map(([k, v]) => [k, v.split('/')]));

export const GLYPH_W = 5;
export const GLYPH_H = 7;

export function textWidth(text, scale = 1, gap = 1) {
  return text.length * (GLYPH_W + gap) * scale - gap * scale;
}

/**
 * Dessine `text` pixel par pixel via plot(x, y, row) — l'appelant choisit la couleur (par ligne du glyphe).
 * Retourne la largeur dessinee.
 */
export function drawText(plot, text, x, y, scale = 1, gap = 1) {
  let cx = x;
  for (const ch of text.toUpperCase()) {
    const rows = ROWS[ch] ?? ROWS[' '];
    for (let r = 0; r < GLYPH_H; r++) {
      for (let c = 0; c < GLYPH_W; c++) {
        if (rows[r][c] !== 'X') continue;
        for (let dy = 0; dy < scale; dy++) for (let dx = 0; dx < scale; dx++) plot(cx + c * scale + dx, y + r * scale + dy, r);
      }
    }
    cx += (GLYPH_W + gap) * scale;
  }
  return cx - x - gap * scale;
}
