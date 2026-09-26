# Changelog — `noy-db-at`

The five `@noy-db/at-*` sealing-key providers move as **one version line**, so this
is one changelog for the repo rather than one per package.

It is written by hand. There is no changesets setup here deliberately: changesets'
central value is computing a dependency closure over a lockstep line, and this repo
has five packages and zero internal edges, so there is no closure to compute.
See `scripts/version-set.mjs` for the full reasoning.

**This file is not published.** Every package's `files` array is
`["dist", "README.md", "LICENSE"]`, so no changelog ships in any tarball. A mistake
here is amendable in place — unlike `@noy-db/hub`, which ships its `CHANGELOG.md`
and must therefore correct a bad entry *alongside*, in the next one.

---

## 0.9.0-pre.0

### Added

- **`pnpm typecheck:test` — the suites are typechecked.** Every package's `tsconfig.json`
  is scoped `include: ["src"]`, and vitest transpiles test files without typechecking
  them, so 11 test files had no type coverage at all. A root `tsconfig.test.json` covers
  `at-*/src` + `at-*/__tests__`, and `family.config.json` declares it under `localChecks`
  so CI runs it beside the gates. ⚠️ It found **8 real errors on its first run**: the
  `at-gcp-kms` fake Cloud KMS client returned a 1-tuple and cast it to the 3-tuple the
  real client resolves (×6), and `tampered[15] ^= 0xff` in two tamper-detection tests
  where an out-of-range typed-array write is a **silent no-op** — a short envelope would
  have left the ciphertext untampered and the test asserting nothing, while green.

- **`at-azure-keyvault` binds `@noy-db/test-sealer-conformance`**, so all five packages
  now have kit coverage. ⚠️ It takes **`runDelegatingSealerObligations`**, matching
  `at-aws-kms` and `at-gcp-kms` — not the full `runSealerConformanceTests` suite. For a
  delegating provider the properties that suite asserts (refusing tampered, foreign or
  garbage input) are the *service's* behaviour, so a fake Key Vault in front of it would
  test the fake. What is pinned is what belongs to the provider: a service failure must
  surface, and an empty response must throw rather than be fabricated into empty bytes.

### Fixed

- `at-macos-keychain`'s README called `db.vault('acme')` directly after `createNoydb()`.
  Hub's `vault()` is synchronous access to an **already-open** vault and throws rather
  than constructing, so the snippet could not run and its comment described first-open
  behaviour on a call that never opens. It now uses `await db.openVault('acme')`, as the
  other four READMEs already did.

- An inert `eslint-disable @typescript-eslint/no-require-imports` at
  `at-macos-keychain/src/index.ts:197`. Measured rather than assumed: removing it leaves
  lint fully clean, so the rule is not enabled by this config. The `require` it named is
  still there; the directive never did anything.

- `eslint.config.mjs` described itself as the config "for the noy-db-to standalone
  package" — an extraction copy-paste, present verbatim in three extracted repos.

- `scripts/version-set.mjs` pointed at `pnpm check:versions-uniform` and
  `pnpm check:not-already-published`. Neither is a script here any more: the first
  survives as a family-tools gate, the second survives nowhere. Comment and console
  output only.

Test baseline moves **11 → 12 files, 91 → 95 passed**. The 4 skips are unchanged and
still the inherited credential-gated cloud cases.

### 0.9 line

- Exact dev pins on `@noy-db/hub` and `@noy-db/ports` move `0.9.0-pre.1` → `0.9.0-pre.2`.
  The `@noy-db/hub` peer range already carried `^0.9.0-pre.1` and needs no second append: for a
  0.x caret npm reads that as `>=0.9.0-pre.1 <0.10.0`, so it already admits `0.9.0` stable.
  `^0.9.0-pre.1` rather than `-pre.0` is deliberate — `pre.0` carries core#132 (last-writer-wins
  `_keyring` writes, `TamperedError` on a cold read) and nothing should resolve to it.
- No source change at the new pin: 12 test files / 95 passed + 4 skipped, `typecheck`, `typecheck:test` and all seven gates green.

