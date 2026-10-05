// 解析 /mod 後面接的參數，例如 "1 3"、"1,3"、"off 2"、"list"
export type ModArgs =
  | { kind: 'pick' }
  | { kind: 'list' }
  | { kind: 'on'; numbers: number[] }
  | { kind: 'off'; numbers: number[] | 'all' }

export function numbersIn(text: string): number[] {
  const found = text.match(/\d+/g) ?? []

  return [...new Set(found.map(Number))].filter(n => n > 0)
}

export function parseArgs(args: string): ModArgs {
  const text = args.trim().toLowerCase()
  if (text === '') return { kind: 'pick' }
  if (text === 'list' || text === 'ls' || text === '清單') return { kind: 'list' }

  const off = /^(off|關閉|停用)/.exec(text)
  if (off) {
    const numbers = numbersIn(text.slice(off[0].length))

    return { kind: 'off', numbers: numbers.length === 0 ? 'all' : numbers }
  }

  return { kind: 'on', numbers: numbersIn(text) }
}

// 從 $.ui.ask 的回答（例如 "1. foo, 3. bar" 或自行輸入的 "1 3"）取出編號
export function numbersFromAnswer(answer: string): number[] {
  const labelled = [...answer.matchAll(/(?:^|,)\s*(\d+)\./g)].map(m => Number(m[1]))

  return labelled.length > 0 ? [...new Set(labelled)] : numbersIn(answer)
}
