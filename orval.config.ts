import { defineConfig } from 'orval'

export default defineConfig({
    worklog: {
        input: {
            target: './openapi/worklog.json',
        },
        output: {
            target: './src/api/generated/endpoints.ts',
            schemas: './src/api/generated/schemas',
            client: 'react-query',
            mode: 'tags-split',
            httpClient: 'axios',
            clean: true,
            override: {
                mutator: {
                    path: './src/api/mutator.ts',
                    name: 'customInstance',
                },
                query: {
                    useQuery: true,
                    useInfinite: false,
                    useMutation: true,
                    signal: true,
                },
            },
        },
    },
    worklogZod: {
        input: {
            target: './openapi/worklog.json',
        },
        output: {
            target: './src/api/generated/zod',
            client: 'zod',
            mode: 'tags-split',
            fileExtension: '.zod.ts',
            clean: true,
        },
    },
})
