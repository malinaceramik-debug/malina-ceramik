// DemoScannerAdapter — Fishi's scanner is a location/data scan, never a
// camera pointed at water (fishi-product-lock). In Alpha there is no real
// fishery index to query, so this returns fixture fisheries in waves,
// explicitly labeled as demo. A real adapter would call a geo-indexed
// fishery service instead — the wave-based UI contract stays the same.
import { FISHERIES } from '../data/fixtures.js';

const WAVE_DELAY_MS = 900;

/**
 * Runs the 4-wave scan animation contract described in fishi-product-lock:
 * wave 1 may find nothing, wave 2 auto-widens, wave 3 reveals more, wave 4
 * closes out. Calls onWave(waveIndex, fisheriesSoFar) after each wave.
 */
export function runDemoScan({ onWave, signal }) {
  const allResults = FISHERIES; // demo dataset — everything "found" is fixture data
  const waves = [
    [], // wave 1: nothing yet
    allResults.slice(0, 2), // wave 2: auto-widen reveals first two
    allResults.slice(0, 4), // wave 3: more
    allResults, // wave 4: everything, scan complete
  ];

  return new Promise((resolve) => {
    let i = 0;
    function step() {
      if (signal?.aborted) return resolve(waves[waves.length - 1]);
      onWave(i, waves[i]);
      if (i === waves.length - 1) {
        resolve(waves[i]);
        return;
      }
      i += 1;
      setTimeout(step, WAVE_DELAY_MS);
    }
    step();
  });
}

export const SCANNER_SOURCE_LABEL = 'demo adapter — brak podłączonego indeksu łowisk';
