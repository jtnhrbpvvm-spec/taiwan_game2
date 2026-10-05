import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Limit } from '../types'

const limits = atom({ plugin: 'zh-tw-bar', key: 'limits' } as const, [])
const folders = atom({ plugin: 'zh-tw-bar', key: 'folders' } as const, [])
const links = atom({ plugin: 'zh-tw-bar', key: 'links' } as const, [])
const account = atom({ plugin: 'zh-tw-bar', key: 'account' } as const, '查詢中…')
const isAdding = atom({ plugin: 'zh-tw-bar', key: 'isAdding' } as const, false)
const isOpen = atom({ plugin: 'zh-tw-bar', key: 'isOpen' } as const, false)
const isQuitting = atom({ plugin: 'zh-tw-bar', key: 'isQuitting' } as const, false)
const QUIT =
  "Start-Process taskkill -ArgumentList '/IM','claude.exe','/T','/F' -WindowStyle Hidden"

const PANE = 'zh-tw-bar'
const ADD = '__add__'
const ACCOUNT = '__account__'
const PROFILE_URL = 'https://api.anthropic.com/api/oauth/profile'
const PICKER = [
  '[Console]::OutputEncoding = [Text.Encoding]::UTF8',
  'Add-Type -AssemblyName System.Windows.Forms',
  '$owner = New-Object System.Windows.Forms.Form -Property @{ TopMost = $true; ShowInTaskbar = $false; Opacity = 0 }',
  '$owner.Show()',
  '$dialog = New-Object System.Windows.Forms.FolderBrowserDialog',
  "$dialog.Description = '選擇要新增的資料夾'",
  "if ($dialog.ShowDialog($owner) -eq 'OK') { Write-Output $dialog.SelectedPath }",
  '$owner.Close()',
].join('; ')

// 介面文字對照：引擎交給 mod 的只有這幾處文字（進度列、提示列、模式標籤）
const WORDS: readonly (readonly [RegExp, string])[] = [
  [/^Working$/i, '處理中'],
  [/^Thinking$/i, '思考中'],
  [/^Creating /i, '建立 '],
  [/^Writing /i, '寫入 '],
  [/^Editing /i, '編輯 '],
  [/^Updating /i, '更新 '],
  [/^Reading /i, '讀取 '],
  [/^Searching /i, '搜尋 '],
  [/^Running /i, '執行 '],
  [/^Fetching /i, '擷取 '],
  [/^Listing /i, '列出 '],
  [/^Deleting /i, '刪除 '],
  [/^Compacting /i, '壓縮 '],
]

const HINTS: readonly (readonly [RegExp, string])[] = [
  [/\? for shortcuts/gi, '? 查看快捷鍵'],
  [/esc to interrupt/gi, '按 Esc 中斷'],
  [/esc to cancel/gi, '按 Esc 取消'],
  [/esc to clear/gi, '按 Esc 清除'],
  [/enter to send/gi, '按 Enter 送出'],
  [/shift\+tab to cycle/gi, 'Shift+Tab 切換'],
  [/ctrl\+o to expand/gi, 'Ctrl+O 展開'],
  [/ctrl\+b to run in background/gi, 'Ctrl+B 背景執行'],
  [/accept edits on/gi, '自動接受編輯：開'],
  [/plan mode on/gi, '規劃模式：開'],
  [/bypass permissions on/gi, '略過權限：開'],
  [/auto mode on/gi, '自動模式：開'],
  [/tab to accept/gi, '按 Tab 採用'],
]

const MODES: Record<string, string> = {
  focus: '專注',
  'memory paused': '記憶已暫停',
  'plan mode': '規劃模式',
  'accept edits': '自動接受編輯',
  'bypass permissions': '略過權限',
  'auto mode': '自動模式',
  fast: '快速模式',
}

const translate = (
  text: string,
  table: readonly (readonly [RegExp, string])[],
): string => table.reduce((out, [from, to]) => out.replace(from, to), text)

const two = (n: number): string => String(n).padStart(2, '0')

const resetText = (iso: string | undefined, hasDate: boolean): string => {
  if (iso === undefined) {
    return '—'
  }

  const at = new Date(iso)

  if (Number.isNaN(at.getTime())) {
    return '—'
  }

  const time = `${two(at.getHours())}:${two(at.getMinutes())}`

  return hasDate ? `${at.getMonth() + 1}/${at.getDate()} ${time}` : time
}

