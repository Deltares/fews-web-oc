import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { format, resolveConfig } from 'prettier'

import { DefaultUserSettingsSchema } from '../src/schemas/default-user-settings.typebox.ts'

const currentDir = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(currentDir, '..')

const schemaOutputPath = join(
  projectRoot,
  'schemas',
  'default-user-settings.schema.json',
)

const jsonSchemaOutput = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  ...DefaultUserSettingsSchema,
}

mkdirSync(dirname(schemaOutputPath), { recursive: true })

// Format like the rest of the repository, so `npm run lint` passes.
const formatted = await format(JSON.stringify(jsonSchemaOutput), {
  ...(await resolveConfig(schemaOutputPath)),
  filepath: schemaOutputPath,
})

writeFileSync(schemaOutputPath, formatted, 'utf8')

console.log(`Schema written to ${schemaOutputPath}`)
