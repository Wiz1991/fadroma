import { resolve, relative, dirname, basename } from 'path'
import { existsSync, unlinkSync, readFileSync } from 'fs'
import { readFile, writeFile } from 'fs/promises'
import { cwd, stderr } from 'process'
import { fileURLToPath } from 'url'

import bignum from 'bignumber.js'
import {render} from 'prettyjson'
import colors from 'colors/safe.js'

import { loadJSON, loadSchemas } from './schema.js'
import table from './table.js'
import taskmaster from './taskmaster.js'
import { mkdir, makeStateDir, touch, rimraf } from './sys.js'

const {bold} = colors

export {
  basename,
  bignum,
  bold,
  cwd,
  dirname,
  existsSync,
  fileURLToPath,
  loadJSON,
  loadSchemas,
  makeStateDir,
  mkdir,
  readFile,
  readFileSync,
  render,
  resolve,
  rimraf,
  relative,
  stderr,
  table,
  taskmaster,
  touch,
  unlinkSync,
  writeFile,
}

export const Console = filename => {

  filename = relative(process.cwd(), fileURLToPath(filename))

  const format = arg => '\n'+((typeof arg === 'object') ? render(arg) : arg)

  const debug = process.env.NODEBUG ? () => {} : function debug (...args) {
    console.debug('\n' + colors.yellow(filename), ...args.map(format))
    return args[0]
  }

  return { filename, format, debug }

}
