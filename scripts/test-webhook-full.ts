import * as dotenv from 'dotenv'
const dotenvResult = dotenv.config({ path: '.env.local' })
if (dotenvResult.error) {
  console.error('Dotenv error:', dotenvResult.error)
}

// Strip quotes from environment variables if present (common issue in custom scripts)
for (const key in process.env) {
  const val = process.env[key]
  if (val) {
    if (val.startsWith("'") && val.endsWith("'")) {
      process.env[key] = val.slice(1, -1)
    } else if (val.startsWith('"') && val.endsWith('"')) {
      process.env[key] = val.slice(1, -1)
    }
  }
}

import { getPayload } from 'payload'

console.log('Debug - DATABASE_URL in process.env:', process.env.DATABASE_URL)
console.log('Debug - REVALIDATE_SECRET in process.env:', process.env.REVALIDATE_SECRET)

async function testWebhookLifecycle() {
  console.log('--- Initializing Payload ---')
  // Dynamically import config to ensure environment variables are loaded first
  const configPromise = (await import('../src/payload.config')).default
  const payload = await getPayload({ config: configPromise })
  
  const testTitle = `Webhook Test Post ${Date.now()}`
  let createdPostId: string | number = ''
  let createdPostSlug = ''

  try {
    // 1. CREATE as published
    console.log('\n--- 1. Creating Published Post ---')
    // @ts-ignore
    const post = await payload.create({
      collection: 'posts',
      data: {
        title: testTitle,
        content: {
          root: {
            type: 'root',
            direction: null,
            format: '',
            indent: 0,
            version: 1,
            children: [
              {
                type: 'paragraph',
                direction: null,
                format: '',
                indent: 0,
                version: 1,
                children: [
                  {
                    detail: 0,
                    format: 0,
                    mode: 'normal',
                    style: '',
                    text: 'This is a test post for testing Webhook lifecycle.',
                    type: 'text',
                    version: 1,
                  },
                ],
              },
            ],
          },
        },
        _status: 'published',
        publishedAt: new Date().toISOString(),
      },
    })
    createdPostId = post.id
    createdPostSlug = post.slug
    console.log(`Created Post ID: ${createdPostId}, Slug: ${createdPostSlug}`)

    // 2. UPDATE to draft
    console.log('\n--- 2. Updating Post to Draft ---')
    const updatedPost = await payload.update({
      collection: 'posts',
      id: createdPostId,
      data: {
        _status: 'draft',
      },
    })
    console.log(`Updated Post Status: ${updatedPost._status}`)

    // 3. DELETE the post
    console.log('\n--- 3. Deleting Post ---')
    const deletedPost = await payload.delete({
      collection: 'posts',
      id: createdPostId,
    })
    console.log(`Deleted Post ID: ${deletedPost.id}`)
    
    console.log('\n--- Webhook Lifecycle Test Finished Successfully! ---')
  } catch (err) {
    console.error('Error during lifecycle test:', err)
  }
}

testWebhookLifecycle().then(() => process.exit(0))
