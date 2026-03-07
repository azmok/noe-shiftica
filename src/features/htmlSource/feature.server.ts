/**
 * htmlSourceFeature.server.ts
 *
 * PayloadCMS v3 / Lexical Editor
 * "Source (<>)" ツールバーボタン付き HTML 双方向編集 Feature
 *
 * サーバーサイドのFeature定義。
 * クライアントコンポーネント (feature.client.tsx) を参照する。
 */

import type { FeatureProviderProviderServer } from '@payloadcms/richtext-lexical'
import { createServerFeature } from '@payloadcms/richtext-lexical'

// ----------------------------------------------------------------
// Feature Definition
// ----------------------------------------------------------------

export const HtmlSourceFeature = createServerFeature({
    feature: {
        // クライアントバンドルへ渡す Feature 設定
        ClientFeature: '@/features/htmlSource/feature.client#HtmlSourceFeatureClient',

        // このFeatureが追加するノード型は無い（変換のみ）
        nodes: [],

        // i18n ラベル（任意）
        i18n: {
            en: { label: { toolbar: 'Source' } },
            ja: { label: { toolbar: 'ソース' } },
        },
    },
    // PayloadCMS が内部で使うユニークキー
    key: 'htmlSource',
})
