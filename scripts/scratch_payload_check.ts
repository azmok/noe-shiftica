import dotenv from 'dotenv'

dotenv.config()

// DATABASE_URL is read from .env.local (dotenv) — never hardcode credentials here.

async function main() {
  try {
    console.log("Initializing dynamic imports...")
    const { getPayload } = await import('payload')
    const { default: configPromise } = await import('../src/payload.config')

    console.log("Initializing Payload...")
    const payload = await getPayload({ config: configPromise })
    console.log("Payload initialized. Querying tech-posts...")
    
    const postsRes = await payload.find({
      collection: 'tech-posts',
      where: {
        _status: {
          equals: 'published',
        },
      },
      sort: '-publishedAt',
      limit: 100,
      depth: 1,
      overrideAccess: true,
    })
    console.log("Success! Found:", postsRes.docs.length)
  } catch (error) {
    console.error("CRITICAL ERROR:")
    console.error(error)
  }
}

main()
