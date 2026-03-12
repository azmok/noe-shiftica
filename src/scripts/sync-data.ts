import { getPayload } from 'payload'
import config from '../payload.config'
import { Client } from 'pg'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const SOURCE_DATABASE_URL = process.env.SOURCE_DATABASE_URL
const TARGET_DATABASE_URL = process.env.DATABASE_URL
const SYNC_MODE = process.env.PAYLOAD_SYNC_MODE === 'true'

const DRY_RUN = process.env.DRY_RUN === 'true'

async function runSync() {
    if (!SOURCE_DATABASE_URL) {
        console.error('❌ SOURCE_DATABASE_URL is not set.')
        process.exit(1)
    }

    console.log('🚀 Starting PayloadCMS Data Sync...')
    if (DRY_RUN) console.log('⚠️  DRY RUN MODE ENABLED. No changes will be committed.')
    console.log(`Source DB: ${SOURCE_DATABASE_URL.substring(0, 30)}...`)
    console.log(`Target DB: ${TARGET_DATABASE_URL?.substring(0, 30)}...`)

    // Set sync mode to bypass hooks if needed
    process.env.PAYLOAD_SYNC_MODE = 'true'

    const payload = await getPayload({ config })

    const sourceClient = new Client({
        connectionString: SOURCE_DATABASE_URL,
    })

    try {
        await sourceClient.connect()
        console.log('✅ Connected to Source DB.')

        // 1. Fetch Posts from source
        console.log('Fetching posts from source...')
        const { rows: sourcePosts } = await sourceClient.query('SELECT * FROM posts')
        console.log(`Found ${sourcePosts.length} posts.`)

        for (const post of sourcePosts) {
            console.log(`Processing post: "${post.title}" (Slug: ${post.slug})...`)

            // Check if post exists in target
            const existing = await payload.find({
                collection: 'posts',
                where: {
                    slug: {
                        equals: post.slug,
                    },
                },
            })

            const postData = {
                title: post.title,
                slug: post.slug,
                content: post.content, 
                description: post.description,
                _status: post._status,
                publishedAt: post.published_at,
                customMetaData: post.custom_meta_data,
            }

            if (existing.docs.length > 0) {
                console.log(`   -> Found existing post (ID: ${existing.docs[0].id})`)
                if (!DRY_RUN) {
                    await payload.update({
                        collection: 'posts',
                        id: existing.docs[0].id,
                        data: postData,
                    })
                    console.log(`   ✅ Updated.`)
                } else {
                    console.log(`   [DRY] Would update.`)
                }
            } else {
                console.log(`   -> New post detected.`)
                if (!DRY_RUN) {
                    await payload.create({
                        collection: 'posts',
                        data: postData,
                    })
                    console.log(`   ✅ Created.`)
                } else {
                    console.log(`   [DRY] Would create.`)
                }
            }
        }

        console.log('✨ Sync completed successfully!')
    } catch (error) {
        console.error('❌ Sync failed:', error)
    } finally {
        await sourceClient.end()
        process.exit(0)
    }
}

runSync().catch(console.error)
