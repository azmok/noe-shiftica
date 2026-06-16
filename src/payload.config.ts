import {
  lexicalEditor,
  FixedToolbarFeature,
  HeadingFeature,
  LinkFeature,
  BoldFeature,
  ItalicFeature,
  ParagraphFeature,
  EXPERIMENTAL_TableFeature,
  HorizontalRuleFeature,
  BlocksFeature,
} from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { gcsStorage } from '@payloadcms/storage-gcs'
import { resendAdapter } from '@payloadcms/email-resend'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Categories } from './collections/Categories'
import { Posts } from './collections/Posts'
import { TechPosts } from './collections/TechPosts'
import { Passkeys } from './collections/Passkeys'
import { HostedApps } from './collections/HostedApps'
import { markdownImportPlugin } from './plugins/markdownImport'
import { htmlFileManagerPlugin } from './plugins/html-file-manager'
import { aiContentOptimizerPlugin } from './plugins/aiContentOptimizer'
import { autosavePlugin } from './plugins/autosave'
import { slugTrackerPlugin } from './plugins/slugTracker'
import { markdownCopyPlugin } from './plugins/markdownCopyPlugin'
import { ogImageAutoFillPlugin } from './plugins/ogImageAutoFill'

import { neonBackupPlugin } from './plugins/neon-backup'
import { panelResizerPlugin } from './plugins/panelResizer'

import { MarkdownPasteFeature } from './features/markdownPaste/server'
import { HtmlSourceViewerFeature } from './plugins/htmlSourceViewer/feature.server'
import { TextStyleFeature } from './plugins/textStyle/feature.server'
import { SearchReplaceFeature } from './plugins/searchReplace/feature.server'
import { CustomCodeBlock } from '@/features/customCodeBlock'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// Dummy configuration to force Payload's importMap static generator to detect BlocksFeature.
// This resolves the runtime "Cannot read properties of undefined (reading 'blockReferences')" crash
// by ensuring BlocksFeatureClient is written into importMap.js during build/dev steps.
const _dummyForStaticAnalysis = lexicalEditor({
  features: [
    BlocksFeature({
      blocks: [CustomCodeBlock],
    }),
    TextStyleFeature(),
    SearchReplaceFeature(),
  ]
})

