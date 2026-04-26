#!/usr/bin/env node
import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

const specPath = resolve(process.argv[2] ?? 'openapi/worklog.json')
const raw = await readFile(specPath, 'utf8')
const spec = JSON.parse(raw)

const schemes = spec?.components?.securitySchemes
if (schemes && typeof schemes === 'object') {
    for (const [key, scheme] of Object.entries(schemes)) {
        if (scheme?.type === 'http' && 'name' in scheme) {
            delete scheme.name
            console.log(`sanitize-openapi: removed invalid 'name' from securitySchemes.${key}`)
        }
    }
}

await writeFile(specPath, JSON.stringify(spec, null, 2) + '\n', 'utf8')
console.log(`sanitize-openapi: wrote ${specPath}`)
