import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const directory = fileURLToPath(new URL('.', import.meta.url))
const isDown = process.argv[2] === 'down'

// Do not resolve executables from npm's PATH, which includes repository bins.
const dockerLocations = {
  linux: ['/usr/bin/docker', '/usr/local/bin/docker'],
  darwin: ['/Applications/Docker.app/Contents/Resources/bin/docker'],
  win32: ['C:\\Program Files\\Docker\\Docker\\resources\\bin\\docker.exe'],
}
const fixedPaths = {
  linux: '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin',
  darwin: '/Applications/Docker.app/Contents/Resources/bin:/usr/bin:/bin:/usr/sbin:/sbin',
  win32: 'C:\\Program Files\\Docker\\Docker\\resources\\bin;C:\\Windows\\System32;C:\\Windows',
}
const dockerExecutable = dockerLocations[process.platform]?.find(existsSync)
if (!dockerExecutable) {
  console.error('Docker was not found in a supported system installation directory.')
  process.exit(1)
}

// Windows treats PATH names case-insensitively; remove every inherited spelling.
const childEnvironment = Object.fromEntries(
  Object.entries(process.env).filter(([name]) => name.toUpperCase() !== 'PATH'),
)
childEnvironment.PATH = fixedPaths[process.platform]

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
  dockerExecutable,
  ['compose', '-f', 'docker-compose.yml', ...args],
  {
    cwd: directory,
    env: childEnvironment,
    stdio: 'inherit',
  },
)
if (result.error) console.error(result.error.message)
process.exit(result.status ?? 1)
