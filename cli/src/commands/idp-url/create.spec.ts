import {jest, describe, test, expect} from '@jest/globals'
import CreateIdpUrl from './create'

describe('CreateIdpUrl', () => {

    test('getIdpUrl', async () => {
        const leappCliService: any = {
            inquirer: {
                prompt: async (params: any) => {
                    expect(params).toEqual([{
                        name: 'idpUrl',
                        message: `enter the identity provider URL`,
                        type: 'input'
                    }])
                    return {idpUrl: 'idpUrl'}
                }
            }
        }

        const command = new CreateIdpUrl([], {} as any, leappCliService)
        const idpUrl = await command.getIdpUrl()
        expect(idpUrl).toBe('idpUrl')
    })

    test('createIdpUrl', async () => {
        const leappCliService: any = {
            idpUrlsService: {
                createIdpUrl: jest.fn()
            }
        }

        const command = new CreateIdpUrl([], {} as any, leappCliService)
        command.log = jest.fn()
        command.createIdpUrl('idpUrl')

        expect(leappCliService.idpUrlsService.createIdpUrl).toHaveBeenCalledWith('idpUrl')
        expect(command.log).toHaveBeenCalledWith('identity provider URL created')
    })

    test('run', async () => {
        await runCommand(undefined, '')
    })

    test('run - createIdpUrl throws exception', async () => {
        await runCommand(new Error('errorMessage'), 'errorMessage')
    })

    test('run - createIdpUrl throws undefined object', async () => {
        await runCommand({hello: 'randomObj'}, 'Unknown error: [object Object]')
    })

    async function runCommand(errorToThrow: any, expectedErrorMessage: string) {
        const idpUrl = 'url1'
        const command = new CreateIdpUrl([], {} as any)
        command.getIdpUrl = jest.fn(async (): Promise<any> => idpUrl)
        command.createIdpUrl = jest.fn(() => {
            if (errorToThrow) {
                throw errorToThrow
            }
        })

        let occurredError
        try {
            await command.run()
        } catch (error) {
            occurredError = error
        }

        expect(command.getIdpUrl).toHaveBeenCalled()
        expect(command.createIdpUrl).toHaveBeenCalledWith(idpUrl)
        if (errorToThrow) {
            expect(occurredError).toEqual(new Error(expectedErrorMessage))
        }
    }
})

