export type Limit = { kind: string; percentUsed: number; resetsAt?: string }

declare module 'claude-code' {
  interface PluginState {
    'zh-tw-bar': {
      limits: Limit[]
      folders: string[]
      links: string[]
      account: string
      isAdding: boolean
      isOpen: boolean
      isQuitting: boolean
    }
  }
}
