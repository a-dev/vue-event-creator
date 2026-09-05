# Agent guide

`vue-event-creator` is a published Vue 3 library. The npm tarball and public
component, types, and CSS are the product. Read `SPEC.md` before behavior changes
and `TODO.md` before modernization. Check `git status` and preserve unrelated edits.

## Toolchain and packaging

- Use Bun and `bun.lock` only. Node >=24; CI uses latest 24.x, not a pinned patch.
- Keep TypeScript 6 via `typescript: npm:@typescript/typescript6`; defer TS7 until
  Vue tooling supports it. Use `vue-tsc` for SFC type-checking and declarations.
- ESM only: Vite `es`, `type: "module"`, explicit exports for component/types/CSS.
  Keep Vue external and a peer dependency; tooling belongs in `devDependencies`.
- Emit declarations from `src/index.ts`. Share prop/callback types between the SFC
  and public `DefineComponent` type. Package entries must resolve to emitted files.
- Validate component, types, and CSS imports from the tarball, not `src`.

## Behavior contracts

- Preserve public props, callbacks, CSS variables, locale keys, and entry points.
- Consumer events expose only `id`, `startsAt`, `finishesAt`, and optional `data`.
  Never mutate consumer events, arrays, or props; keep editing metadata internal.
- Draft IDs are `null`; `0` is valid. Never derive identity from a date.
- Date ranges are inclusive and ordered; v2 allows at most one event per date.
- Settle async loaders in `finally`; leave UI recoverable after failures.
- Keep locale state per instance. Controls need keyboard support and accessible
  names/state.

## Workflow and validation

- Add focused behavior tests: pure date/state logic in Vitest Node, DOM/focus/CSS
  in Vitest browser, complete journeys in Playwright. Prefer role/name selectors
  and fresh test state.
- Use `bun run <script>`; see `package.json` for scripts. Iterate with
  `test:unit` or `test:browser`, then run `typecheck`, `lint`, `format:check`,
  `test`, `build`, `build:demo`, and `package:check`. Run `test:e2e` for visible
  behavior changes. Documentation-only edits need only relevant checks.
- Run package validation after a clean build; inspect packed files and imports.
  Use scoped lint/format scripts; never hand-edit generated output (`demo-dist/`).
- Update `README.md` and `CHANGELOG.md` for consumer-visible changes.
- Before proposing a release, run `bun run release:check`. Never publish from a
  dirty tree or bypass failed checks. Report failures honestly.
