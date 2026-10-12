# `@noy-db/at-*` — sealing-key providers for noy-db

The **`at-` family**: *sealed **at** a trusted host*. Each package hands hub a key to seal with,
bound to the published `@noy-db/hub/at` port.

⚠️ **This is the one family in the noy-db grammar that is NOT zero-knowledge.** A host you control
can decrypt the slice it unseals — that is the point of it, and the reason the prefix is a layer
rather than a naming convention. Everything else (`to-`, `in-`, `on-`, `by-`) never sees key
material it can use; these providers do, in a scoped way.

| package | host |
|---|---|
| `at-aws-kms` · `at-gcp-kms` · `at-azure-keyvault` | cloud KMS |
| `at-macos-keychain` | OS keychain |
| `at-env` | environment variable — for development and CI |

Extracted from the `noy-db` monorepo so hub can iterate without republishing this family.

## Binding

Every member declares `@noy-db/hub` as a caret-ranged **peer** and imports `@noy-db/hub/at`. None
imports the store contract — a sealing provider yields a key; it never touches storage.

```bash
npm i @noy-db/hub @noy-db/at-aws-kms
```

## Develop

```bash
pnpm install && pnpm build && pnpm test && pnpm lint && pnpm typecheck && pnpm typecheck:test
```

The family gates (`architecture`, `peer-floor` and the rest listed in `family.config.json`) run in
CI from the shared release rail; this repo keeps no local copy of them.

Tests run against **no real cloud service** — every provider is mock-tested, and a few
credential-gated cases skip by design (the same ones skip in the monorepo).

## Coverage

All five bind the published conformance kit at `@noy-db/ports/at`, through two entry points:
`at-env` and `at-macos-keychain` run the full `runSealerConformanceTests` (the crypto is theirs);
the three cloud providers run `runDelegatingSealerObligations`, because their crypto is the
service's — a fake KMS behind the full suite would test the fake.

Publishing happens from a **GitHub Release** triggering `release.yml`, never a raw `npm publish`.
Pre-1.0: public APIs may still change.
