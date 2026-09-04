# Deferred tasks

## Move to TypeScript 7

Target review date: no earlier than 2026-10-01.

Blocked by stable Vue language-tools support. Follow
[vuejs/language-tools#6170 — content mapper (v4 alpha)](https://github.com/vuejs/language-tools/pull/6170),
which is still a draft as of 2026-09-04. Do not move the v2 release to a nightly,
alpha, or draft-only toolchain.

- [ ] Confirm that the upstream pull request is merged and released in a stable
      Vue language-tools version.
- [ ] Confirm that the stable release supports the stable TypeScript 7 line and
      type-checks Vue SFC templates, not only ordinary `.ts` files.
- [ ] Read the stable migration documentation for the content mapper and
      `tsc --runExternalCode`; do not copy configuration from the draft blindly.
- [ ] Test the migration in an isolated branch by replacing the TypeScript 6 npm
      alias with the supported stable TypeScript 7 package.
- [ ] Remove `vue-tsc` only if the stable Vue language-tools release officially
      replaces it for type-checking and declaration generation.
- [ ] Apply and document any TypeScript 7 compiler-option changes.
- [ ] Run `.ts` and `.vue` type-checks, declaration generation, Node and browser
      tests, Playwright E2E, the library/demo builds, and packed-consumer checks.
- [ ] Update `SPEC.md`, `AGENTS.md`, and the changelog after the migration is
      complete.
