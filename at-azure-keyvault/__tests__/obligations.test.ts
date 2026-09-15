/**
 * at-azure-keyvault delegates to Key Vault wrapKey/unwrapKey, so the
 * cryptographic contract is the service's. These pin the two obligations that
 * are this package's own: surface a failure, and never fabricate output.
 *
 * Why the full `runSealerConformanceTests` suite is NOT run here: the
 * properties it asserts — refusing tampered, foreign or garbage input — are
 * the service's behaviour for a delegating provider. Standing a fake Key Vault
 * in front of it would test the fake. That is the kit's own reasoning, and it
 * is why the three cloud providers take the obligations entry point and the
 * two local providers take the conformance one.
 */
import { runDelegatingSealerObligations } from '@noy-db/test-sealer-conformance'
import { atAzureKeyvault } from '../src/index.js'

const keyId = 'https://my-vault.vault.azure.net/keys/noydb-sealing/abc123'

const rejecting = {
  encrypt: async () => { throw new Error('KeyVault: Forbidden') },
  decrypt: async () => { throw new Error('KeyVault: Forbidden') },
}

// Resolves, but carries no `result` — the case where fabricating empty bytes
// would hand hub a "secret" nobody sealed.
const empty = { encrypt: async () => ({}), decrypt: async () => ({}) }

runDelegatingSealerObligations('at-azure-keyvault', {
  rejecting: () => atAzureKeyvault({ keyId, cryptographyClient: rejecting as never }),
  empty: () => atAzureKeyvault({ keyId, cryptographyClient: empty as never }),
})
