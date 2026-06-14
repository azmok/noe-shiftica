import { APIError, type CollectionConfig } from 'payload'

export const Users: CollectionConfig = {
  slug: 'users',
  admin: {
    useAsTitle: 'email',
  },
  auth: true,
  hooks: {
    // True 2FA enforcement: block password-only sessions from the native
    // `/api/users/login` endpoint. Real logins go through `/2fa-login`
    // (password + passkey), which mints the session directly and never hits
    // this operation. Break-glass: set DISABLE_2FA=true to allow password-only.
    afterLogin: [
      () => {
        if (process.env.DISABLE_2FA !== 'true') {
          throw new APIError(
            'このアカウントは2要素認証が必須です。/2fa-login からログインしてください。',
            403,
          )
        }
      },
    ],
  },
  fields: [
    // Email added by default
    // Add more fields as needed
    {
      name: 'logoutButton',
      type: 'ui',
      admin: {
        position: 'sidebar',
        components: {
          Field: '@/app/(frontend)/components/admin/LogoutButton#LogoutButton',
        },
      },
    },
    {
      name: 'passkeyRegister',
      type: 'ui',
      admin: {
        components: {
          Field: '@/components/admin/PasskeyRegisterButton#PasskeyRegisterButton',
        },
      },
    },
  ],
}