const configPromise = buildConfig({
  serverURL: process.env.PAYLOAD_PUBLIC_SERVER_URL || process.env.NEXT_PUBLIC_SERVER_URL || (process.env.NODE_ENV === 'production' ? 'https://noe-shiftica.com' : 'http://localhost:3000'),
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
      // BlocksFeature's ClientFeature is not auto-detected by generate:importmap (Payload v3 limitation).
      // Self-deleting: adds BlocksFeatureClient, then sets generators=[] so HMR reload requests
      // see an empty (serializable) array instead of a function.
      generators: [({ addToImportMap, config: cfg }: { addToImportMap: (c: string) => void; config: any }) => {
        addToImportMap('@payloadcms/richtext-lexical/client#BlocksFeatureClient')
        addToImportMap('@/plugins/textStyle/feature.client#TextStyleFeatureClient')
        addToImportMap('@/plugins/searchReplace/feature.client#SearchReplaceFeatureClient')
        if (cfg?.admin?.importMap) cfg.admin.importMap.generators = []
      }],
    },
    components: {
      // Client-side image compression before upload + progress bar overlay
      providers: [
        '@/components/admin/ImageCompressionProvider#ImageCompressionProvider',
      ],
      // Passwordless "Sign in with passkey" button under the login form
      afterLogin: [
        '@/components/admin/PasskeyLoginButton#PasskeyLoginButton',
      ],
    },
  },
  // Email transport via Resend — required for "Forgot Password" to actually send
  email: resendAdapter({
    defaultFromAddress: 'noreply@noe-shiftica.com',
    defaultFromName: 'Noe Shiftica',
    apiKey: process.env.RESEND_API_KEY || '',
  }),
  collections: [Users, Media, Categories, Posts, TechPosts, Passkeys, HostedApps],
  blocks: [CustomCodeBlock],
  editor: lexicalEditor({
    features: ({ defaultFeatures }) => [
      // Disable the floating inline (hover) toolbar — it pops up over the
      // selected text and hides it. All controls live in the always-visible
      // fixed toolbar (FixedToolbarFeature) instead.
      ...defaultFeatures.filter((f) => f.key !== 'toolbarInline'),
      FixedToolbarFeature(),
      EXPERIMENTAL_TableFeature(),
      MarkdownPasteFeature(),
      HtmlSourceViewerFeature(),
      TextStyleFeature(),
      SearchReplaceFeature(),
      HorizontalRuleFeature(),
      BlocksFeature({
        blocks: [CustomCodeBlock],
      }),
    ],
  }),
  secret: process.env.PAYLOAD_SECRET || 'dummy-secret-key-for-build-bypass-only-xxx',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || '',
    },
  }),
  // Payload v3.79.0 bug workaround: createClientConfig passes admin.importMap (including generators
  // functions) to RootProvider (Client Component), causing a serialization error on initial page load.
  // generateImportMap runs in reload() (HMR) but NOT in init() (initial startup). So on initial
  // startup, generators are never self-deleted. This onInit hook deletes them before any request
  // reaches createClientConfig. Self-deletion in the generator handles the HMR reload case.
  onInit: async (payload) => {
    // Preserve generators when generating the importMap via CLI/scripts to ensure all FeatureClients are written
    const isGeneratingImportMap = process.argv.some(
      (arg) => arg.includes('generate:importmap') || arg.includes('importmap') || arg.includes('importMap')
    )
    if (!isGeneratingImportMap && payload.config?.admin?.importMap) {
      delete (payload.config.admin.importMap as any).generators
    }
  },
  sharp,
  plugins: [
    gcsStorage({
      collections: {
        media: true,
        'html-files': true,
      },
      bucket: process.env.GCS_BUCKET || (process.env.FIREBASE_CONFIG ? JSON.parse(process.env.FIREBASE_CONFIG).storageBucket : 'noe-shiftica.firebasestorage.app'),
      options: {
        projectId: process.env.GCS_PROJECT_ID || (process.env.FIREBASE_CONFIG ? JSON.parse(process.env.FIREBASE_CONFIG).projectId : 'noe-shiftica'),
        // In Firebase App Hosting, Application Default Credentials are used automatically, so omit keyFilename if not defined locally
        ...(process.env.GCS_KEYFILE_PATH ? { keyFilename: process.env.GCS_KEYFILE_PATH } : {}),
      },
    }),
    markdownImportPlugin(),
    aiContentOptimizerPlugin({ collections: ['posts', 'tech-posts'] }),
    autosavePlugin(),
    slugTrackerPlugin({ collections: ['posts', 'tech-posts'] }),
    markdownCopyPlugin({ collections: ['posts', 'tech-posts'] }),
    ogImageAutoFillPlugin({ collections: ['posts', 'tech-posts'] }),

    neonBackupPlugin({
      collections: ['posts', 'tech-posts'],
    }),
    panelResizerPlugin(),
    htmlFileManagerPlugin(),
  ],
});

// Safely delete non-serializable generators function from the resolved config
// to prevent Next.js React Server Component serialization errors during HMR/runtime.
const config = configPromise.then((resolvedConfig) => {
  const isGeneratingImportMap = process.argv.some(
    (arg) => arg.includes('generate:importmap') || arg.includes('importmap') || arg.includes('importMap')
  )
  if (!isGeneratingImportMap && resolvedConfig.admin?.importMap) {
    delete (resolvedConfig.admin.importMap as any).generators;
  }
  return resolvedConfig;
}).catch(e => {
  console.error("PAYLOAD CONFIG ERROR:", e);
  throw e;
});

export default config;
