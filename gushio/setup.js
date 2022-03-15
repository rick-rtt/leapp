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

      await deleteFunction(path,'../core/dist')
      await deleteFunction(path,'../core/node_modules')
      await deleteFunction(path,'../core/package-lock.json')

      result = shellJs.exec('cd core && npm install')
      if (result.code !== 0) {
        throw new Error(result.stderr)
      }

      result = shellJs.exec('cd core && npm run clean')
      if (result.code !== 0) {
        throw new Error(result.stderr)
      }

      result = shellJs.exec('cd core && npm run build')
      if (result.code !== 0) {
        throw new Error(result.stderr)
      }

      console.log("setting up cli...")

      await deleteFunction(path,'../cli/dist')
      await deleteFunction(path,'../cli/node_modules')
      await deleteFunction(path,'../cli/package-lock.json')

      result = shellJs.exec('cd cli && npm install')
      if (result.code !== 0) {
        throw new Error(result.stderr)
      }

      result = shellJs.exec('cd cli && npm run clean')
      if (result.code !== 0) {
        throw new Error(result.stderr)
      }

      result = shellJs.exec('cd cli && npm run prepack')
      if (result.code !== 0) {
        throw new Error(result.stderr)
      }

      console.log("setting up desktop app...")

      await deleteFunction(path,'../desktop-app/dist')
      await deleteFunction(path,'../desktop-app/node_modules')
      await deleteFunction(path,'../desktop-app/package-lock.json')

      result = shellJs.exec('cd desktop-app && npm install --force')
      if (result.code !== 0) {
        throw new Error(result.stderr)
      }

      result = shellJs.exec('cd desktop-app && npm run clean')
      if (result.code !== 0) {
        throw new Error(result.stderr)
      }
    } catch (e) {
      console.error(e.message.red)
    }
  }
}
