/**
 * **@noy-db/at-gcp-kms** — Google Cloud KMS sealing key provider for noy-db
 * managed-secret mode.
 *
 * An `at-*` provider that seals and unseals the hub-generated random
 * secret via Google Cloud KMS Encrypt / Decrypt. Every seal and unseal is
 * an authenticated KMS API call, giving you a Cloud Audit Logs-backed access
 * log of every time a user's vault is opened — no additional instrumentation
 * required.
 *
 * ## When to use
 *
 * - Compliance regimes requiring auditable key access logs (FedRAMP, HIPAA
 *   with managed-encryption requirements, SOC 2 Type II).
 * - Workloads already running on GCP where a Cloud KMS key costs less than
 *   engineering an equivalent audit trail.
 * - Any case where you want automatic key rotation without rotating your
 *   app's sealing key material manually.
 *
 * ## Setup
 *
 * ```bash
 * # 1. Create a key ring and symmetric crypto key once:
 * gcloud kms keyrings create noy-db-ring --location global
 * gcloud kms keys create noy-db-sealing \
 *   --location global \
 *   --keyring noy-db-ring \
 *   --purpose encryption
 * # Note the full resource name from the output.
 *
 * # 2. Grant your host's service account the Cloud KMS CryptoKey Encrypter/Decrypter role:
 * gcloud kms keys add-iam-policy-binding noy-db-sealing \
 *   --location global \
 *   --keyring noy-db-ring \
 *   --member serviceAccount:HOST_SA@PROJECT.iam.gserviceaccount.com \
 *   --role roles/cloudkms.cryptoKeyEncrypterDecrypter
 * # Credentials are picked up automatically via Application Default Credentials
 * # (ADC): service account attached to GCE/GKE, GOOGLE_APPLICATION_CREDENTIALS
 * # env var, or `gcloud auth application-default login` for local dev.
 * ```
 *
 * ```ts
 * // 3. In your app:
 * import { createNoydb } from '@noy-db/hub'
 * import { atGcpKms } from '@noy-db/at-gcp-kms'
 * import { shamirRecoveryProvider } from '@noy-db/on-shamir'
 *
 * const db = await createNoydb({
 *   store,
 *   user: 'alice',
 *   secretMode: 'managed',
 *   sealingKey: atGcpKms({
 *     keyName: 'projects/my-project/locations/global/keyRings/noy-db-ring/cryptoKeys/noy-db-sealing',
 *   }),
 *   shamirRecovery: shamirRecoveryProvider(),
 * })
 * ```
 *
 * @packageDocumentation
 */

import type { NoydbSealer } from '@noy-db/hub/at'
import { KeyManagementServiceClient } from '@google-cloud/kms'
import type { protos } from '@google-cloud/kms'

type IEncryptRequest = protos.google.cloud.kms.v1.IEncryptRequest
type IDecryptRequest = protos.google.cloud.kms.v1.IDecryptRequest
type IEncryptResponse = protos.google.cloud.kms.v1.IEncryptResponse
type IDecryptResponse = protos.google.cloud.kms.v1.IDecryptResponse

/** Minimal client surface required by {@link atGcpKms}. */
interface KmsClientLike {
  encrypt(request: IEncryptRequest): Promise<[IEncryptResponse, IEncryptRequest | undefined, unknown]>
  decrypt(request: IDecryptRequest): Promise<[IDecryptResponse, IDecryptRequest | undefined, unknown]>
}

/** Options for {@link atGcpKms}. */
export interface AtGcpKmsOptions {
  /**
   * Full crypto-key resource name, e.g.
   * `projects/PROJECT/locations/LOCATION/keyRings/RING/cryptoKeys/KEY`.
   */
  readonly keyName: string
  /** Optional pre-built client (DI for tests). Default: `new KeyManagementServiceClient()` (ambient ADC). */
  readonly client?: KmsClientLike
}

