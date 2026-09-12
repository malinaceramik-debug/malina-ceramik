// Demo/fixture data for Fishi 3.0 Alpha. Everything here is explicitly
// fixture content (see isDemoFixture flags and DATA_SOURCE_LABEL below) — not
// a claim about real Polish waters, regulations, or records. Regulations and
// national records are intentionally left unverified (see fishi-data-provenance):
// the UI must show "Brak zweryfikowanych danych", never an invented number.

export const DATA_SOURCE_LABEL = 'demo/fixture — Fishi Alpha';

import { createWaterBody, createFishery, createRegulationFact } from '../domain/fishery.js';
import { createSpecies, createSpeciesPresence } from '../domain/species.js';
import { createGearKit } from '../domain/gear.js';
import { createUser } from '../domain/participant.js';

// ---------- Species (matches design/reference/04-fishidex-grid.png) ----------

export const SPECIES = [
  createSpecies({
    id: 'species_szczupak',
    namePl: 'Szczupak',
    nameLatin: 'Esox lucius',
    taxonomy: { order: 'Esociformes', family: 'Esocidae' },
    identification: 'Wydłużone ciało, spłaszczona „kacza" paszcza, drobne łuski, charakterystyczne żółtozielone maskujące cętkowanie.',
    habitat: 'Jeziora, starorzecza, wolno płynące rzeki — najczęściej w pobliżu roślinności, gdzie poluje z zasadzki.',
    behavior: 'Drapieżnik zasadzkowy, terytorialny. Aktywność zwykle wyższa o świcie i zmierzchu oraz w chłodniejszej wodzie.',
    methods: ['Spinning', 'Trolling', 'Zestawy przynęt martwych'],
    typicalRigs: ['Zestaw spinningowy średnio-mocny', 'Przypon stalowy (ochrona przed zębami)'],
    baits: ['Woblery', 'Twistery', 'Blachy wahadłowe'],
    tips: ['Szukaj granic roślinności i skokowych zmian głębokości — typowe stanowiska zasadzki.'],
    sources: [{ label: 'Treść redakcyjna Fishi', type: 'editorial' }],
    artworkRef: 'szczupak',
    recordPl: null,
  }),
  createSpecies({
    id: 'species_sandacz',
    namePl: 'Sandacz',
    nameLatin: 'Sander lucioperca',
    taxonomy: { order: 'Perciformes', family: 'Percidae' },
    identification: 'Wydłużone, bocznie spłaszczone ciało, duże oczy przystosowane do słabego światła, ostre zęby kłowe.',
    habitat: 'Większe jeziora i nizinne rzeki z zamuloną wodą.',
    behavior: 'Drapieżnik stadny, żerujący głównie o zmierzchu i nocą.',
    methods: ['Spinning z jiggowaniem', 'Trolling'],
    typicalRigs: ['Zestaw spinningowy z główką jigową'],
    baits: ['Gumowe przynęty (twistery, ripery)', 'Woblery tonące'],
    tips: ['W dzień szukaj go głębiej, przy dnie; o zmierzchu podchodzi płycej.'],
    sources: [{ label: 'Treść redakcyjna Fishi', type: 'editorial' }],
    artworkRef: 'sandacz',
    recordPl: null,
  }),
  createSpecies({
    id: 'species_okon',
    namePl: 'Okoń',
    nameLatin: 'Perca fluviatilis',
    taxonomy: { order: 'Perciformes', family: 'Percidae' },
    identification: 'Ciemne pionowe pasy na bokach, kolczasta pierwsza płetwa grzbietowa, pomarańczowe płetwy parzyste.',
    habitat: 'Szeroko rozpowszechniony — jeziora, stawy, wolno płynące rzeki.',
    behavior: 'Żeruje stadnie, aktywny cały dzień, drapieżnik oportunistyczny.',
    methods: ['Spinning ultralekki', 'Spławikowe'],
    typicalRigs: ['Zestaw ultralight'],
    baits: ['Małe twistery', 'Błystki obrotowe'],
    tips: ['Stada okoni często zdradza aktywność drobnicy przy powierzchni.'],
    sources: [{ label: 'Treść redakcyjna Fishi', type: 'editorial' }],
    artworkRef: 'okon',
    recordPl: null,
  }),
  createSpecies({
    id: 'species_sum',
    namePl: 'Sum',
    nameLatin: 'Silurus glanis',
    taxonomy: { order: 'Siluriformes', family: 'Siluridae' },
    identification: 'Brak łusek, długie wąsy (czułki) przy pysku, bardzo wydłużone ciało.',
    habitat: 'Głębokie jeziora i duże rzeki nizinne.',
    behavior: 'Największy krajowy drapieżnik słodkowodny, aktywny głównie nocą.',
    methods: ['Spinning ciężki', 'Metoda na żabę/wobler', 'Trolling'],
    typicalRigs: ['Zestaw wzmocniony (sumowy)'],
    baits: ['Duże gumy', 'Przynęty naturalne'],
    tips: ['Poszukuj w pobliżu głębokich rynien i zwałów drewna.'],
    sources: [{ label: 'Treść redakcyjna Fishi', type: 'editorial' }],
    artworkRef: 'sum',
    recordPl: null,
  }),
  createSpecies({
    id: 'species_karp',
    namePl: 'Karp',
    nameLatin: 'Cyprinus carpio',
    taxonomy: { order: 'Cypriniformes', family: 'Cyprinidae' },
    identification: 'Grube ciało, dwie pary wąsików przy pysku, duże łuski (lub ich brak u odmian bezłuskich).',
    habitat: 'Stawy, jeziora i wolno płynące rzeki z miękkim dnem.',
    behavior: 'Żerowanie głównie przy dnie, ostrożny, wrażliwy na presję wędkarską.',
    methods: ['Metoda gruntowa', 'Feeder', 'Karpiowe zestawy włosowe'],
    typicalRigs: ['Zestaw karpiowy z sygnalizacją brań'],
    baits: ['Kulki proteinowe (boilies)', 'Kukurydza', 'Zanęty gruntowe'],
    tips: ['Regularne, umiarkowane zanęcanie zwykle działa lepiej niż jednorazowa duża dawka.'],
    sources: [{ label: 'Treść redakcyjna Fishi', type: 'editorial' }],
    artworkRef: 'karp',
    recordPl: null,
  }),
  createSpecies({
    id: 'species_leszcz',
    namePl: 'Leszcz',
    nameLatin: 'Abramis brama',
    taxonomy: { order: 'Cypriniformes', family: 'Cyprinidae' },
    identification: 'Silnie bocznie spłaszczone ciało, wysoki grzbiet, srebrzysto-mosiężne ubarwienie u dorosłych.',
    habitat: 'Jeziora i wolno płynące rzeki, żeruje stadnie przy dnie.',
    behavior: 'Stadna ryba spokojnego żeru, aktywna często o świcie.',
    methods: ['Metoda gruntowa', 'Feeder', 'Spławikowe (leszczowe)'],
    typicalRigs: ['Zestaw feederowy lekki'],
    baits: ['Robak', 'Kukurydza', 'Zanęty gruntowe drobnoziarniste'],
    tips: ['Stado leszczy zwykle zdradzają pojedyncze pęcherzyki gazu wypływające przy dnie.'],
    sources: [{ label: 'Treść redakcyjna Fishi', type: 'editorial' }],
    artworkRef: 'leszcz',
    recordPl: null,
  }),
];

