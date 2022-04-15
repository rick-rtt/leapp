const path = require("path");
module.exports = {
  cli: {
    name: 'change-arch',
    description: 'Change macOS build architecture in package.json',
    version: '0.1',
    arguments: [
      {name: '<arch>', choices: ['x64', 'arm64']},
    ],
  },
  run: async (args) => {
    const path = require('path')
    const shellJs = require('shelljs')
    const copyFunction = require('./copy-func')
    const makeDirFunction = require('./makedir-func')
    const compileFunction = require('./compile-func')
    try {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'))
      packageJson['build']['mac']['target'][0]['arch'][0] = args[0]
      packageJson['build']['mac']['target'][1]['arch'][0] = args[0]
      fs.writeFileSync(path.join(__dirname, '../package.json'), JSON.stringify(packageJson, null, 2))
    } catch (e) {
      e.message = e.message.red
      throw e
    }
  },
}
