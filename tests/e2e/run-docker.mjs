import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const directory = fileURLToPath(new URL('.', import.meta.url))
const isDown = process.argv[2] === 'down'

const args = isDown
  ? ['down']
  : [
      'up',
      '--build',
      '--abort-on-container-exit',
      '--exit-code-from',
      'playwright',
    ]
const result = spawnSync(
  'docker',
  ['compose', '-f', 'docker-compose.yml', ...args],
  {
    cwd: directory,
    env: process.env,
    stdio: 'inherit',
  },
)
if (result.error) console.error(result.error.message)
process.exit(result.status ?? 1)
