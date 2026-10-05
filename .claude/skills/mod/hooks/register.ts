import type { EngineInterface, Register } from 'claude-code'

import { numbersFromAnswer, parseArgs } from './parse'

// /mod：列出所有找得到的 mod，用編號選擇（可複選）後在本 session 啟用。
//
// 找 mod 的地方（每個 mod 是含有 .claude-plugin/plugin.json 的資料夾）：
//   <設定資料夾>/mods/<名稱>/          自己收藏的 mod
//   <設定資料夾>/dev-mods/<其他 session>/<名稱>/   其他對話框做的 mod
//   <專案>/mods/<名稱>/                跟著 repo 走的 mod
// 啟用 = 複製到 <設定資料夾>/dev-mods/<本 session>/<名稱>/，由熱重載載入。
// 停用 = 把那份複本的 hooks.json 清成沒有模組（API 不能刪檔）。

type Mod = { name: string; description: string; dir: string; mtimeMs: number }

const SELF = 'mod'
const SKIP_DIRS = new Set(['types', 'node_modules', '.git'])
const TEXT_FILE = /\.(tsx?|jsx?|mjs|cjs|mts|cts|json|md|txt|css|html|svg|ya?ml)$/i
const OFF_HOOKS = '{ "modules": [] }\n'

const slash = (path: string) => path.replace(/\\/g, '/').replace(/\/+$/, '')

async function configDir($: EngineInterface): Promise<string> {
  const custom = await $.env.get('CLAUDE_CONFIG_DIR')
  if (custom) return slash(custom)
  const home = (await $.env.get('HOME')) ?? (await $.env.get('USERPROFILE')) ?? ''

  return `${slash(home)}/.claude`
}

async function subdirs($: EngineInterface, dir: string) {
  const entries = await $.fs.list(dir).catch(() => [])

  return entries.filter(entry => entry.kind === 'dir').map(entry => `${dir}/${entry.name}`)
}

async function readMod($: EngineInterface, dir: string): Promise<Mod | undefined> {
  const manifest = `${dir}/.claude-plugin/plugin.json`
  try {
    const json = JSON.parse(await $.fs.read(manifest)) as { name?: string; description?: string }
    const { mtimeMs } = await $.fs.stat(manifest)
    if (!json.name || json.name === SELF) return undefined

    return { name: json.name, description: json.description ?? '', dir, mtimeMs }
  } catch {
    return undefined
  }
}

async function activeDir($: EngineInterface): Promise<string> {
  return `${await configDir($)}/dev-mods/${await $.session.id()}`
}

async function findMods($: EngineInterface): Promise<Mod[]> {
  const config = await configDir($)
  const mine = await activeDir($)
  const folders = [
    ...(await subdirs($, `${config}/mods`)),
    ...(await subdirs($, `${slash(await $.session.root())}/mods`)),
  ]
  for (const session of await subdirs($, `${config}/dev-mods`)) {
    if (session !== mine) folders.push(...(await subdirs($, session)))
  }

  // 同名的 mod 只留最新的那一份，依名稱排序讓編號固定
  const byName = new Map<string, Mod>()
  for (const dir of folders) {
    const mod = await readMod($, dir)
    const kept = mod && byName.get(mod.name)
    if (mod && (!kept || mod.mtimeMs > kept.mtimeMs)) byName.set(mod.name, mod)
  }

  return [...byName.values()].sort((a, b) => a.name.localeCompare(b.name))
}

async function isActive($: EngineInterface, mod: Mod): Promise<boolean> {
  const hooks = `${await activeDir($)}/${mod.name}/hooks/hooks.json`
  try {
    const { modules } = JSON.parse(await $.fs.read(hooks)) as { modules?: unknown[] }

    return Array.isArray(modules) && modules.length > 0
  } catch {
    return false
  }
}

async function copyDir($: EngineInterface, from: string, to: string, skipped: string[]) {
  for (const entry of await $.fs.list(from)) {
    const source = `${from}/${entry.name}`
    if (entry.kind === 'dir' && !SKIP_DIRS.has(entry.name)) {
      await copyDir($, source, `${to}/${entry.name}`, skipped)
    } else if (entry.kind === 'file' && TEXT_FILE.test(entry.name)) {
      await $.fs.write(`${to}/${entry.name}`, await $.fs.read(source))
    } else if (entry.kind === 'file') {
      skipped.push(entry.name)
    }
  }
}