function toUint8Array(value: Uint8Array | string | null | undefined): Uint8Array | undefined {
  if (value == null) return undefined
  if (value instanceof Uint8Array) return value
  // protobuf may return a base64 string in some environments
  return Buffer.from(value, 'base64')
}

/**
 * Build a {@link NoydbSealer} backed by Google Cloud KMS Encrypt / Decrypt.
 *
 * Credentials are resolved via Application Default Credentials (ADC) — attached
 * service accounts, `GOOGLE_APPLICATION_CREDENTIALS`, or local gcloud login.
 * Never pass raw credentials in the options; inject a pre-configured client for
 * non-default auth instead.
 *
 * @throws Error when KMS returns no ciphertext or no plaintext (guards
 * against unexpected SDK-response shapes).
 * Any KMS API error (PermissionDenied, NotFound, etc.) propagates as-is.
 */
export function atGcpKms(opts: AtGcpKmsOptions): NoydbSealer {
  const client: KmsClientLike = opts.client ?? new KeyManagementServiceClient()
  return {
    id: `gcp-kms:${opts.keyName}`,

    async seal(secret: Uint8Array, ctx?: VaultContext) {
      const [resp] = await client.encrypt({ name: opts.keyName, plaintext: secret, ...aad(ctx) })
      const blob = toUint8Array(resp?.ciphertext)
      if (!blob) throw new Error('@noy-db/at-gcp-kms: KMS encrypt returned no ciphertext')
      return ctx ? markVaultBound(blob) : blob
    },

    async unseal(blob: Uint8Array, ctx?: VaultContext) {
      const bound = isVaultBound(blob)
      if (bound && !ctx) {
        throw new Error('@noy-db/at-gcp-kms: sealed bytes are bound to a vault; unseal them with its context.')
      }
      const sealed = bound ? blob.subarray(VAULT_BOUND_MARKER.length) : blob
      const [resp] = await client.decrypt({ name: opts.keyName, ciphertext: sealed, ...aad(bound ? ctx : undefined) })
      const pt = toUint8Array(resp?.plaintext)
      if (!pt) throw new Error('@noy-db/at-gcp-kms: KMS decrypt returned no plaintext')
      return pt
    },
  }
}

/**
 * The vault a sealed blob belongs to (family#157). Structural rather than hub's
 * `SealContext` import, so this compiles against every hub the peer range admits
 * — hubs before 0.10.0-pre.2 never pass it, and the blob stays portable.
 */
type VaultContext = { readonly vault: string }

/**
 * A blob sealed WITH a vault context starts with this marker and is bound to
 * `ctx.vault`; a blob without it is portable — sealed with no context, or
 * before family#157 existed. Unseal reads the form off the BLOB, never off the
 * `ctx` argument: hub passes `{ vault }` when it reopens a vault sealed before
 * contexts existed, and binding on the argument would lock every such vault
 * out.
 * A pre-#157 blob's leading bytes are the service's ciphertext format; one that
 * happened to begin with the marker would fail to unseal.
 */
const VAULT_BOUND_MARKER = new Uint8Array([0xff, 0x00, 0x6e, 0x76])

function isVaultBound(sealed: Uint8Array): boolean {
  return sealed.length >= VAULT_BOUND_MARKER.length
    && VAULT_BOUND_MARKER.every((b, i) => sealed[i] === b)
}

function markVaultBound(inner: Uint8Array): Uint8Array {
  const out = new Uint8Array(VAULT_BOUND_MARKER.length + inner.length)
  out.set(VAULT_BOUND_MARKER, 0)
  out.set(inner, VAULT_BOUND_MARKER.length)
  return out
}

/** The vault as Cloud KMS additional authenticated data. */
function aad(ctx: VaultContext | undefined): { additionalAuthenticatedData?: Uint8Array } {
  return ctx ? { additionalAuthenticatedData: new TextEncoder().encode(`noydb:vault=${ctx.vault}`) } : {}
}
