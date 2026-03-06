/**
 * translateToSlug
 *
 * Detects Japanese/CJK characters in a string. If found, translates to English
 * using Google Translate's public API (no API key required) and slugifies the result.
 * Falls back gracefully on any error.
 */

const CJK_REGEX = /[\u3000-\u9fff\uff00-\uffef\u3400-\u4dbf]/

/**
 * Sanitizes any string (English or translated) into a URL-safe slug.
 */
export function slugify(text: string): string {
    return text
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '') // remove non-alphanumeric (keep spaces and hyphens)
        .replace(/[\s_-]+/g, '-')      // collapse whitespace/underscores to hyphens
        .replace(/^-+|-+$/g, '')       // trim leading/trailing hyphens
}

/**
 * Returns true if the string contains CJK (Japanese / Chinese / Korean) characters.
 */
export function containsCJK(text: string): boolean {
    return CJK_REGEX.test(text)
}

/**
 * Translates a Japanese (or any CJK) string to English using Google Translate's
 * public endpoint (no API key needed), then slugifies.
 * Falls back to basic slugify on any error.
 */
export async function translateToSlug(title: string): Promise<string> {
    if (!containsCJK(title)) {
        // Already ASCII-friendly — just slugify directly
        return slugify(title)
    }

    try {
        const url =
            `https://translate.googleapis.com/translate_a/single` +
            `?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(title)}`

        const res = await fetch(url, {
            headers: {
                // Pretend to be a browser to avoid bot detection
                'User-Agent':
                    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
            },
        })

        if (!res.ok) {
            throw new Error(`Google Translate HTTP ${res.status}`)
        }

        // Response shape: [[["translated", "original", null, null, ...], ...], ...]
        const data = await res.json() as unknown[][]
        const chunks = data[0] as unknown[][]
        const translated = chunks
            .map((chunk) => (chunk[0] as string) ?? '')
            .join(' ')
            .trim()

        return slugify(translated) || 'untitled'
    } catch (err) {
        console.warn('[translateToSlug] Translation failed, falling back to raw slugify:', err)
        // Fallback: strip CJK chars and slugify whatever ASCII remains
        const stripped = title.replace(CJK_REGEX, ' ')
        return slugify(stripped) || 'untitled'
    }
}