async function listing($: EngineInterface, mods: Mod[]): Promise<string> {
  const lines = await Promise.all(
    mods.map(async (mod, i) => {
      const mark = (await isActive($, mod)) ? '✅' : '⬜'
      const about = mod.description ? ` — ${mod.description}` : ''

      return `${mark} ${i + 1}. ${mod.name}${about}`
    }),
  )

  return lines.join('\n')
}

function pickMods(mods: Mod[], numbers: number[]) {
  const bad = numbers.filter(n => n > mods.length)
  const picked = numbers.flatMap(n => mods[n - 1] ?? [])

  return { picked, bad }
}

async function turnOn($: EngineInterface, mods: Mod[]): Promise<string> {
  const target = await activeDir($)
  const lines: string[] = []
  for (const mod of mods) {
    const skipped: string[] = []
    try {
      await copyDir($, mod.dir, `${target}/${mod.name}`, skipped)
      const note = skipped.length > 0 ? `（略過非文字檔：${skipped.join('、')}）` : ''
      lines.push(`✅ 已啟用 ${mod.name}${note}`)
    } catch (error) {
      lines.push(`❌ ${mod.name} 啟用失敗：${String(error)}`)
    }
  }

  return lines.join('\n')
}

async function turnOff($: EngineInterface, mods: Mod[]): Promise<string> {
  const target = await activeDir($)
  const lines: string[] = []
  for (const mod of mods) {
    if (!(await isActive($, mod))) continue
    await $.fs.write(`${target}/${mod.name}/hooks/hooks.json`, OFF_HOOKS)
    lines.push(`⏹️ 已停用 ${mod.name}`)
  }

  return lines.length > 0 ? lines.join('\n') : '沒有啟用中的 mod。'
}

const HELP = [
  '用法：/mod 跳出選單　/mod 1 3 啟用 1、3 號　/mod off 2 停用 2 號　/mod off 全部停用　/mod list 只看清單',
  '若沒有馬上生效：本 session 需開啟熱重載（Enable hot reloading），或重開 session 後生效。',
].join('\n')

const EMPTY = [
  '找不到任何 mod。',
  '把 mod 資料夾（含 .claude-plugin/plugin.json）放到 ~/.claude/mods/ 或專案的 mods/ 底下，',
  '其他對話框做的 mod（~/.claude/dev-mods/）也會自動列出。',
].join('\n')

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'mod',
      description: '列出 mod 並用編號選擇啟用（可複選）',
    })

    return next(e)
  })

  on('command.run', { command: 'mod' }, async ($, e) => {
    const mods = await findMods($)
    if (mods.length === 0) return { text: EMPTY }

    const args = parseArgs(e.args)
    const list = await listing($, mods)

    if (args.kind === 'list') return { text: `${list}\n\n${HELP}` }

    if (args.kind === 'off') {
      const { picked, bad } = args.numbers === 'all' ? { picked: mods, bad: [] } : pickMods(mods, args.numbers)
      const warn = bad.length > 0 ? `\n沒有這些編號：${bad.join(', ')}` : ''

      return { text: (await turnOff($, picked)) + warn }
    }

    let numbers = args.kind === 'on' ? args.numbers : []

    if (args.kind === 'pick') {
      // 只有一個 mod：直接啟用
      if (mods.length === 1) return { text: await turnOn($, mods) }

      // 2~4 個：跳出複選選單；更多時請輸入編號
      if (mods.length > 4) return { text: `${list}\n\n輸入要啟用的編號，例如 /mod 1 3\n${HELP}` }
      try {
        const answer = await $.ui.ask('要啟用哪些 mod？（可複選）', {
          header: 'MOD',
          multiSelect: true,
          options: mods.map((mod, i) => `${i + 1}. ${mod.name}`),
        })
        numbers = numbersFromAnswer(answer)
      } catch {
        return { text: `${list}\n\n已取消。也可以直接輸入 /mod 1 3` }
      }
    }

    if (numbers.length === 0) return { text: `${list}\n\n沒有選擇任何編號。\n${HELP}` }

    const { picked, bad } = pickMods(mods, numbers)
    const warn = bad.length > 0 ? `\n沒有這些編號：${bad.join(', ')}` : ''

    return { text: (await turnOn($, picked)) + warn }
  })
}