---

## 0.8.0

The stable cut of the `0.8` line. **No package's `src/` changed** between `0.8.0-pre.0`
and this release — it is a version and pinning event.

### Changed

- **Version `0.8.0-pre.0` → `0.8.0`** across all five packages, with the four exact dev
  pins moving with it (`@noy-db/hub`, `@noy-db/on-shamir`, `@noy-db/test-sealer-conformance`,
  `@noy-db/to-memory`). ⚠️ As of this line those pins come from **two** repos, not one:
  `on-shamir` is published by `noy-db/on` since its move from core. Read the publisher
  off the artefact (`npm view @noy-db/on-shamir repository.url`), never off a doc.

- **A `nightly` workflow caller was added.** The family's per-push CI matrix narrowed to
  Node 22 only; this runs the full `["22","24"]` matrix on a schedule plus
  `workflow_dispatch`. ⛔ Without it this repo would simply have stopped testing Node 24 —
  a trim, not a deletion, and only honest if the wider matrix still runs somewhere.

---

## 0.8.0-pre.0

Relicensed from MIT to Apache-2.0 from this version on. Earlier versions remain MIT.

No package's `src/` changed in this release either. It is a licence, provenance and
lockstep event: the code that shipped as `0.7.0` is the code that ships here, under a
different licence and pinned to core's `0.8` line.

### Changed

- **Licence: MIT → Apache-2.0**, in all five manifests and this repo's root. Each
  package now carries its own `LICENSE` (the canonical Apache-2.0 text) and a `NOTICE`
  (`noy-db — Copyright 2026 vLannaAi`), and `files` lists `NOTICE` so both travel in
  the tarball. ⚠️ The licence is a **version event, not a retro-edit**: `0.7.0` and
  everything before it remain MIT and are not touched.

- **The `check-license` gate is now declared** in `family.config.json`. It makes
  "listed in `files` but missing on disk" impossible by construction — the shape that
  a sibling repo shipped in its `0.7.0` tarballs. It was never shipped here: the
  published `0.7.0` tarballs do carry a `LICENSE`, because they were cut from core's
  monorepo, whose tree had the file. What this repo lacked was the file in its own
  tree after extraction.

- **The lockstep dev pins moved to `0.8.0-pre.0` as a unit** — `@noy-db/hub`,
  `@noy-db/on-shamir`, `@noy-db/to-memory` and `@noy-db/test-sealer-conformance`
  (the last in four of five packages; `at-azure-keyvault` binds no conformance kit,
  and that gap is the one stated in the README, not an oversight here).

- **The hub peer range was widened by APPENDING**: `^0.7.0` → `^0.7.0 || ^0.8.0-pre.0`,
  in all five. A consumer already resolving on the 0.7 line keeps resolving; nothing
  narrows. Written structurally rather than with `sed`, because a `|` delimiter
  collides with the `||` the range now contains and any other delimiter truncates the
  range silently.

- **`@noy-db/on-shamir` is now published by `noy-db/on`, not by core.** The pin moves
  from `0.7.0` (core-published) to `0.8.0-pre.0` (on-published) under the same name,
  so the change is invisible to consumers of this repo and is recorded here only
  because the publisher of a pinned dependency changed.

### Added

- **`.github/workflows/release.yml`** — the release caller, copied unchanged from
  `noy-db/.github@v1`, `permissions` block included. It fires only when a Release is
  published, and delegates to the family's reusable workflow.

### Note

`0.7.1-pre.0` never reached public npm. Its section below stands as written — it
records work that is in this tree — but the registry went `0.7.0` → `0.8.0-pre.0`.

## 0.7.1-pre.0

**This release ships functionally identical code to `0.7.0`.** No package's `src/`
changed — verified by comparing the `sourcesContent` embedded in each published
`0.7.0` tarball's `dist/index.js.map` against this tree, byte-identical across all
five, and total rather than sampled because each package has exactly one source file
and each map lists exactly that file. Read it as an ownership and tooling release, not
as a code fix.

