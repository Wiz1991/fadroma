import { bold, colors } from '@hackbg/tools'

import assert from 'assert'

Error.stackTraceLimit = 100

const OK = colors.green('OK  ')
const FAIL = colors.red('FAIL')

import suites from './ops/index.spec.js.md'
runTests(suites)

async function runTests (suites) {

  for (const [suite, spec] of Object.entries(suites)) {
    const tests   = {}
    const results = {}

    let longestName = 0
    for (const [name, fn] of Object.entries(spec)) {
      if (name.length > longestName) longestName = name.length
      try {
        tests[name] = () => Promise.resolve(fn(assert))
          .then(data=>results[name] = [true, JSON.stringify(data)])
          .catch(error=>results[name] = [false, error])
      } catch (error) {
        tests[name] = error.message
        results[name] = [false, error]
        continue
      }
    }

    await Promise.all(Object.values(tests).map(run=>run())).then(()=>{
      let output = `\n      ${bold(suite)}\n`
      let testFailed = false
      for (let [name, [result, data]] of Object.entries(results)) {
        name = name.padEnd(longestName)
        if (result) {
          if (data === undefined) data = ''
          output += `${OK}  ${name}  ${data}\n`
        } else {
          output += `${FAIL}  ${name}  ${data}\n`
        }
      }
      console.log(output)
    })
  }

}
