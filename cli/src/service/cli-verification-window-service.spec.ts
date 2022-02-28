import {expect, test} from '@jest/globals'
import {CliVerificationWindowService} from './cli-verification-window-service'

describe('CliVerificationWindowService', () => {

  test('openVerificationWindow', async () => {
    const registerClientResponse = {clientId: 'clientId', clientSecret: 'clientSecret'} as any
    const startDeviceAuthorizationResponse = {verificationUriComplete: 'verUri', deviceCode: 'deviceCode'} as any

    const cliVerificationWindowService = new CliVerificationWindowService()
    const page = {goto: jest.fn()};
    (cliVerificationWindowService as any).getNavigationPage = async () => page

    const verificationResponse = await cliVerificationWindowService.openVerificationWindow(registerClientResponse, startDeviceAuthorizationResponse)

    expect(verificationResponse).toEqual({
      clientId: 'clientId', clientSecret: 'clientSecret', deviceCode: 'deviceCode',
    })
    expect(page.goto).toHaveBeenCalledWith('verUri')
  })

  test('getNavigationPage and closeBrowser', async () => {
    const cliVerificationWindowService = new CliVerificationWindowService()
    const page = await (cliVerificationWindowService as any).getNavigationPage(false)

    const process = page.browser().process()
    expect(process).toBeDefined()
    expect(process?.killed).toBeFalsy()
    expect(process?.signalCode).toBeNull()

    await cliVerificationWindowService.closeBrowser()
    expect(process?.killed).toBeTruthy()
    expect(process?.signalCode).toEqual('SIGKILL')
  })

  test('closeBrowser, no opened browser', async () => {
    const cliVerificationWindowService = new CliVerificationWindowService()
    await cliVerificationWindowService.closeBrowser()
  })
})
