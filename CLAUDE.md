# Fishi 3.0

Właściciel produktu: Wojciech Malina.
Nadrzędna zasada: „Nie komplikuj rzeczy prostych. Proste działanie — proste rozwiązanie.”

Ten plik jest krótkim punktem wejścia. Pełna specyfikacja produktu (master handoff
z 2026-09-12) żyje w historii tej sesji/konwersacji, nie jest tu duplikowana w
całości. Poniżej: fakty ustalone w repo + twarde zasady + gdzie szukać czego.

## Status repo (ustalone, nie zgaduj)

- To repo było wcześniej PWA "Malina Ceramik" (studio ceramiki) — niezwiązane z
  Fishi. Zarchiwizowane w `_archive/malina-ceramik-pwa/` (nie usunięte, `git mv`
  zachował historię). Nie przywracaj tych plików do roota bez pytania właściciela.
- Fishi 3.0 buduje się od zera w tym repo, root katalogu.
- Wizualny kierunek: **CIEMNY** (dark navy/near-black + neon niebiesko-turkusowy
  akcent), potwierdzone przez właściciela na podstawie 15 zrzutów ekranu w
  `design/reference/*.png`. To NADPISUJE opis "jasny pastelowy" z oryginalnego
  master handoff dokumentu — właściciel jawnie potwierdził dark/neon jako
  właściwy kierunek. Nie przywracaj jasnej palety bez nowej decyzji właściciela.
- Referencyjne zrzuty ekranu (V01, prawdziwe źródło prawdy wizualnej) są w
  `design/reference/01..15-*.png`. Każda zmiana ekranu ma być porównywana z
  odpowiednim plikiem, nie z pamięcią/opisem.
- Tokeny wyekstrahowane programowo z pikseli referencji: `design/tokens.css`.

## Priorytet źródeł przy konflikcie

1. Decyzje właściciela z bieżącej konwersacji (np. dark/neon zamiast jasnego).
2. `design/reference/*.png` (V01).
3. Ten plik i `.claude/skills/fishi-*`.
4. Reszta master handoff doc (roadmapa E00–E23, model danych, MVP scope) — nadal
   obowiązuje wszędzie, gdzie nie została jawnie nadpisana punktami 1–3.

## Twarde zakazy (nie pytaj, po prostu nie rób)

- Brak XP, leveli, punktów doświadczenia, pasków progresu do "levelu".
- Skaner łowisk = skanowanie danych lokalizacyjnych/mapowych, NIGDY zdjęcie wody
  ani analiza obrazu.
- Brak obowiązkowego AI rozpoznawania ryby ze zdjęcia w MVP.
- Kasety łowisk (poziomy karuzel) nie mogą stać się zwykłą siatką/listą kart.
- Brak wymyślonych procentów skuteczności / prawdopodobieństw / rekordów /
  danych o gatunkach. Placeholder/demo dane muszą być jawnie oznaczone jako demo.
- Geometria wody != prawo do łowienia. GPS != "przeanalizowany brzeg".
- Prywatne miejscówki i dokładny GPS = prywatne domyślnie, nigdy udostępniane
  automatycznie.
- `Trip` (wyprawa) jest centralną jednostką danych, nie `Catch` (połów). Wyprawa
  bez zapisanego połowu nigdy nie jest prezentowana jako "0 ryb" / porażka.

## Sposób pracy

- Vertical slices: dane + logika + wygląd + animacje + edge cases + testy +
  dowód (screenshot/nagranie) na każdy fragment — nie warstwami.
- Przed większą implementacją: krótki plan (cel, zachowanie użytkownika, czego
  nie robię, jakie pliki, jakie testy, jedno realne ryzyko/blokada).
- Nie ogłaszaj czegoś jako "gotowe" bez realnych dowodów (nie tylko build/typecheck).
- Otwarte decyzje architektoniczne (stack mobilny, background GPS, backend/auth,
  dostawca map, źródła przepisów) — nie zgaduj, przedstaw opcje i konsekwencje.
  Background GPS na fizycznym urządzeniu NIE MOŻE być zweryfikowany w tym
  środowisku (brak fizycznego telefonu) — oznaczaj taki status jako
  `NOT_VERIFIED_ON_DEVICE`, nigdy jako potwierdzone działające.

## Struktura projektu

```
design/reference/   — zrzuty V01 (źródło prawdy wizualnej), tokens.css
_archive/            — stary, niezwiązany kod (readonly reference)
.claude/skills/       — automatyczne guardrails (product-lock, visual-qa,
                        domain-integrity, local-first, data-provenance,
                        release-gate)
```

Zobacz `.claude/skills/fishi-product-lock/SKILL.md` dla pełnej listy zasad UX
(mapa, skaner, kasety, Fishidex, trip, prywatność) w skróconej, praktycznej formie.
