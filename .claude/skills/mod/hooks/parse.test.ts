import { expect, test } from 'claude-code/testing'

import { numbersFromAnswer, parseArgs } from './parse'

test('沒有參數時跳出選單', async () => {
  expect(parseArgs('')).toEqual({ kind: 'pick' })
  expect(parseArgs('  ')).toEqual({ kind: 'pick' })
})

test('編號可用空白或逗號分隔，重複的只算一次', async () => {
  expect(parseArgs('1 3')).toEqual({ kind: 'on', numbers: [1, 3] })
  expect(parseArgs('1,3,3')).toEqual({ kind: 'on', numbers: [1, 3] })
})

test('off 停用指定編號，沒給編號就全部停用', async () => {
  expect(parseArgs('off 2')).toEqual({ kind: 'off', numbers: [2] })
  expect(parseArgs('off')).toEqual({ kind: 'off', numbers: 'all' })
  expect(parseArgs('停用 1 2')).toEqual({ kind: 'off', numbers: [1, 2] })
})

test('list 只列清單', async () => {
  expect(parseArgs('list')).toEqual({ kind: 'list' })
})

test('從複選答案取出編號', async () => {
  expect(numbersFromAnswer('1. alpha, 3. gamma')).toEqual([1, 3])
  expect(numbersFromAnswer('2. beta')).toEqual([2])
  expect(numbersFromAnswer('1 4')).toEqual([1, 4])
})