It exists because **`0.7.0` was never this repo's to ship.** Core published it for the
whole lockstep line on 2026-09-01, ~62 seconds after `hub@0.7.0`, while these packages
were still inside its monorepo. This repo holds no tag for it, cut no release, and
`check:not-already-published` correctly refused the next cut until the line moved. This
release takes the line over and opens it.

### Fixed

- **The version baseline was behind the registry.** All five manifests said
  `0.7.0-pre.17` while npm carried `0.7.0` for every package: core cut and
  published `0.7.0` for the whole lockstep line on 2026-09-01, after this repo's
  extraction snapshot was taken.

  The **code was never behind — only the manifests.** Verified by comparing the
  `sourcesContent` embedded in each published `0.7.0` tarball's
  `dist/index.js.map` against this tree's `src/`: byte-identical across all five.
  The tarballs ship no `src/`, so the sourcemap was the only query that could
  answer this without a local build, and unlike diffing `dist/` it cannot be
  defeated by tsup or banner drift.

- **Hub peer ranges narrowed from `^0.7.0-pre.17` to `^0.7.0`**, matching what
  published `0.7.0` declares. The prerelease caret was the **wider** range — it
  reaches forward into its stable *and* admits the whole 0.7 pre line — so keeping
  it would silently have re-widened what `0.7.0` narrowed.

- **Nineteen exact dev pins on core** (`hub`, `on-shamir`, `to-memory`,
  `test-sealer-conformance`) moved to `0.7.0` as a unit. Found by grepping for the
  **old version string** after the edit was believed complete; re-reading the edit
  would have shown five happy versions and confirmed nothing.

- **A release would have failed before publishing.** `release.yml`'s verify gate
  read the version from the **root** `package.json` as "the lockstep canonical",
  a step ported verbatim from `noy-db-to`. This repo's root manifest is
  `private: true` and carries no `version`, so the check compared the string
  `undefined` against the tag and could never pass. Replaced with a per-package
  tag check that reads the packages actually being published.

- **`release.yml`'s consumer-facing examples named `@noy-db/to-aws-s3`**, carried
  over from `noy-db-to`. Corrected to `@noy-db/at-env`. Both workflow headers also
  described these packages as "storage adapters"; they are sealing-key providers.

- **An expired justification, one clause of which reached maintainers as a live
  error.** `release.yml`'s prerelease-routing guard told anyone who tripped it
  that `@latest` was *"already broken here (17 deprecated 0.5.0 versions)"*.
  Every clause was false for this repo, measured 2026-09-01: five packages, not
  17; `@0.5.0` deprecated is empty for all five (controlled against a
  known-deprecated package, so the empty result is an answer and not a broken
  query); `@latest` is `0.7.0`, a healthy stable; and the stable the comment
  called "blocked" has shipped.

  The **guard is correct and stays** — a semver prerelease routed to `@latest` is
  a real hazard. Only its justification expired, so the condition was replaced
  with the reason, which cannot. The "17" was traced to its origin:
  `check-peer-floor.mjs`'s header records noy-db-to's #89 being repaired by
  deprecating 17 `to-*` versions, and `release.yml` had re-pointed that number at
  `at-*` packages.

- **Three more borrowed justifications corrected in place**, all telling another
  repo's incident as this repo's own: `check-peer-floor.mjs` claimed "1717 tests"
  (this repo has 95) and "currently two" distinct peer floors (measured: one),
  and attributed noy-db-to's #89/#84 locally; `align-dist-tags.mjs` said "this
  repo has the scar" about a `to-browser-fs` incident that happened elsewhere.
  The reasoning transfers exactly and was kept; the attribution did not and was
  fixed. Stating someone else's incident as your own is how a justification
  survives past the point anyone can check it.

