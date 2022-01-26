const path = require('path')
module.exports = {
  cli: {
    name: 'build',
    description: 'Build the leapp core library',
    version: '0.1',
  },
  run: async () => {
    const path = require('path')
    const shellJs = require('shelljs')
    const deleteFunction = require('./delete-func')
    const compileFunction = require('./compile-func')

    try {
      console.log('Building leapp-core library... ')

      await deleteFunction(path, '../dist')
      await compileFunction(shellJs)

      console.log('Build completed successfully')
    } catch (e) {
      console.error(e.message.red)
    }
  },
}
