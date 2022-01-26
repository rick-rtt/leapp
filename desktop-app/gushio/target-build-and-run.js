module.exports = {
  cli: {
    name: 'build',
    description: 'Build and run leapp desktop app',
    version: '0.1',
    arguments: [
      {name: '<target>', choices: ['aot', 'configuration staging', 'configuration production']},
    ],
  },
  run: async (args) => {
    const path = require('path')
    const shellJs = require('shelljs')
    try {
      await gushio.run(path.join(__dirname, './target-build.js'), ...args)

      console.log('Launching leapp... ')
      const result = shellJs.exec('electron .')
      if (result.code !== 0) {
        throw new Error(result.stderr)
      }
    } catch (e) {
      console.error(e.message.red)
    }
  },
}
