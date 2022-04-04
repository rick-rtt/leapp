const deleteFunction = require("./delete-func");
const path = require("path");
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
      console.log("cleaning...")

      shellJs.cd(path.join(__dirname, '..'))
      let result = shellJs.exec('lerna clean -y')
      if (result.code !== 0) {
        throw new Error(result.stderr)
      }

      const packages = ['core', 'cli', 'desktop-app']
      for (let pkg of packages) {
        console.log(`${pkg}: deleting package-lock.json...`)
        await deleteFunction(path, `../packages/${pkg}/package-lock.json`)

        console.log(`${pkg}: npm run clean...`)
        shellJs.cd(path.join(__dirname, `../packages/${pkg}`))
        result = shellJs.exec('npm run clean')
        if (result.code !== 0) {
          throw new Error(result.stderr)
        }
      }

      console.log("\n\n")
      console.log("installing dependencies...")
      shellJs.cd(path.join(__dirname, '..'))
      result = shellJs.exec('lerna bootstrap')
      if (result.code !== 0) {
        throw new Error(result.stderr)
      }

      console.log("\n\n")
      console.log("building...")

      console.log("core: npm run build...")
      shellJs.cd(path.join(__dirname, '../packages/core'))
      result = shellJs.exec('npm run build')
      if (result.code !== 0) {
        throw new Error(result.stderr)
      }

      console.log("cli: npm run prepack...")
      shellJs.cd(path.join(__dirname, '../packages/cli'))
      result = shellJs.exec('npm run prepack')
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
