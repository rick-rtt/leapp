import {describe, expect, jest, test} from '@jest/globals'
import GetDefaultRegion from './get-default'

describe('GetDefaultRegion', () => {

    test('run', async () => {
        const leappCliService = {regionService: {getDefaultAwsRegion: () => 'defaultRegion'}} as any

        const command = new GetDefaultRegion([], {} as any, leappCliService)
        command.log = jest.fn()

        await command.run()

        expect(command.log).toHaveBeenCalledWith('defaultRegion')
    })
})
