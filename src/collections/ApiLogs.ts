import type { CollectionConfig } from 'payload'

export const ApiLogs: CollectionConfig = {
  slug: 'api-logs',
  labels: {
    singular: 'AI API Log',
    plural: 'AI API Logs',
  },
  admin: {
    useAsTitle: 'action',
    defaultColumns: ['createdAt', 'action', 'status', 'postTitle', 'responseStatus', 'errorMessage'],
    group: 'Logs',
    components: {
      beforeListTable: ['@/components/admin/ApiEndpointGuide#ApiEndpointGuide'],
    },
  },
  access: {
    // Admin users can read logs and delete old ones, but manual creation/editing from UI is disabled
    read: ({ req }) => Boolean(req.user),
    create: () => false,
    update: () => false,
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      name: 'action',
      type: 'select',
      required: true,
      options: [
        { label: 'POST (Create/Update)', value: 'post' },
        { label: 'DELETE', value: 'delete' },
      ],
      admin: {
        width: '30%',
      },
    },
    {
      name: 'status',
      type: 'select',
      required: true,
      options: [
        { label: 'Success', value: 'success' },
        { label: 'Error', value: 'error' },
      ],
      admin: {
        width: '30%',
      },
    },
    {
      name: 'responseStatus',
      type: 'number',
      admin: {
        width: '40%',
      },
    },
    {
      name: 'postTitle',
      type: 'text',
      admin: {
        width: '50%',
      },
    },
    {
      name: 'postSlug',
      type: 'text',
      admin: {
        width: '50%',
      },
    },
    {
      name: 'postId',
      type: 'text',
    },
    {
      name: 'clientIp',
      type: 'text',
      admin: {
        description: 'Client IP address or Source identifier',
      },
    },
    {
      name: 'requestSummary',
      type: 'textarea',
      admin: {
        rows: 4,
        description: 'Summary of the incoming request parameters (truncated if too long)',
      },
    },
    {
      name: 'errorMessage',
      type: 'textarea',
      admin: {
        rows: 4,
        condition: (data) => data?.status === 'error',
      },
    },
  ],
  timestamps: true,
}
