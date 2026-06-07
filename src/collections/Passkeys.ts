import type { CollectionConfig } from 'payload'

/**
 * Stores WebAuthn (passkey) public-key credentials, one row per registered
 * device. Private keys never leave the user's device — we only keep the public
 * key + a replay-protection counter.
 *
 * These rows are written/updated exclusively by the server-side passkey
 * endpoints (`/api/passkey/*`) via the Local API with overridden access, so
 * create/update are closed to the public REST/GraphQL API.
 */
export const Passkeys: CollectionConfig = {
  slug: 'passkeys',
  admin: {
    useAsTitle: 'deviceLabel',
    defaultColumns: ['deviceLabel', 'user', 'createdAt'],
    group: 'Auth',
  },
  access: {
    read: ({ req }) => Boolean(req.user),
    create: () => false,
    update: () => false,
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true,
    },
    {
      // Base64URL-encoded credential ID returned by the authenticator.
      name: 'credentialID',
      type: 'text',
      required: true,
      unique: true,
      index: true,
    },
    {
      // Base64URL-encoded COSE public key bytes.
      name: 'publicKey',
      type: 'text',
      required: true,
    },
    {
      // Signature counter — must only ever increase (replay-attack guard).
      name: 'counter',
      type: 'number',
      required: true,
      defaultValue: 0,
    },
    {
      name: 'transports',
      type: 'json',
    },
    {
      name: 'deviceLabel',
      type: 'text',
    },
    {
      // 'singleDevice' | 'multiDevice' — reported by the authenticator.
      name: 'deviceType',
      type: 'text',
    },
    {
      name: 'backedUp',
      type: 'checkbox',
      defaultValue: false,
    },
  ],
}
