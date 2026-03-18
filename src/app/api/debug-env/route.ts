import { getPayload } from 'payload'
import config from '@/payload.config'

export async function GET() {
  const payload = await getPayload({ config })
  const allPosts = await payload.find({
    collection: 'posts',
    limit: 100,
    overrideAccess: true, // See drafts too
  })
  
  return Response.json({
    DATABASE_URL: process.env.DATABASE_URL ? `${process.env.DATABASE_URL.substring(0, 30)}...` : 'UNDEFINED',
    total_posts: allPosts.totalDocs,
    all_titles: allPosts.docs.map(d => `[${d._status}] ${d.title}`)
  });
}
