import * as core from '@actions/core'
import * as exec from '@actions/exec'
import * as fs from 'fs'
import * as path from 'path'
import * as os from 'os'
import { fileURLToPath } from 'url'

/**
 * 运行 zsign 进行重签名
 */
export async function run() {
  try {
    const zsignPath = getZSignPath()
    await checkFileExists(zsignPath)

    // 确保 zsign 可执行（Windows 不需要）
    if (os.platform() !== 'win32') {
      fs.chmodSync(zsignPath, 0o755)
    }

    core.info('Running zsign...')
    const args = getZSignArguments()

    await exec.exec(zsignPath, args)
    core.info(`✅ zsign execution completed.`)
  } catch (error) {
    core.setFailed(
      `❌ ${error instanceof Error ? error.message : String(error)}`
    )
  }
}

/**
 * 根据当前操作系统和架构选择合适的 zsign 可执行文件
 */
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

  const __filename = fileURLToPath(import.meta.url)
  const __dirname = path.dirname(__filename)

  const zsignPath = path.join(__dirname, 'zsign', binaryName)
  core.info(`Detected system: ${platform} (${arch}), using ${binaryName}`)
  return zsignPath
}

/**
 * 确保文件存在，否则抛出错误
 */
async function checkFileExists(filePath: string): Promise<void> {
  if (filePath && !fs.existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`)
  }
}

/**
 * 解析 GitHub Action 的 inputs 并映射到 zsign 参数
 */
function getZSignArguments(): string[] {
  const argMap: { [key: string]: string } = {
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

  // 获取并验证必填项 app_path 和 output_path
  const appPath = core.getInput('app_path')
  if (!appPath) {
    throw new Error('Missing required input: app_path')
  }
  args.push(appPath)

  const outputPath = core.getInput('output_path')
  if (!outputPath) {
    throw new Error('Missing required input: output_path')
  }
  args.push('-o', outputPath)

  // 处理 prov 输入项，支持多个值
  const prov = core.getInput('prov')
  if (prov) {
    const provPaths = prov.split(',').map((p) => p.trim())
    for (const provPath of provPaths) {
      args.push('-m', provPath)
    }
  }

  // 遍历 argMap，根据输入映射生成 zsign 参数
  for (const [inputKey, cliFlag] of Object.entries(argMap)) {
    const value = core.getInput(inputKey)

    // 如果输入值存在，将对应的参数添加到 args 中
    if (value) {
      args.push(cliFlag)

      // 如果参数不需要附加值（如 flag 参数 -a, -d 等），则跳过附加值
      const noValueFlags = ['-a', '-d', '-f', '-w', '-2', '-q']
      if (!noValueFlags.includes(cliFlag)) {
        args.push(value)
      }
    }
  }

  return args
}
