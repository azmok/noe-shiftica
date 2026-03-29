import {
  lexicalEditor,
  FixedToolbarFeature,
  HeadingFeature,
  LinkFeature,
  BoldFeature,
  ItalicFeature,
  ParagraphFeature,
  EXPERIMENTAL_TableFeature,
  HorizontalRuleFeature
} from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { gcsStorage } from '@payloadcms/storage-gcs'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Categories } from './collections/Categories'
import { Posts } from './collections/Posts'
import { HtmlFiles } from './collections/HtmlFiles'
import { markdownImportPlugin } from './plugins/markdownImport'
import { ogImagePlugin } from './plugins/og-image'
import { neonBackupPlugin } from './plugins/neon-backup'

import { MarkdownPasteFeature } from './features/markdownPaste/server'
import { HtmlSourceFeature } from './features/htmlSource/feature.server'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

const config = buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [Users, Media, Categories, Posts, HtmlFiles],
  editor: lexicalEditor({
    features: ({ defaultFeatures }) => [
      ...defaultFeatures,
      FixedToolbarFeature(),
      EXPERIMENTAL_TableFeature(),
      MarkdownPasteFeature(),
      HtmlSourceFeature(),
      HorizontalRuleFeature(),
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
    ogImagePlugin({
      collection: 'posts',
      heroImageField: 'heroImage',
      ogImageField: 'ogImage',
    }),
    neonBackupPlugin({
      collections: ['posts'],
    }),
  ],
}).catch(e => {
  console.error("PAYLOAD CONFIG ERROR:", e);
  throw e;
});

export default config;
