// DemoWeatherAdapter — real weather requires a paid API/key we don't have in
// this environment. Always returns a fixed, clearly-labeled demo snapshot;
// the Trip/WeatherSnapshot shape is real so swapping in a live adapter later
// doesn't change any calling code.
export function getDemoWeatherSnapshot() {
  return {
    tempC: 19,
    condition: 'light-rain',
    windKmh: 12,
    windDir: 'W',
    source: 'demo',
    at: new Date().toISOString(),
  };
}
