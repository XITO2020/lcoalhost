// Aside pub (pastilles rondes). Depuis le 23/09 (Naim : "autant de pubs qu'il y a d'images rondes dans pubs/, si
// j'en rajoute elles sont prises en compte directement") : TOUTES les images de public/pubs/ sont affichees, liste
// generee par scripts/gen-pubs.js (fini les 2 jeux de 5 tires au hasard). Les 10 pastilles d'origine gardent leurs
// infos (nom, fond, infobulles x3) via PINS ci-dessous ; une image nouvelle s'affiche avec des valeurs par
// defaut (nom tire du fichier). Lien : `url` quand Naim l'a fourni, sinon href="#" en attendant.
import { getLang } from './i18n.js';
import { trackPromo } from './promo-track.js';
import { PUB_FILES, PUB_FILES_FR } from './pubs.generated.js';

const esc = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// Pastilles DISCRETES (Naim 24/09) : sites a garder confidentiels avant leur protection. Leurs infos ne vivent que
// dans ce bloc `import.meta.env.DEV` : la compilation de PRODUCTION le remplace par [] et SUPPRIME ces textes du
// code envoye aux visiteurs (sinon noms et infobulles resteraient lisibles dans le JavaScript). Liste des fichiers :
// src/pubs-hidden-in-prod.js (vite.config.js retire aussi les images du build).
const DEV_ONLY_PINS = import.meta.env.DEV
  ? [
      {
        name: 'TabascoCity',
        img: '/pubs/circles/tbcity.webp',
        bg: '#ffffff',
        tip: {
          fr: 'Capitale du WEB 3.0, gen IA bas prix, achat Petaverse, Unscam ethical NFT',
          en: 'Capital of WEB 3.0 — cheap AI generation, Petaverse purchases, Unscam ethical NFTs',
          es: 'Capital de la WEB 3.0 — generación IA barata, compras en el Petaverse, NFT éticos Unscam',
        },
      },
      {
        name: 'Ref.land',
        img: '/pubs/circles/refland1.webp',
        bg: '#ffffff',
        tip: {
          fr: 'Le AlloTiktok des refs et des influenceurs !',
          en: 'The AlloTikTok of referrals and influencers!',
          es: '¡El AlloTikTok de las referencias y los influencers!',
        },
      },
      {
        name: 'Zarmazon',
        img: '/pubs/circles/zarmazon.webp',
        bg: '#ffffff',
        tip: {
          fr: "L'e-commerce le plus honteux de la planète, c'est rarement drôle",
          en: 'The most shameless e-commerce site on the planet — rarely funny',
          es: 'El e-commerce más desvergonzado del planeta — rara vez gracioso',
        },
      },
      {
        name: 'Conspix',
        img: '/pubs/circles/conspix.webp',
        bg: '#ababab',
        crop: true,
        tip: {
          fr: 'Conspix: Le Netflix du complotisme, niveau suprême darklord',
          en: 'Conspix: The Netflix of conspiracy theories, supreme darklord tier',
          es: 'Conspix: El Netflix de las teorías conspirativas, nivel supremo darklord',
        },
      },
    ]
  : [];

// Ordre d'affichage = ordre d'origine (les pastilles discretes s'inserent apres Shonen.Industries en dev).
const PINS = [
  {
    name: 'Shonen.Industries',
    img: '/pubs/circles/shonenind.webp',
    bg: '#d495ee',
    tip: {
      fr: 'shonen.ind: Poste et découvre du manga trié sur le "volé"',
      en: 'shonen.ind: post and discover manga, hand-picked from the "borrowed" pile',
      es: 'shonen.ind: publica y descubre manga, "tomado prestado" con cuidado',
    },
  },
  ...DEV_ONLY_PINS,
  {
    name: 'Free Rulers Hill',
    img: '/pubs/circles/free-rulers-hill.webp',
    bg: '#ed34d0',
    crop: true,
    tip: {
      fr: 'Free Rulers Hill: Design et reçois tes hoodies, skates et sneakers sur free-rulers-hill',
      en: 'Free Rulers Hill: design and get your hoodies, skateboards and sneakers',
      es: 'Free Rulers Hill: diseña y recibe tus sudaderas, skates y zapatillas',
    },
  },
  {
    name: 'GSM',
    img: '/pubs/circles/gsm.webp',
    url: 'https://www.atramenta.net/ebooks/guerres-sources-et-maudits--volume-1/1048',
    bg: '#c7b7a4',
    crop: true,
    tip: {
      fr: "Guerres Sources et Maudits, tous les secrets du monde en une saga d'initiés",
      en: "Guerres Sources et Maudits — every secret of the world in one insider saga",
      es: 'Guerres Sources et Maudits — todos los secretos del mundo en una saga de iniciados',
    },
  },
  {
    name: 'AVC News',
    img: '/pubs/circles/avcnews.webp',
    url: 'https://www.tiktok.com/@tabascocity/video/7050422115127872774',
    bg: '#ffffff',
    crop: true,
    tip: {
      fr: 'Audio Video Channel : la chaîne des plus gros connards niant le complotisme au monde',
      en: "Audio Video Channel: home to the world's biggest jerks denying conspiracy theories",
      es: 'Audio Video Channel: el hogar de los mayores imbéciles del mundo negando el conspiranoísmo',
    },
  },
  {
    name: 'Quizz Library',
    img: '/pubs/circles/quizz-library.webp',
    bg: '#5c4a75',
    crop: true,
    tip: {
      fr: 'Quiz Library: Maîtriser le verse de TabascoCity et y gagner du territoire !',
      en: 'Quiz Library: master the TabascoCity universe and win territory!',
      es: 'Quiz Library: ¡domina el universo de TabascoCity y gana territorio!',
    },
  },
];

