'use client'

import React, { useEffect, useRef } from 'react'
import { useField, useFormFields } from '@payloadcms/ui'

export const OgImageField: React.FC = () => {
    const { value: ogImage, setValue: setOgImage } = useField<string>({ path: 'ogImage' })
    const heroImage = useFormFields(([fields]) => fields['heroImage']?.value)

    const prevHeroImage = useRef<any>(undefined)

    useEffect(() => {
        if (!heroImage) {
            prevHeroImage.current = heroImage
            return
        }

        if (heroImage === prevHeroImage.current) {
            return
        }
        prevHeroImage.current = heroImage

        const heroImageId = typeof heroImage === 'object' ? (heroImage as any).id : heroImage

        // Fetch the media document to get the OG size URL
        fetch(`/api/media/${heroImageId}`)
            .then(res => res.json())
            .then(data => {
                if (data && data.sizes && data.sizes.og && data.sizes.og.url) {
                    setOgImage(data.sizes.og.url)
                } else if (data && data.url) {
                    setOgImage(data.url)
                }
            })
            .catch(err => {
                console.error('[OgImageField] error fetching media:', err)
            })

    }, [heroImage, setOgImage])

    return (
        <div className="field-type text">
            <label className="field-label" htmlFor="field-ogImage">
                OG画像URL
            </label>
            <input
                id="field-ogImage"
                type="text"
                className="field-type__input"
                value={ogImage ?? ''}
                readOnly
                placeholder="Hero Imageから自動生成されます"
                style={{ background: 'var(--theme-elevation-50)', color: 'var(--theme-elevation-500)' }}
            />
            <div className="field-description" style={{ marginTop: '4px', fontSize: '13px', color: 'var(--theme-elevation-400)' }}>
                記事公開時、またはHero Image選択時に自動生成されます。
            </div>
        </div>
    )
}