- **Two scripts were laxer than the resolver they guard.** `check-versions-uniform.mjs`
  and `version-set.mjs` both passed `{ includePrerelease: true }` to `semver.satisfies`.
  npm and pnpm do not, so both were strictly *more permissive* than the resolution they
  exist to protect — a false PASS, which no test catches because its failure mode is
  agreeing with you. Measured band for `^0.7.0`: both edges agree, and divergence is
  exactly a prerelease on a **patch tuple inside** the span, where this repo now sits.

  `version-set.mjs` was the worse half: it used the flag as a *skip* condition, so a
  stale-tuple internal range was judged already-satisfied and never rewritten — the
  mitigation and the defect were one bug with opposite signs. Proven with a probe edge
  rather than by reading: before, the range survived untouched while the gate reported
  `1 internal range(s) admit it` and npm would `ERESOLVE`; after, it is rewritten and
  the count is true.

- **CI did not run on a stacked pull request.** `pull_request: branches: [main]` filters
  on the **base** branch, so a PR stacked on a feature branch triggered nothing. The
  symptom here was not "no checks" but **partial green**: `peer-floor.yml` carries a
  `paths` filter and no branches filter, so a stacked PR touching a package manifest
  showed one passing check and no CI at all — which reads as success. Found only by
  enumerating the `on:` block of every workflow rather than the one named in the report,
  and witnessed with a throwaway stacked probe PR, since a PR based on `main` would have
  been green under the old filter too.

