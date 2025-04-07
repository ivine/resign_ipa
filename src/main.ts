import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as fs from 'fs/promises'
import * as fssync from 'fs'
import * as path from 'path'
import * as os from 'os'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const __tmp_secrets_dir = path.join(__dirname, 'temp-secrets')

const noValueFlags = ['-a', '-d', '-f', '-w', '-2', '-q']

/**
 * 运行 zsign 进行重签名
 */
export async function run() {
  try {
    await fs.mkdir(__tmp_secrets_dir, { recursive: true })

    const zsignPath = getZSignPath()
    await checkFileExists(zsignPath)

    if (os.platform() !== 'win32') {
      await fs.chmod(zsignPath, 0o755)
    }

    await prepareSecrets()

    const args = getZSignArguments()
    core.info('🚀 Running zsign...')
    await exec.exec(zsignPath, args)
    core.info('✅ zsign execution completed.')
  } catch (error) {
    core.setFailed(
      `❌ ${error instanceof Error ? error.message : String(error)}`
    )
  } finally {
    await cleanup()
  }
}

/**
 * 准备 pkey, cert, prov 内容，写入临时目录
 */
async function prepareSecrets() {
  const pkey = core.getInput('pkey')
  if (pkey) {
    const pkeyPath = path.join(__tmp_secrets_dir, 'private.key')
    const buffer = Buffer.from(pkey, 'base64')
    await fs.writeFile(pkeyPath, buffer)
  }

  const cert = core.getInput('cert')
  if (cert) {
    const certPath = path.join(__tmp_secrets_dir, 'certificate.pem')
    const buffer = Buffer.from(cert, 'base64')
    await fs.writeFile(certPath, buffer)
  }

  const prov = core.getInput('prov')
  if (prov) {
    const contents = prov.split(',').map((p) => p.trim())
    for (let i = 0; i < contents.length; i++) {
      const content = contents[i]
      if (content.length === 0) {
        continue
      }
      const provPath = path.join(__tmp_secrets_dir, `prov_${i}.mobileprovision`)
      const buffer = Buffer.from(content, 'base64')
      await fs.writeFile(provPath, buffer, 'utf-8')
    }
  }
}

/**
 * 生成 zsign 参数
 */
function getZSignArguments(): string[] {
  const argMap: Record<string, string> = {
    pkey: '-k',
    cert: '-c',
    adhoc: '-a',
    debug: '-d',
    force: '-f',
    output: '-o',
    password: '-p',
    bundle_id: '-b',
    bundle_name: '-n',
    bundle_version: '-r',
    entitlements: '-e',
    zip_level: '-z',
    dylib: '-l',
    weak: '-w',
    temp_folder: '-t',
    sha256_only: '-2',
    quiet: '-q'
  }

  const args: string[] = []

  const appPath = core.getInput('app_path')
  if (!appPath) throw new Error('Missing required input: app_path')
  args.push(appPath)

  const outputPath = core.getInput('output_path')
  if (!outputPath) throw new Error('Missing required input: output_path')
  args.push('-o', outputPath)

  const provFiles = fssync
    .readdirSync(__tmp_secrets_dir)
    .filter((f) => f.endsWith('.mobileprovision'))
    .map((f) => path.join(__tmp_secrets_dir, f))

  for (const prov of provFiles) {
    args.push('-m', prov)
  }

  for (const [inputKey, cliFlag] of Object.entries(argMap)) {
    const value = core.getInput(inputKey)
    if (inputKey === 'pkey') {
      const pkeyPath = path.join(__tmp_secrets_dir, 'private.key')
      args.push('-k', pkeyPath)
    } else if (inputKey === 'cert') {
      const certPath = path.join(__tmp_secrets_dir, 'certificate.pem')
      args.push('-c', certPath)
    } else if (value) {
      args.push(cliFlag)
      if (!noValueFlags.includes(cliFlag)) {
        args.push(value)
      }
    }
  }

  return args
}

function getZSignPath(): string {
  const platform = os.platform()
  const arch = os.arch()
  let binaryName = ''

  if (platform === 'linux') {
    binaryName = 'zsign_linux'
  } else if (platform === 'darwin') {
    binaryName = arch === 'arm64' ? 'zsign_macos_apple_silicon' : 'zsign_macos'
  } else if (platform === 'win32') {
    binaryName = 'zsign_windows.exe'
  } else {
    throw new Error(`Unsupported platform: ${platform} ${arch}`)
  }

  const zsignPath = path.join(__dirname, 'zsign', binaryName)
  core.info(`Detected system: ${platform} (${arch}), using ${binaryName}`)
  return zsignPath
}

async function checkFileExists(filePath: string): Promise<void> {
  try {
    await fs.access(filePath)
  } catch {
    throw new Error(`File not found: ${filePath}`)
  }
}

async function cleanup() {
  try {
    await fs.rm(__tmp_secrets_dir, { recursive: true, force: true })
    core.info('🧹 Cleaned up temporary secrets.')
  } catch (err) {
    core.warning(`Failed to clean up temp directory: ${err}`)
  }
}
