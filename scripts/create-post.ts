import { getPayload } from 'payload'
import configPromise from '../src/payload.config'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

async function createTestPost() {
  const payload = await getPayload({ config: configPromise })
  
  try {
    const post = await payload.create({
      collection: 'posts',
      data: {
        title: `Auto Test Post ${Date.now()}`,
        content: {
          root: {
            type: 'root',
            format: '',
            indent: 0,
            version: 1,
            children: [
              {
                type: 'paragraph',
                format: '',
                indent: 0,
                version: 1,
                children: [
                  {
                    detail: 0,
                    format: 0,
                    mode: 'normal',
                    style: '',
                    text: 'This is a test post created via Payload Local API.',
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
    
    console.log('Successfully created test post:', post.title, post.slug)
  } catch (err) {
    console.error('Error creating post:', err)
  }
}

createTestPost().then(() => process.exit(0))
