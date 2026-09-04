# Repository guide for coding agents

## Project

`vue-event-creator` is a published Vue 3 component library, not an application.
The current work targets version 2, published as ESM only. Treat the npm tarball
and its public component/types/CSS API as the product. Read `SPEC.md` before
changing runtime behavior and consult both TODO files before modernization work.

The repository currently contains staged, user-owned migration work. Preserve
unrelated changes and inspect `git status` before editing.

## Toolchain

- Package manager: Bun (`bun.lock` is the intended lockfile).
- Runtime baseline for the planned Vite 8/Vitest 5 stack: Node 22.12 or newer.
- Framework: Vue 3.
- Library/demo build: Vite.
- Distribution target: ESM only; do not add UMD or CommonJS output.
- Current tests: Jest; migration target: Vitest with browser mode.
- End-to-end target: Playwright Test.
- Formatter/linter migration target: Oxfmt and Oxlint.

Do not add a second lockfile. Tooling packages belong in `devDependencies`; only
code required by consumers at runtime belongs in `dependencies`.

## Main commands

```sh
bun install --frozen-lockfile
bun run dev
bun run build
bun run build:demo
bun run serve
bun run test --runInBand
bunx vue-tsc --noEmit
bunx oxlint src demo tests
bunx oxfmt --check .
NPM_CONFIG_CACHE=/tmp/vue-event-creator-npm-cache npm pack --dry-run
```

Current baseline on 2026-09-04:

- `bun run build` passes, with a Vite warning about loading ESM syntax from a
  CommonJS package/config context.
- `bun run serve` is stale: it previews `demo-app`, while the demo build writes
  to `docs`.
- `bun run test --runInBand` fails before collecting tests because TypeScript 7
  is not compatible with the installed `ts-jest` path.
- `bunx vue-tsc --noEmit` fails because current `vue-tsc` expects the TypeScript
  JavaScript compiler API that TypeScript 7 no longer exports.
- repository-wide Oxlint scans generated `docs/assets` and reports many errors;
  scope it to authored files until ignore rules and scripts are added.
- Oxfmt check currently reports legacy formatting differences.

Do not hide these failures or describe the baseline as green. `TODO-update.md`
defines the intended replacement scripts and completion gates.

## Repository map

- `src/VueEventCreator.vue`: public component and app-level state wiring.
- `src/components/`: calendar and event UI.
- `src/hooks/`: calendar/event state logic.
- `src/index.d.ts`: legacy type declarations; this is not a valid packaged entry
  and is scheduled for replacement.
- `src/styles/`: distributed CSS and public custom properties.
- `demo/`: Vite-powered manual/demo application.
- `tests/unit/`: Jest-era unit and component tests.
- `docs/`: generated GitHub Pages output. Do not lint or hand-edit assets.
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
2. Add or migrate the smallest test that specifies the behavior.
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
- Generate declarations into `dist` from the same public entry used for JS.
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
- Type-check, lint, and format checks pass on authored sources.
- Library and demo builds pass.
- `npm pack --dry-run` contains every declared entry and no source-only path is
  referenced by package metadata.
- A packed ESM consumer can import the component, types, and CSS; a CommonJS
  consumer is intentionally outside the support contract.
- Documentation describes the shipped API accurately.
