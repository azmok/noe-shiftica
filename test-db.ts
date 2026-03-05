
import { getPayload } from 'payload'
import config from './src/payload.config'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

async function testConnection() {
    console.log('Starting DB connection test...')
    console.log('DATABASE_URL starts with:', process.env.DATABASE_URL?.substring(0, 20))

    try {
        const payload = await getPayload({ config })
        console.log('Payload initialized successfully.')

        const posts = await payload.find({
            collection: 'posts',
            depth: 0,
        })

        console.log(`Connection successful! Found ${posts.totalDocs} posts.`)
        if (posts.docs.length > 0) {
            console.log('Sample post title:', posts.docs[0].title)
            console.log('Sample post status:', posts.docs[0]._status)
        }
    } catch (error) {
        console.error('Connection failed:', error)
    }
    process.exit(0)
}

testConnection()
