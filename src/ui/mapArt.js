// Shared illustrated "aerial terrain" SVG background — used by Map Home,
// Active Trip, and Replay so all three feel like one continuous world
// instead of three ad hoc placeholders. Still explicitly a prototype (no
// real geodata), but aims for the layered forest/lake language of the
// reference screenshots instead of a flat abstract blob.
//
// variant: 'map' | 'trip' | 'replay' — small deterministic differences so
// the three screens don't look like an identical copy-paste, while staying
// visually related.

function seededRand(seed) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function treeCluster(cx, cy, rand, count = 5, spread = 22) {
  let dots = '';
  for (let i = 0; i < count; i += 1) {
    const dx = (rand() - 0.5) * spread;
    const dy = (rand() - 0.5) * spread * 0.6;
    const r = 1.6 + rand() * 2.2;
    dots += `<circle cx="${(cx + dx).toFixed(1)}" cy="${(cy + dy).toFixed(1)}" r="${r.toFixed(1)}" />`;
  }
  return dots;
}

const VARIANT_SEED = { map: 7, trip: 23, replay: 41 };

export function renderMapTerrainSvg(variant = 'map') {
  const rand = seededRand(VARIANT_SEED[variant] ?? 7);
  const gradId = `terrainBg-${variant}`;
  const glowId = `terrainGlow-${variant}`;

  // A handful of irregular "forest" blobs (land) with lighter "water" gaps.
  const landBlobs = [
    `M-30,${100 + rand() * 40} C60,${140 + rand() * 30} 100,${230 + rand() * 20} 40,${300 + rand() * 20}
      C-10,${350 + rand() * 20} 50,${420 + rand() * 20} 130,${400 + rand() * 20}
      C210,${385 + rand() * 15} 235,${470 + rand() * 15} 190,${530 + rand() * 15}
      C145,${590 + rand() * 15} 225,${640 + rand() * 15} 310,${610 + rand() * 10}
      L-30,780 Z`,
    `M420,${50 + rand() * 30} C340,${80 + rand() * 20} 305,${160 + rand() * 20} 355,${215 + rand() * 20}
      C400,${255 + rand() * 15} 375,${310 + rand() * 15} 320,${300 + rand() * 15}
      C260,${290 + rand() * 15} 225,${350 + rand() * 15} 260,${400 + rand() * 15}
      L420,420 Z`,
  ];

  // Thin winding "path/river" lines threading between the land shapes.
  const threads = [
    `M-20,220 C80,200 140,260 200,240 C270,215 320,260 400,235`,
    `M-10,480 C90,470 150,520 230,500 C300,485 350,520 410,505`,
  ];

  let trees = '';
  const treeCenters = [[70, 150], [40, 330], [160, 420], [260, 560], [330, 640], [90, 640], [340, 150]];
  treeCenters.forEach(([cx, cy]) => { trees += treeCluster(cx, cy, rand); });

  return `
    <svg class="map-art" viewBox="0 0 390 780" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <defs>
        <radialGradient id="${gradId}" cx="50%" cy="32%" r="78%">
          <stop offset="0%" stop-color="#0d2c34"/>
          <stop offset="45%" stop-color="#051820"/>
          <stop offset="100%" stop-color="#000a12"/>
        </radialGradient>
        <linearGradient id="${glowId}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#0c333d"/>
          <stop offset="100%" stop-color="#08222a"/>
        </linearGradient>
        <radialGradient id="vignette-${variant}" cx="50%" cy="40%" r="70%">
          <stop offset="60%" stop-color="black" stop-opacity="0"/>
          <stop offset="100%" stop-color="black" stop-opacity="0.45"/>
        </radialGradient>
      </defs>
      <rect x="0" y="0" width="390" height="780" fill="url(#${gradId})"/>
      ${landBlobs.map((d) => `<path d="${d}" fill="url(#${glowId})" opacity="0.92"/>`).join('')}
      ${threads.map((d) => `<path d="${d}" fill="none" stroke="#12414c" stroke-width="3" stroke-linecap="round" opacity="0.65"/>`).join('')}
      ${threads.map((d) => `<path d="${d}" fill="none" stroke="#1a5560" stroke-width="1" stroke-linecap="round" opacity="0.5"/>`).join('')}
      <g fill="#9fd6cf" opacity="0.35">${trees}</g>
      <g class="map-grid" fill="rgba(200,230,235,0.15)">
        <circle cx="40" cy="80" r="1.4"/><circle cx="330" cy="200" r="1.4"/><circle cx="70" cy="260" r="1.4"/>
        <circle cx="310" cy="330" r="1.4"/><circle cx="150" cy="380" r="1.4"/><circle cx="250" cy="460" r="1.4"/>
        <circle cx="340" cy="500" r="1.4"/><circle cx="110" cy="540" r="1.4"/><circle cx="200" cy="600" r="1.4"/>
        <circle cx="320" cy="640" r="1.4"/><circle cx="60" cy="420" r="1.4"/><circle cx="260" cy="90" r="1.4"/>
      </g>
      <rect x="0" y="0" width="390" height="780" fill="url(#vignette-${variant})"/>
    </svg>`;
}
