import type { CollectionConfig, Field } from 'payload'
import {
  API_CLIENTS_SLUG,
  MANAGED_COLLECTIONS,
  OPERATION_LABELS,
  isHumanUser,
  operationsFor,
  summarizePermissions,
} from './permissions'

/**
 * ApiClients — 「外部AI連携」コレクション。
 *
 * 1ドキュメント = 1つの外部AI（例: クラやん / Claude Code）。
 * - API キー専用の認証コレクション（パスワードログイン無し・管理画面にも入れない）。
 * - 発行した API キーで `Authorization: api-clients API-Key <キー>` を付けて REST を叩く。
 * - どのコレクションに何をしてよいかを、下のチェックボックスで管理する。
 * - このコレクション自体は人間の管理者（users）しか閲覧・編集できない。
 */

const permissionFields: Field[] = MANAGED_COLLECTIONS.map((c) => ({
  name: c.key,
  type: 'group',
  label: c.label,
  fields: [
    {
      type: 'row',
      fields: operationsFor(c).map((op) => ({
        name: op,
        type: 'checkbox',
        label: OPERATION_LABELS[op],
        defaultValue: false,
      })),
    },
  ],
}))

export const ApiClientsCollection: CollectionConfig = {
  slug: API_CLIENTS_SLUG,
  labels: {
    singular: '外部AI連携',
    plural: '外部AI連携',
  },
  admin: {
    useAsTitle: 'name',
    group: '設定',
    defaultColumns: ['name', 'enabled', 'permissionSummary', 'updatedAt'],
    description:
      'API キーで記事などを操作できる外部AIの一覧です。AIごとに API キーを発行し、触ってよい範囲をチェックボックスで決めます。',
  },
  auth: {
    useAPIKey: true,
    // パスワードでのログインは一切させない（API キー専用）
    disableLocalStrategy: true,
  },
  access: {
    // API クライアント自身が自分の権限を書き換えられないよう、人間の管理者だけに限定
    read: ({ req }) => isHumanUser(req.user),
    create: ({ req }) => isHumanUser(req.user),
    update: ({ req }) => isHumanUser(req.user),
    delete: ({ req }) => isHumanUser(req.user),
  },
  hooks: {
    beforeChange: [
      ({ data, originalDoc }) => {
        // 部分更新（name だけ PATCH 等）でも要約が消えないよう、元の権限にフォールバック
        if (data) {
          data.permissionSummary = summarizePermissions(data.permissions ?? originalDoc?.permissions)
        }
        return data
      },
    ],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      label: 'AIの名前',
      required: true,
      admin: {
        description: '例: クラやん（Claude Code）',
      },
    },
    {
      name: 'note',
      type: 'textarea',
      label: 'メモ',
      admin: {
        description: '用途や、どの環境にキーを置いているか など',
      },
    },
    {
      name: 'enabled',
      type: 'checkbox',
      label: '有効',
      defaultValue: true,
      admin: {
        position: 'sidebar',
        description: 'OFF にすると、権限設定に関係なくすべてのアクセスを拒否します。',
      },
    },
    {
      name: 'permissionSummary',
      type: 'text',
      label: '許可している操作',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: '保存時に下のチェックボックスから自動生成されます。',
      },
    },
    {
      name: 'permissions',
      type: 'group',
      label: 'アクセス権限',
      admin: {
        description:
          'チェックした操作だけを許可します（既定はすべて OFF）。「公開」が OFF だと下書きとしてしか保存できません。ここに無いコレクション（ユーザー・パスキー・この外部AI連携・AI API Logs など）には一切アクセスできません。⚠️ HTMLホスティング・埋め込みHTMLファイルの作成/編集、および記事のカスタムJS は、サイト上で任意の JavaScript を動かせるため実質的に管理者権限と同等です。信頼できるAIにだけ許可してください。',
      },
      fields: permissionFields,
    },
  ],
}
