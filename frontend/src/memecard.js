// Memes-texte maison : rendus en CSS dans le flux, exportes en PNG 1080x1080 au telechargement.
function wrap(g, text, maxWidth) {
  const lines = [];
  let line = '';
  for (const word of text.split(/\s+/)) {
    const test = line ? `${line} ${word}` : word;
    if (g.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

export function memePng(item) {
  const S = 1080;
  const c = document.createElement('canvas');
  c.width = S;
  c.height = S;
  const g = c.getContext('2d');
  g.fillStyle = '#fbf8f1';
  g.fillRect(0, 0, S, S);
  g.strokeStyle = '#15151a';
  g.lineWidth = 16;
  g.strokeRect(8, 8, S - 16, S - 16);
  g.fillStyle = '#e8622c';
  g.fillRect(60, 60, 140, 14);

  g.fillStyle = '#15151a';
  g.textAlign = 'left';
  g.textBaseline = 'top';
  g.font = '800 72px "Trebuchet MS", Verdana, sans-serif';
  wrap(g, item.title, S - 120).forEach((l, i) => g.fillText(l, 60, 120 + i * 88));

  if (item.caption) {
    g.font = '600 54px "Trebuchet MS", Verdana, sans-serif';
    g.fillStyle = '#3d3c45';
    const lines = wrap(g, item.caption, S - 120);
    lines.forEach((l, i) => g.fillText(l, 60, S - 150 - (lines.length - i) * 68));
  }
  g.font = '700 28px "Courier New", monospace';
  g.fillStyle = '#6b6a72';
  g.textAlign = 'right';
  g.fillText('lcoalhost.lol', S - 56, S - 66);
  return new Promise((resolve) => c.toBlob(resolve, 'image/png'));
}
