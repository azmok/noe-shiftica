import { Plugin } from 'payload'

export const autosavePlugin = (): Plugin => {
    return (config) => {
        config.collections = (config.collections || []).map((collection) => {
            if (collection.slug === 'posts') {
                collection.fields = [
                    {
                        name: 'autosaveUI',
                        type: 'ui',
                        admin: {
                            position: 'sidebar',
                            components: {
                                Field: '/plugins/autosave/AutosaveUI#AutosaveUI',
                            },
                        },
                    },
                    ...collection.fields,
                ]
            }
            return collection
        })

        return config
    }
}
