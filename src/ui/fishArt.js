// Distinct illustrated fish icons per species — replaces the single generic
// 🐟 emoji used everywhere in the first pass. Not photorealistic (no real
// bitmap assets available), but each species gets its own silhouette,
// proportions and coloring so FishiBox/species cards read as a real atlas
// rather than one stock glyph repeated six times.

const BODY = 'M6,30 C6,16 24,6 46,6 C66,6 82,14 92,26 L92,26 C86,20 74,14 62,14 C40,14 24,20 18,30 C24,40 40,46 62,46 C74,46 86,40 92,34 L92,34 C82,46 66,54 46,54 C24,54 6,44 6,30 Z';
const TAIL = 'M92,26 L112,14 L104,30 L112,46 L92,34 Z';

function wrap(id, inner, viewBox = '0 0 120 60') {
  return `<svg viewBox="${viewBox}" class="fish-art" data-species-art="${id}" aria-hidden="true">${inner}</svg>`;
}

function gradientDefs(id, from, to) {
  return `<defs><linearGradient id="grad-${id}" x1="0" y1="0" x2="1" y2="1">
    <stop offset="0%" stop-color="${from}"/><stop offset="100%" stop-color="${to}"/>
  </linearGradient></defs>`;
}

const FISH_ART = {
  species_szczupak: () => wrap('szczupak', `
    ${gradientDefs('szczupak', '#3f8f5e', '#1c4a33')}
    <path d="M2,30 C2,20 20,10 52,10 C78,10 96,18 116,28 L116,28 C108,22 86,17 60,17 C34,17 16,22 10,30 C16,38 34,43 60,43 C86,43 108,38 116,32 L116,32 C96,42 78,50 52,50 C20,50 2,40 2,30 Z" fill="url(#grad-szczupak)" stroke="#0d2f1f" stroke-width="1.5"/>
    <path d="M116,28 L134,16 L126,30 L134,44 L116,32 Z" fill="#2a5c3f" stroke="#0d2f1f" stroke-width="1.2"/>
    <circle cx="16" cy="27" r="2.6" fill="#0a1a12"/>
    <path d="M40,17 C46,12 58,11 66,14" stroke="#79c79a" stroke-width="1.4" fill="none" opacity="0.7"/>
    <path d="M46,44 C54,48 66,48 74,45" stroke="#0d2f1f" stroke-width="1.4" fill="none" opacity="0.5"/>
  `, '0 0 140 60'),

  species_sandacz: () => wrap('sandacz', `
    ${gradientDefs('sandacz', '#6f96a8', '#324f5c')}
    <path d="${BODY}" fill="url(#grad-sandacz)" stroke="#1c2e35" stroke-width="1.5"/>
    <path d="${TAIL}" fill="#4a707d" stroke="#1c2e35" stroke-width="1.2"/>
    <path d="M22,12 L30,3 L38,12 L46,4 L54,12" fill="none" stroke="#1c2e35" stroke-width="2" stroke-linecap="round"/>
    <circle cx="14" cy="27" r="2.8" fill="#0a1418"/>
    <circle cx="14" cy="27" r="1.1" fill="#cfe6ec"/>
  `),

  species_okon: () => wrap('okon', `
    ${gradientDefs('okon', '#c7a23a', '#7a5a16')}
    <path d="${BODY}" fill="url(#grad-okon)" stroke="#3a2a0d" stroke-width="1.5"/>
    <path d="${TAIL}" fill="#e08a4a"/>
    <path d="M28,10 L28,48 M42,8 L42,50 M56,10 L56,48" stroke="#3a2a0d" stroke-width="3" opacity="0.55"/>
    <path d="M20,10 L28,2 L36,10 L44,3 L52,10" fill="none" stroke="#3a2a0d" stroke-width="2" stroke-linecap="round"/>
    <circle cx="13" cy="27" r="2.6" fill="#241a08"/>
  `),

  species_sum: () => wrap('sum', `
    ${gradientDefs('sum', '#5c5a52', '#28271f')}
    <path d="M4,32 C4,18 26,8 58,8 C82,8 100,18 116,30 C100,42 82,52 58,52 C26,52 4,46 4,32 Z" fill="url(#grad-sum)" stroke="#151510" stroke-width="1.5"/>
    <path d="M116,30 L132,20 L126,32 L132,44 L116,34 Z" fill="#3a3830" stroke="#151510" stroke-width="1.2"/>
    <path d="M4,30 C-10,26 -22,28 -30,32" stroke="#151510" stroke-width="2" fill="none" stroke-linecap="round"/>
    <path d="M4,34 C-8,38 -18,40 -26,44" stroke="#151510" stroke-width="1.6" fill="none" stroke-linecap="round"/>
    <circle cx="18" cy="27" r="2.4" fill="#0c0c09"/>
  `, '-32 0 150 60'),

  species_karp: () => wrap('karp', `
    ${gradientDefs('karp', '#caa24d', '#7a501f')}
    <path d="M4,30 C4,14 26,4 54,4 C80,4 98,16 114,28 C98,52 80,56 54,56 C26,56 4,46 4,30 Z" fill="url(#grad-karp)" stroke="#3d2a0f" stroke-width="1.5"/>
    <path d="M114,28 L130,18 L124,30 L130,42 L114,32 Z" fill="#8a5c22" stroke="#3d2a0f" stroke-width="1.2"/>
    <path d="M18,32 L8,38 M22,36 L13,43" stroke="#3d2a0f" stroke-width="2" stroke-linecap="round"/>
    <path d="M40,10 C52,4 68,4 80,10" stroke="#3d2a0f" stroke-width="2.4" fill="none" opacity="0.6"/>
    <circle cx="18" cy="26" r="2.6" fill="#241705"/>
  `, '0 0 132 60'),

  species_leszcz: () => wrap('leszcz', `
    ${gradientDefs('leszcz', '#a7b6bd', '#565f63')}
    <path d="M10,30 C10,10 40,-4 60,10 C72,18 72,42 60,50 C40,64 10,50 10,30 Z" fill="url(#grad-leszcz)" stroke="#2b3134" stroke-width="1.5"/>
    <path d="M96,30 L112,16 L104,30 L112,44 L96,30 Z" fill="#707d82" stroke="#2b3134" stroke-width="1.2"/>
    <path d="M60,10 C74,14 88,20 96,30 C88,40 74,46 60,50" fill="none" stroke="#2b3134" stroke-width="1.4" opacity="0.6"/>
    <circle cx="24" cy="26" r="2.4" fill="#1a1e20"/>
  `, '0 0 118 60'),
};

export function getFishArt(speciesId) {
  const fn = FISH_ART[speciesId];
  return fn ? fn() : wrap('generic', `
    ${gradientDefs('generic', '#6f96a8', '#324f5c')}
    <path d="${BODY}" fill="url(#grad-generic)" stroke="#1c2e35" stroke-width="1.5"/>
    <path d="${TAIL}" fill="#4a707d"/>
    <circle cx="14" cy="27" r="2.8" fill="#0a1418"/>
  `);
}
