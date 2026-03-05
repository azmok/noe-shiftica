import { Pool } from 'pg'

// Singleton pool reused across requests  
let pool: Pool | null = null

function getPool(): Pool {
    if (!pool) {
        pool = new Pool({
            connectionString: process.env.DATABASE_URL,
        })
    }
    return pool
}

export type PostStatus = 'published' | 'draft'

export interface PostSummary {
    id: number
    title: string
    slug: string
    status: PostStatus
    publishedAt: string | null
    heroUrl: string | null
    coverUrl: string | null
}

/**
 * Fetch all posts directly from the DB, filtered by status.
 * This bypasses Payload CMS's draft versioning system.
 */
export async function getPostsByStatus(status: PostStatus = 'published'): Promise<PostSummary[]> {
    const db = getPool()
    const { rows } = await db.query<PostSummary>(
        `SELECT
       p.id,
       p.title,
       p.slug,
       p._status  AS status,
       p.published_at AS "publishedAt",
       m.url  AS "heroUrl",
       m2.url AS "coverUrl"
     FROM posts p
     LEFT JOIN media m  ON p.hero_image_id  = m.id
     LEFT JOIN media m2 ON p.cover_image_id = m2.id
     WHERE p._status = $1
     ORDER BY p.published_at DESC NULLS LAST`,
        [status],
    )
    return rows
}
