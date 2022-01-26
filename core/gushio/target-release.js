module.exports = {
  cli: {
    name: 'publish',
    description: 'Prepare and release the leapp-core library on NPM',
    version: '0.1',
  },
  deps: [{name: 'semver', version: '^7.3.5'}],
  run: async () => {
    const path = require('path')
    const shellJs = require('shelljs')
    const semver = require('semver')
    const deleteFunction = require('./delete-func')
    const compileFunction = require('./compile-func')
    const bumpVersionFunction = require('./bump-func')

    try {
      console.log('Publishing leapp-core library... ')

      await deleteFunction(path, '../dist')
      await compileFunction(shellJs)
      await bumpVersionFunction(path, semver)

      let result = shellJs.exec('cd dist')
      if (result.code !== 0) {
        throw new Error(result.stderr)
      }

      result = shellJs.exec('npm publish --access public')
      if (result.code !== 0) {
        throw new Error(result.stderr)
      }
      console.log('leapp-core published on npm successfully')
    } catch (e) {
      console.error(e.message.red)
    }
  }
}