// Infos connues par nom de fichier. Ordre d'affichage : les pastilles connues dans leur ordre d'origine, puis les
// nouvelles par ordre alphabetique. Une image retiree de pubs/ disparait simplement.
const KNOWN = PINS;
const fileOf = (p) => p.img.split('/').pop();
const byFile = new Map(KNOWN.map((p) => [fileOf(p), p]));

// Pastilles d'une liste generee (deja sans les discretes en prod). L'image est calculee depuis le DOSSIER reel
// (circles/ mondial, zone_fr_only/circles/ pour la FR) : les infos connues (nom, fond, infobulle, lien) viennent de
// PINS par nom de fichier, mais le chemin suit la zone ou le fichier vit vraiment.
function pinsFor(files, folder) {
  const known = KNOWN.map(fileOf).filter((f) => files.includes(f));
  const extra = files.filter((f) => !byFile.has(f));
  return [...known, ...extra].map((file) => {
    const img = `/pubs/${folder}/${file}`;
    const p = byFile.get(file);
    if (p) return { ...p, img, file };
    const name = file.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ');
    return { name, img, bg: '#ffffff', file, tip: { en: name, fr: name, es: name } };
  });
}
// Mondiales + (si interface FR) les FR-only (Naim 24/09 : zone_fr_only = territoires francophones, cible sur la
// LANGUE d'interface, pas la geoloc IP).
const currentPins = () => [...pinsFor(PUB_FILES, 'circles'), ...(getLang() === 'fr' ? pinsFor(PUB_FILES_FR, 'zone_fr_only/circles') : [])];

export function createPubAside(rootEl) {
  // Cible .aside-body (23/09, volet coulissant demande par Naim) : PAS rootEl directement — rootEl porte
  // maintenant aussi le bouton .aside-handle (index.html), qu'un remplacement de tout son innerHTML effacerait.
  const root = rootEl.querySelector('.aside-body') ?? rootEl;
  const label = root.querySelector('.pub-label');
  const render = () => {
    const lang = getLang();
    const pins = currentPins();
    root.innerHTML =
      (label ? label.outerHTML : '') +
      pins
        .map(
          (p) =>
            // Lien reel quand Naim l'a fourni (AVC News, GSM), sinon "#" en attendant. title = infobulle de la langue.
            `<a class="pub-pin${p.crop ? ' crop' : ''}" href="${esc(p.url ?? '#')}"${p.url ? ' target="_blank" rel="noopener noreferrer"' : ''} aria-label="Pub ${esc(p.name)}" title="${esc(p.tip[lang] ?? p.tip.en)}" style="--pub-bg:${p.bg}"><img src="${esc(p.img)}" alt="${esc(p.name)}" loading="lazy"></a>`,
        )
        .join('');
    // Mesure anonyme affichages/clics (Phase D.4) : cle = nom de fichier, acceptee par house-pins.generated.ts.
    [...root.querySelectorAll('.pub-pin')].forEach((a, i) => trackPromo(a, `pub:${pins[i].file}`));
  };
  render();
  // Changement de langue : l'ensemble des pastilles change (les FR apparaissent/disparaissent), pas juste les tooltips.
  window.addEventListener('lh:lang', render);
}
