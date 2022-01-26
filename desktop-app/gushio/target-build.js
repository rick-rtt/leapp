const makeDirFunction = require('./makedir-func')
const path = require('path')
const copyFunction = require('./copy-func')
module.exports = {
    cli: {
        name: 'build',
        description: 'Build leapp desktop app',
        version: '0.1',
        arguments: [
            {name: '<target>', choices: ['aot', 'configuration staging', 'configuration production']},
        ],
    },
    run: async (args) => {
        const path = require('path')
        const shellJs = require('shelljs')
        const deleteFunction = require('./delete-func')
        const copyFunction = require('./copy-func')
        const makeDirFunction = require('./makedir-func')
        const compileFunction = require('./compile-func')
        try {
            console.log('Building leapp... ')

            await deleteFunction(path, '../electron/dist')
            await deleteFunction(path, '../dist')
            await makeDirFunction(path, '../dist/leapp-client')
            await copyFunction(path, '../src/assets/icons', '../dist/leapp-client')
            await compileFunction(shellJs, args[0])
            await makeDirFunction(path, '../electron/dist/electron/assets/images')
            await copyFunction(path, '../electron/assets/images', '../electron/dist/electron/assets/images')

            console.log('Build completed successfully')
        } catch (e) {
            console.error(e.message.red)
        }
    },
}