- **`check-architecture.mjs` explained itself with `noy-db-to`'s invariant.** Rule 3
  (`no-crypto-deps`) said *"stores see ciphertext only"* — false here, since `at-*` is
  the one family in the grammar that is **not** zero-knowledge, and it is the rule most
  likely to fire on a new package, so it taught the wrong invariant at the moment
  someone was looking straight at it. The reason is ownership: hub owns the primitives
  and exports them, and a provider hands key material to a KMS or keychain rather than
  reimplementing the envelope.

  Rule 2's header was worse — it read `to-only: store src may import @noy-db/hub ONLY
  via /to` and **contradicted the note five lines below it**, so the file asserted a
  rule and then denied it. Also `listStoreDirs` → `listProviderDirs`, that name being
  what kept generating store-flavoured prose.

- **`check-peer-floor.mjs` called these packages "stores".** They are sealing-key
  providers. In this family the prefix is the layer, not a naming convention, so
  the vocabulary is load-bearing rather than cosmetic.

### Changed

- **Two guards in the `notify-docs` job made reachable in the cases they name.**
  Neither could have shipped a wrong doc-sync issue — the step fails either way —
  but each was dead code in exactly the situation it was written for.

  *The empty-list guard could not fire on an empty glob* (**was live**). The list
  was built by globbing `at-*/package.json` and running node per match; with no
  matches bash leaves the glob literal, node throws `MODULE_NOT_FOUND`, and
  `set -euo pipefail` kills the step before `COUNT` is computed — a stack trace
  instead of the message written for the operator. Now enumerated inside node,
  and mutation-checked with controls: empty tree → the guard's own message;
  one package → `COUNT=1`; private-only → refused. The private exclusion is new
  behaviour: the root manifest is not published, so it must not be listed.

  *`| head -1` under `pipefail`* (**latent, not live**). `head` closing the pipe
  can SIGPIPE the producer, which `pipefail` propagates and `set -e` turns into
  exit 141. Replaced with a `jq`-side first-match, removing the pipe.

  ⚠️ **This one was never reachable here, and the first analysis overstated it.**
  `gh issue list --limit 20` emits at most ~100 bytes, and at 20 lines the
  construct exits 0 in 15 of 15 runs. The claim that it "would have died in the
  duplicate case" was mechanism-verified but consequence-unrun.

  ⚠️ **And the safety margin is a race, not a threshold — so it is stated as a
  condition, not a number.** Whether it fires depends on the producer still
  *writing* when `head` closes, which is scheduling rather than arithmetic. The
  onset is not portable: measured 15× per size on two machines, 100 lines failed
  13/15 on one and 0/15 on the other, whose onset sat near 8000 — about 40×
  apart. Two contradictory single samples of a race look exactly like two
  disagreeing measurements of a constant, and the tell is that the disagreement
  is over a number neither party repeated.

  The honest statement: **at `--limit 20` it did not fire in 30 runs across two
  machines, and any increase re-opens the question on every machine it runs on.**
  Do not read a safe size out of this paragraph — that is the mistake it exists
  to prevent.

  So the `jq` form is kept for a reason that survives: it depends on neither
  output size nor scheduling. The pipe form would begin failing intermittently,
  in the duplicate case only — the worst possible place for a latent bug — and
  the edit that would trigger it (raising `--limit`) is an entirely reasonable
  one.

### Removed

- **The `docs-bridge` job, which could never have run.** It invoked
  `scripts/docs-bridge/build-payload.mjs` and
  `scripts/__tests__/docs-bridge-capabilities.test.ts`, neither of which was
  extracted into this repo. Being `continue-on-error: true`, a release would have
  published, the job would have died at "Build payload", and **the run would
  still have reported green** — producing neither half of the proof pair.

  Porting the scripts was not the fix: noy-db-to's `build-payload.mjs` filters
  `d.name.startsWith('to-')`, which matches nothing here, so a verbatim port
  trades a job that fails green for one that fails red and still never notifies
  docs. The intended replacement is a direct `gh issue create` — what
  noy-db-docs actually consumes is the issue body. That replacement is now wired as the
  `notify-docs` job — see *Changed* below.

- **`DOCS_SYNC_TOKEN` is now optional.** `notify-docs` previously exited 1 the moment
  the token was absent, so every release without the PAT showed a red job and a
  *"noy-db-docs was NOT notified"* banner. The reasoning behind that hard failure — a
  bridge that quietly does nothing is the failure the job replaced — is met rather than
  discarded: the package delta is computed and written to the run summary **before** the
  token is consulted, so the no-token path is silent about nothing and only *delivery*
  is skipped. Erroring as well would show a red job for a missing optional credential on
  every release, which trains an operator to ignore the one that matters. The
  `COUNT == 0` guard still exits 1 — no packages found is a real defect, not a missing
  credential.

### Added

- **`pnpm version:set <version>`** — sets every package to one version and rewrites
  any internal range to match. It deliberately does **not** decide what the next
  version is or compare versions: core's own release comparator inverted semver in
  both directions, and 18 green releases could not have caught it because the
  faulty branch is unreachable until a pre line exits. Deciding is a human act;
  the machine's job is making the decision land everywhere.

- **`pnpm check:versions-uniform`** — every package on one version, every internal
  range admitting it. Written as an invariant over the output rather than a pinned
  string, so it is not edited every release. This is the guard a hand-run bump
  lacks: a partial bump builds, typechecks and tests green, and surfaces only at
  publish time. Runs in CI.

- **`pnpm check:not-already-published`** — refuses a version the registry already
  carries. The executable form of the family's *git is not npm* law, aimed at the
  direction that bit this repo: the registry running **ahead** of the source, which
  no local gate can see because every local gate reads only local state.

  It distinguishes three states, and the third is why it exists in this shape:
  `0` free, `1` already published, `2` **could not confirm** (registry unreachable).
  Collapsing "could not confirm" into "free" would let a network blip read as
  permission to publish.

  It runs on the **release path, not in CI**: between releases a repo's current
  version *is* published, so on a pull request it would be correctly and
  permanently red.

### Known

- **`at-azure-keyvault` binds no conformance kit.** The other four bind
  `@noy-db/test-sealer-conformance`. A green suite there is the same author
  checking their own reading, which is precisely what an external kit exists to
  break. Tracked as `noy-db-at#5`.

- **This repo ships no `docs-bridge.json`, so the centralized doc-sync cannot see it.**
  `noy-db-docs`' on-demand sync walks a range from a release's payload asset, and
  `docs.manifest.json` lists `as`/`on`/`at` as sources of nothing. That is why
  `notify-docs` exists and why deleting it would remove the warning along with the
  notification. Ruled at the root on 2026-09-05 (`lanna-db#17`): these three become real
  sources, `noy-db-docs` specs the payload contract first, and the payload lands before
  `notify-docs` retires. Not built here yet.