const limitText = (
  list: readonly Limit[],
  kind: string,
  name: string,
  hasDate: boolean,
): string => {
  const limit = list.find(one => one.kind === kind)

  return limit === undefined
    ? `${name}流量 —`
    : `${name}流量 ${limit.percentUsed}%／重置 ${resetText(limit.resetsAt, hasDate)}`
}

const parentOf = (path: string): string => {
  const cut = Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\'))

  return cut > 0 ? path.slice(0, cut) : path
}

const tail = (text: string, room: number): string =>
  text.length > room ? `…${text.slice(-(room - 1))}` : text

const remember = (list: readonly string[], one: string, most: number): string[] =>
  [one, ...list.filter(other => other !== one)].slice(0, most)

const loadAccount = async ($: EngineInterface): Promise<string> => {
  const credential = await $.session.authorize()

  if (credential === null) {
    return '未使用 Anthropic 帳號（第三方供應商或未登入）'
  }

  if (credential.kind === 'api-key') {
    return 'API 金鑰'
  }

  const reply = await $.http.fetch(PROFILE_URL, { auth: credential.handle })

  if (!reply.ok) {
    return '已登入訂閱帳號'
  }

  const profile = JSON.parse(reply.text) as {
    account?: { email?: string }
    organization?: { name?: string }
  }
  const email = profile.account?.email ?? '已登入訂閱帳號'
  const team = profile.organization?.name

  return team === undefined ? email : `${email}（${team}）`
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    const [cwd, root, settings, usage] = await Promise.all([
      $.session.cwd(),
      $.session.root(),
      $.settings.read(),
      $.session.usage(),
    ])
    const extra = settings.permissions?.additionalDirectories ?? []
    await update($, folders, list => [...new Set([cwd, root, ...extra, ...list])])
    await update($, limits, () => usage.rateLimits)

    // 舊版開過的側邊面板，重新載入後收掉
    void $.ui.close({ id: PANE }).catch(() => undefined)

    void loadAccount($)
      .catch(() => '無法取得帳號')
      .then(name => update($, account, () => name))

    return next(e)
  })

  on('session.measure', async ($, e, next) => {
    await update($, limits, () => [...e.rateLimits])

    return next(e)
  })

  // 記下工具用到的資料夾與連結；不改動呼叫本身
  on('tool.call', ($, e, next) => {
    const input = e as unknown as Record<string, unknown>
    const path = input.file_path ?? input.notebook_path
    const url = input.url ?? (e.tool === 'WebSearch' ? input.query : undefined)

    if (typeof path === 'string' && path !== '') {
      void update($, folders, list =>
        list.includes(parentOf(path)) ? list : [...list, parentOf(path)].slice(-12),
      )
    }

    if (typeof url === 'string' && url !== '') {
      const entry = /^https?:/i.test(url) ? url : `搜尋：${url}`
      void update($, links, list => remember(list, entry, 15))
    }

    return next(e)
  })

  on('ui.render', { component: 'Spinner' }, ($, e, next) =>
    next({
      ...e,
      props: {
        ...e.props,
        word: translate(e.props.word, WORDS),
        message:
          e.props.message === null ? null : translate(e.props.message, WORDS),
      },
    }),
  )

  on('ui.render', { component: 'PromptHint' }, ($, e, next) => {
    const hint = translate(e.props.hint, HINTS)

    return hint === e.props.hint
      ? next(e)
      : next({ ...e, props: { ...e.props, hint } })
  })

  on('ui.render', { component: 'SessionMode' }, ($, e, next) =>
    next({
      ...e,
      props: { ...e.props, modes: e.props.modes.map(mode => MODES[mode] ?? mode) },
    }),
  )

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if (e.props.hasSurvey) {
      return next(e)
    }

    const { Box, Button, Input, Select, Text } = $.ui.resolve(e)

    if (!(await read($, isOpen))) {
      return (
        <Box flexDirection="row" justifyContent="center" width="100%">
          <Button
            key="open-bar"
            label="流量與來源 ▾"
            dimColor
            onPress={() => update($, isOpen, () => true)}
          />
        </Box>
      )
    }

    const room = 48
    const quitting = await read($, isQuitting)
    const [windows, dirs, urls, who, adding] = await Promise.all([
      read($, limits),
      read($, folders),
      read($, links),
      read($, account),
      read($, isAdding),
    ])

    const addFolder = async (typed: string): Promise<void> => {
      const path = typed.trim()
      await update($, isAdding, () => false)

      if (path === '') {
        return
      }

      const commands = await $.command.list()

      if (!commands.some(one => one.name === 'add-dir')) {
        $.ui.toast('這個環境沒有 /add-dir 指令，無法新增資料夾')

        return
      }

      try {
        await $.command.run({ command: 'add-dir', args: path })
        await update($, folders, list => [...new Set([...list, path])])
        $.ui.toast(`已新增資料夾：${path}`)
      } catch {
        $.ui.toast(`新增資料夾失敗：${path}`)
      }
    }

    // 另起一個不跟著本程式結束的 taskkill，把 App 與它的子程序全部結束
    const quitClaude = async (): Promise<void> => {
      await update($, isQuitting, () => false)

      try {
        await $.process.run(['powershell.exe', '-NoProfile', '-Command', QUIT])
      } catch {
        $.ui.toast('無法關閉 Claude，請改用系統匣圖示的「結束」')
      }
    }

    // 開系統的資料夾選擇視窗；開不起來時退回手動輸入路徑
    const pickFolder = async (): Promise<void> => {
      try {
        const picked = await $.process.run(
          ['powershell.exe', '-NoProfile', '-STA', '-Command', PICKER],
          { timeoutMs: 600000 },
        )
        const path = picked.stdout.trim()

        if (picked.exitCode !== 0) {
          await update($, isAdding, () => true)
        } else if (path !== '') {
          await addFolder(path)
        }
      } catch {
        await update($, isAdding, () => true)
      }
    }

    return (
      <Box flexDirection="column" alignItems="center" width="100%">
        <Box
          flexDirection="row"
          flexWrap="wrap"
          justifyContent="center"
          alignItems="center"
          columnGap={2}
        >
          <Text bold>{limitText(windows, 'five_hour', '5 小時', false)}</Text>
          <Text dimColor>│</Text>
          <Text bold>{limitText(windows, 'seven_day', '每週', true)}</Text>
          <Select
            key="folders"
            label="資料夾"
            value={dirs[0] ?? ADD}
            options={[
              ...dirs.map(dir => ({ value: dir, label: tail(dir, room) })),
              { value: ADD, label: '＋ 新增資料夾…' },
            ]}
            onSelect={(value, pick) => {
              if (value === ADD) {
                void pickFolder()

                return
              }

              void $.ui.copy({ text: value, surface: pick.surface })
              $.ui.toast(`已複製路徑：${value}`)
            }}
          />
          <Select
            key="network"
            label="網路"
            value={ACCOUNT}
            options={[
              { value: ACCOUNT, label: `帳號：${who}` },
              ...urls.map(url => ({ value: url, label: tail(url, room) })),
            ]}
            onSelect={(value, pick) => {
              if (value === ACCOUNT) {
                return
              }

              void $.ui.copy({ text: value, surface: pick.surface })
              $.ui.toast(`已複製連結：${value}`)
            }}
          />
          {quitting ? (
            <Box flexDirection="row" alignItems="center" columnGap={1}>
              <Text color="red">確定要完全關閉 Claude？</Text>
              <Button
                key="quit-yes"
                label="確定關閉"
                variant="primary"
                onPress={() => quitClaude()}
              />
              <Button
                key="quit-no"
                label="取消"
                onPress={() => update($, isQuitting, () => false)}
              />
            </Box>
          ) : (
            <Button
              key="quit"
              label="完全關閉 Claude"
              dimColor
              onPress={() => update($, isQuitting, () => true)}
            />
          )}
          <Button
            key="close-bar"
            label="收合 ▴"
            dimColor
            onPress={() => update($, isOpen, () => false)}
          />
        </Box>
        {adding && (
          <Box flexDirection="row" alignItems="center" columnGap={1}>
            <Input
              key="add-folder"
              label="新增資料夾"
              placeholder="輸入資料夾的完整路徑，按 Enter 新增"
              submitLabel="新增"
              autoFocus
              onSubmit={value => void addFolder(value)}
            />
            <Button
              key="cancel-add"
              label="取消"
              onPress={() => update($, isAdding, () => false)}
            />
          </Box>
        )}
      </Box>
    )
  })
}
