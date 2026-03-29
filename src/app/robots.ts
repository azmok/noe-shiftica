import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin',
        '/_payload',
        '/api',
        '/next-api',
      ],
    },
    sitemap: 'https://noe-shiftica.com/sitemap.xml',
  }
}
