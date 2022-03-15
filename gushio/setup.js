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

    try {
      console.log("setting up core...")

      console.log("core: cleaning folder...")
      await deleteFunction(path,'../core/dist')
      await deleteFunction(path,'../core/node_modules')
      await deleteFunction(path,'../core/package-lock.json')

      console.log("core: npm install...")
      result = shellJs.exec('cd core && npm install')
      if (result.code !== 0) {
        throw new Error(result.stderr)
      }

      console.log("core: npm run clean...")
      result = shellJs.exec('cd core && npm run clean')
      if (result.code !== 0) {
        throw new Error(result.stderr)
      }

      console.log("core: npm run build...")
      result = shellJs.exec('cd core && npm run build')
      if (result.code !== 0) {
        throw new Error(result.stderr)
      }

      console.log("setting up cli...")

      console.log("cli: cleaning folder...")
      await deleteFunction(path,'../cli/dist')
      await deleteFunction(path,'../cli/node_modules')
      await deleteFunction(path,'../cli/package-lock.json')

      console.log("cli: npm install...")
      result = shellJs.exec('cd cli && npm install')
      if (result.code !== 0) {
        throw new Error(result.stderr)
      }

      console.log("cli: npm run clean...")
      result = shellJs.exec('cd cli && npm run clean')
      if (result.code !== 0) {
        throw new Error(result.stderr)
      }

      console.log("cli: npm run prepack...")
      result = shellJs.exec('cd cli && npm run prepack')
      if (result.code !== 0) {
        throw new Error(result.stderr)
      }

      console.log("setting up desktop app...")

      console.log("desktop app: cleaning folder...")
      await deleteFunction(path,'../desktop-app/dist')
      await deleteFunction(path,'../desktop-app/node_modules')
      await deleteFunction(path,'../desktop-app/package-lock.json')

      console.log("desktop app: npm install --force...")
      result = shellJs.exec('cd desktop-app && npm install --force')
      if (result.code !== 0) {
        throw new Error(result.stderr)
      }

      console.log("desktop app: npm run clean...")
      result = shellJs.exec('cd desktop-app && npm run clean')
      if (result.code !== 0) {
        throw new Error(result.stderr)
      }
    } catch (e) {
      console.error(e.message.red)
    }
  }
}
