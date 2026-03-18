import Script from 'next/script'

export function JsonLd() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'LocalBusiness',
        '@id': 'https://noe-shiftica.com/#localbusiness',
        'name': 'Noe Shiftica',
        'url': 'https://noe-shiftica.com',
        'image': 'https://noe-shiftica.com/og-image.png',
        'address': {
          '@type': 'PostalAddress',
          'addressLocality': '渋谷区',
          'addressRegion': '東京都',
          'addressCountry': 'JP',
          'postalCode': '150-0043',
          'streetAddress': '道玄坂1丁目10番8号渋谷道玄坂東急ビル2F−C'
        },
        'geo': {
          '@type': 'GeoCoordinates',
          'latitude': 35.6581,
          'longitude': 139.6975,
        },
        'areaServed': [
          {
            '@type': 'AdministrativeArea',
            'name': '東京都',
          },
          {
            '@type': 'Country',
            'name': 'JP',
          },
        ],
        'description': 'Next.js, React, PayloadCMSを用いたWeb開発と生成AI導入支援を提供する東京都渋谷区のスタジオです。本質的なデザインと最新技術でビジネスの転換を設計します。',
        'priceRange': '¥150,000 - ¥1,000,000+',
        'knowsAbout': ['Next.js', 'React', 'PayloadCMS', 'Generative AI', 'Web Design'],
      },
      {
        '@type': 'Service',
        'serviceType': 'Web開発・生成AI導入支援',
        'provider': {
          '@id': 'https://noe-shiftica.com/#localbusiness',
        },
        'areaServed': {
          '@type': 'Country',
          'name': 'JP',
        },
        'hasOfferCatalog': {
          '@type': 'OfferCatalog',
          'name': 'サービスメニュー',
          'itemListElement': [
            {
              '@type': 'Offer',
              'itemOffered': {
                '@type': 'Service',
                'name': 'Next.js / React による高速フロントエンド開発',
              },
            },
            {
              '@type': 'Offer',
              'itemOffered': {
                '@type': 'Service',
                'name': 'PayloadCMS (v3) の導入・カスタマイズ',
              },
            },
            {
              '@type': 'Offer',
              'itemOffered': {
                '@type': 'Service',
                'name': '生成AIを活用した業務効率化・導入支援',
              },
            },
          ],
        },
      },
    ],
  }

  return (
    <Script
      id="json-ld"
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  )
}