export const SPECIES_BY_ID = Object.fromEntries(SPECIES.map((s) => [s.id, s]));

// ---------- Water bodies & fisheries (matches design/reference/09-private-spots.png) ----------

export const WATER_BODIES = [
  createWaterBody({ id: 'water_bagry', name: 'Bagry Wielkie' }),
  createWaterBody({ id: 'water_wisla_tyniec', name: 'Zakole Wisły k. Tyńca' }),
  createWaterBody({ id: 'water_kryspinow', name: 'Kryspinów' }),
  createWaterBody({ id: 'water_przylasek', name: 'Przylasek Rusiecki' }),
  createWaterBody({ id: 'water_srebrne', name: 'Jezioro Srebrne' }),
];

export const FISHERIES = [
  createFishery({
    id: 'fishery_bagry',
    waterBodyId: 'water_bagry',
    name: 'Bagry Wielkie',
    authorityName: 'PZW Kraków',
    accessProfile: 'Zezwolenie okręgowe PZW',
    type: 'Jezioro',
    areaHa: 45,
    maxDepthM: 12,
    distanceKm: 6.2,
    coords: { lat: 50.019, lon: 20.013 },
    photoRef: 'bagry',
    speciesIds: ['species_szczupak', 'species_sandacz', 'species_karp', 'species_okon'],
  }),
  createFishery({
    id: 'fishery_wisla_tyniec',
    waterBodyId: 'water_wisla_tyniec',
    name: 'Zakole Wisły k. Tyńca',
    authorityName: 'PZW Kraków',
    accessProfile: 'Zezwolenie okręgowe PZW',
    type: 'Rzeka',
    areaHa: null,
    maxDepthM: 4,
    distanceKm: 12.5,
    coords: { lat: 49.985, lon: 19.826 },
    photoRef: 'wisla',
    speciesIds: ['species_sum', 'species_okon', 'species_leszcz'],
  }),
  createFishery({
    id: 'fishery_kryspinow',
    waterBodyId: 'water_kryspinow',
    name: 'Kryspinów',
    authorityName: 'Zarządca lokalny',
    accessProfile: 'Łowisko komercyjne',
    type: 'Jezioro',
    areaHa: 30,
    maxDepthM: 15,
    distanceKm: 9.1,
    coords: { lat: 50.048, lon: 19.816 },
    photoRef: 'kryspinow',
    speciesIds: ['species_karp', 'species_leszcz', 'species_okon'],
  }),
  createFishery({
    id: 'fishery_przylasek',
    waterBodyId: 'water_przylasek',
    name: 'Przylasek Rusiecki',
    authorityName: 'Zarządca lokalny',
    accessProfile: 'Kompleks stawów, zezwolenie miejscowe',
    type: 'Stawy',
    areaHa: 8,
    maxDepthM: 5,
    distanceKm: 18.0,
    coords: { lat: 50.006, lon: 20.089 },
    photoRef: 'przylasek',
    speciesIds: ['species_karp', 'species_leszcz'],
  }),
  createFishery({
    id: 'fishery_srebrne',
    waterBodyId: 'water_srebrne',
    name: 'Jezioro Srebrne',
    authorityName: 'PZW okręg',
    accessProfile: 'Zezwolenie okręgowe PZW',
    type: 'Jezioro',
    areaHa: 22,
    maxDepthM: 9,
    distanceKm: 14.3,
    coords: { lat: 50.07, lon: 19.98 },
    photoRef: 'srebrne',
    speciesIds: ['species_szczupak', 'species_okon'],
  }),
];

