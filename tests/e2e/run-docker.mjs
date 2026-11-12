import { spawnSync } from 'node:child_process'
import { mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const directory = fileURLToPath(new URL('.', import.meta.url))
const isDown = process.argv[2] === 'down'

// Create bind mounts as the invoking developer, rather than Docker's root user.
if (!isDown) {
  for (const path of ['playwright-report', 'test-results']) {
    mkdirSync(new URL(`./${path}/`, import.meta.url), { recursive: true })
  }
}

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
