module.exports = {
  cli: {
    name: 'setup',
    description: 'Setup Leapp project',
    version: '0.1',
  },
  run: async () => {
    const shellJs = require('shelljs')
    const path = require('path')
    const deleteFunction = require('./delete-func')
    const currentPath = shellJs.pwd()

    try {
      console.log("setting up core...")

      console.log("core: cleaning folder...")
      await deleteFunction(path, '../packages/core/node_modules')
      await deleteFunction(path, '../packages/core/package-lock.json')

      shellJs.cd(path.join(__dirname, '../packages/core'))
      let result = shellJs.exec('npm install')

      if (result.code !== 0) {
        throw new Error(result.stderr)
      }

      console.log("core: npm run clean...")
      result = shellJs.exec('npm run clean')
      if (result.code !== 0) {
        throw new Error(result.stderr)
      }


      console.log("core: npm run build...")
      result = shellJs.exec('npm run build')
      if (result.code !== 0) {
        throw new Error(result.stderr)
      }

      console.log("setting up cli...")

      console.log("cli: cleaning folder...")
      await deleteFunction(path, '../packages/cli/node_modules')
      await deleteFunction(path, '../packages/cli/package-lock.json')

      shellJs.cd(path.join(__dirname, '../packages/cli'))
      result = shellJs.exec('npm install')

      if (result.code !== 0) {
        throw new Error(result.stderr)
      }

      console.log("cli: npm run clean...")
      result = shellJs.exec('npm run clean')
      if (result.code !== 0) {
        throw new Error(result.stderr)
      }

      console.log("cli: npm run prepack...")
      result = shellJs.exec('npm run prepack')
      if (result.code !== 0) {
        throw new Error(result.stderr)
      }

      console.log("setting up desktop app...")

      console.log("desktop app: cleaning folder...")
      await deleteFunction(path, '../packages/desktop-app/node_modules')
      await deleteFunction(path, '../packages/desktop-app/package-lock.json')

      shellJs.cd(path.join(__dirname, '../packages/desktop-app'))
      result = shellJs.exec('npm install')

      if (result.code !== 0) {
        throw new Error(result.stderr)
      }

      console.log("desktop app: npm run clean...")
      result = shellJs.exec('npm run clean')
      if (result.code !== 0) {
        throw new Error(result.stderr)
      }
    } catch (e) {
      e.message = e.message.red
      throw e
    } finally {
      shellJs.cd(currentPath)
    }
  }
}