export const FISHERIES_BY_ID = Object.fromEntries(FISHERIES.map((f) => [f.id, f]));

// SpeciesPresence — deliberately mixed statuses so the UI is forced to
// render all four states honestly, never flattening to "yes it's here".
export const SPECIES_PRESENCE = [
  createSpeciesPresence({ waterBodyId: 'water_bagry', speciesId: 'species_szczupak', status: 'confirmed_source', sourceRefs: ['demo:fixture'] }),
  createSpeciesPresence({ waterBodyId: 'water_bagry', speciesId: 'species_sandacz', status: 'community_confirmed', sourceRefs: ['demo:fixture'] }),
  createSpeciesPresence({ waterBodyId: 'water_bagry', speciesId: 'species_karp', status: 'confirmed_source', sourceRefs: ['demo:fixture'] }),
  createSpeciesPresence({ waterBodyId: 'water_bagry', speciesId: 'species_okon', status: 'inferred_distribution', sourceRefs: [] }),
];

// Regulations: every fact starts as `missing` in Alpha on purpose — no
// fabricated legal thresholds. UI renders "Brak zweryfikowanych danych".
export const REGULATIONS = FISHERIES.flatMap((f) =>
  f.speciesIds.map((speciesId) =>
    createRegulationFact({
      jurisdictionId: 'pl_demo',
      waterId: f.waterBodyId,
      speciesId,
      factType: 'protected_period',
      value: null,
      sourceRef: null,
      status: 'missing',
    })
  )
);

// ---------- Gear kits (fixture default, per §12) ----------

export const DEFAULT_GEAR_KITS = (ownerId) => [
  createGearKit({
    ownerId,
    name: 'Lekki spinning',
    items: [
      { kind: 'wedka', label: 'Wędka spinningowa UL 2,1m' },
      { kind: 'kolowrotek', label: 'Kołowrotek 2000' },
      { kind: 'linka', label: 'Plecionka 0,08mm' },
    ],
  }),
  createGearKit({
    ownerId,
    name: 'Szczupak',
    items: [
      { kind: 'wedka', label: 'Wędka spinningowa MH 2,4m' },
      { kind: 'kolowrotek', label: 'Kołowrotek 3000' },
      { kind: 'linka', label: 'Plecionka 0,12mm' },
      { kind: 'przypon', label: 'Przypon stalowy' },
    ],
  }),
];

// ---------- Demo participants (matches replay/friends reference screens) ----------

export const DEMO_USER = createUser({ id: 'user_me', displayName: 'Ty' });
export const DEMO_FRIENDS = [
  createUser({ id: 'user_marek', displayName: 'Marek', isDemoFixture: true }),
  createUser({ id: 'user_kamil', displayName: 'Kamil', isDemoFixture: true }),
  createUser({ id: 'user_michal', displayName: 'Michał', isDemoFixture: true }),
];
export const DEMO_USERS_BY_ID = Object.fromEntries([DEMO_USER, ...DEMO_FRIENDS].map((u) => [u.id, u]));
