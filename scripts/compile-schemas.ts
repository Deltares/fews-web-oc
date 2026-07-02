import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { DefaultUserSettingsSchema } from '../src/schemas/default-user-settings.typebox'

const currentDir = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(currentDir, '..')

const schemaOutputPath = join(projectRoot, 'schemas', 'default-user-settings.schema.json')

const jsonSchemaOutput = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  ...DefaultUserSettingsSchema,
}

mkdirSync(dirname(schemaOutputPath), { recursive: true })

writeFileSync(schemaOutputPath, `${JSON.stringify(jsonSchemaOutput, null, 2)}\n`, 'utf8')

console.log(`Schema written to ${schemaOutputPath}`)
