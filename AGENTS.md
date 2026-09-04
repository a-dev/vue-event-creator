# Repository guide for coding agents

## Project

`vue-event-creator` is a published Vue 3 component library, not an application.
Version 2 is published as ESM only. Treat the npm tarball and its public
component/types/CSS API as the product. Read `SPEC.md` before changing runtime
behavior and `TODO.md` before modernization work.

Inspect `git status` before editing and preserve unrelated working-tree
changes.

## Toolchain

- Package manager: Bun (`bun.lock` is the intended lockfile).
- Runtime baseline for the Vite 8/Vitest 5 stack: Node 24.0 or newer.
  CI runs the latest 24.x; do not pin an exact patch.
- TypeScript baseline: TypeScript 6, installed through the
  `typescript: npm:@typescript/typescript6` alias for Vue tooling compatibility.
- SFC type-checker and declaration emitter: `vue-tsc`.
- TypeScript 7 is deferred until stable Vue language-tools support; see
  `TODO.md`.
- Framework: Vue 3.
- Library/demo build: Vite.
- Distribution target: ESM only; do not add UMD or CommonJS output.
- Tests: Vitest, with a Node project and a Playwright-backed browser project.
- End-to-end: Playwright Test.
- Formatter and linter: Oxfmt and Oxlint.

Do not add a second lockfile. Tooling packages belong in `devDependencies`; only
code required by consumers at runtime belongs in `dependencies`.

## Main commands

```sh
bun install --frozen-lockfile
bun run dev             # demo dev server
bun run build           # library bundle plus declarations
bun run build:demo      # demo build into demo-dist
bun run serve           # preview the demo build
bun run format:check
bun run typecheck       # vue-tsc over .ts and SFC templates
bun run lint
bun run test            # both Vitest projects
bun run test:unit
bun run test:browser
bun run test:e2e        # Playwright, demo and packed-consumer projects
bun run package:check   # publint, attw, pack dry run, packed consumer
bun run release:check   # the full gate, also run by prepublishOnly
```

Run the narrowest command while iterating and `bun run release:check` before
proposing a release. Lint and format are scoped to authored sources by the
scripts; do not run them over the repository root, which would pick up build
output. Report failures as failures; never describe a red run as green.

## Repository map

- `src/VueEventCreator.vue`: public component and app-level state wiring.
- `src/components/`: calendar and event UI.
- `src/hooks/`: calendar/event state logic.
- `src/index.ts`: typed public entry; packaged declarations are emitted from it.
- `src/types/`: shared public prop, callback, and event-data types.
- `src/styles/`: distributed CSS and public custom properties.
- `demo/`: Vite-powered manual/demo application.
- `tests/unit/`: Vitest suites; `vitest.config.ts` splits them into the Node
  `unit` project and the Chromium `browser` project.
- `tests/e2e/`: Playwright journeys for the demo and the packed consumer.
- `tests/package-consumer/`: ESM fixture that installs and imports the tarball.
- `demo-dist/`: generated demo build output (git-ignored). GitHub Pages is
  deployed from it by `.github/workflows/pages.yml`; do not lint or hand-edit.
- `vite.config.ts`: library build only.
- `demo/vite.config.ts`: demo build and Pages base path.

## Public invariants

- Do not silently break prop names, callback shapes, CSS variables, locale keys,
  or package entry points.
- Consumer events contain public fields only: `id`, `startsAt`, `finishesAt`, and
  optional `data`. Keep occupancy/editing metadata internal.
- Never mutate consumer-provided event arrays, event objects, or prop objects.
- A draft has `id: null`; do not use truthiness to validate an ID because `0` is
  valid.
- Date ranges are inclusive and ordered. The v2 product rule permits at most one
  event on a date unless the specification is deliberately changed before the
  API freeze; event identity must never be derived from that date.
- Async callbacks must settle loaders in `finally` and leave recoverable UI on
  failure.
- Locale state must be per component instance.
- New controls must work with keyboard input and expose accessible names/state.

## Change workflow

1. Identify whether the change affects the public API or only internals.
2. Add the smallest test that specifies the behavior.
3. Keep pure date/state tests in the Node Vitest project. Put DOM interaction,
   focus, CSS, and browser-event behavior in the Vitest browser project.
4. Use Playwright for complete consumer journeys, not for unit-level branches.
5. Run type-check, lint, format check, tests, build, and package validation.
6. Inspect the packed file list and test imports from the package artifact.
7. Update `README.md` and `CHANGELOG.md` for consumer-visible changes.

Prefer behavior-facing selectors such as roles and accessible names. CSS class
selectors are acceptable when the class itself is part of the styling contract.
Create fresh state and wrappers per test; no test may depend on execution order.

## Build and publication rules

- Vite transpilation is not type-checking; a successful build is insufficient.
- Type-check authored TypeScript and Vue SFC templates with TypeScript 6,
  `vue-tsc`, and the `bundler` module-resolution mode.
- Generate declarations from the typed `src/index.ts` boundary with `vue-tsc`.
  Verify that the emitted default component and public types resolve from the
  packed artifact.
- Keep component props and callback contracts in shared `.ts` types used by both
  the SFC implementation and its explicit public `DefineComponent` type.
- Keep Vue external and declare it as a peer dependency.
- Build only the Vite `es` format and mark the package `type: "module"`.
- Keep every `package.json` entry aligned with an emitted file and an explicit
  ESM-only `exports` map, including CSS and types.
- Do not restore `main`, `module`, `unpkg`, CommonJS, or UMD compatibility unless
  the product specification changes.
- Run package validation only after a clean build.
- The packed-consumer smoke test should import the component, public types, and
  CSS from the tarball, not from `src`.
- Do not publish from a dirty working tree or bypass failed checks.

## Completion checklist

- Relevant focused tests pass.
- Full Node and browser suites pass.
- Playwright smoke journeys pass when user-visible behavior changes.
- TypeScript 6 and `vue-tsc` type-check the authored `.ts`/`.vue` graph, SFC
  templates, and public entry.
- Lint and format checks pass on authored sources.
- Library and demo builds pass.
- `npm pack --dry-run` contains every declared entry and no source-only path is
  referenced by package metadata.
- A packed ESM consumer can import the component, types, and CSS; a CommonJS
  consumer is intentionally outside the support contract.
- Documentation describes the shipped API accurately.
