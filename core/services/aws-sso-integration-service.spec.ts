import {AwsSsoIntegrationService} from './aws-sso-integration-service'

describe('AwsSsoIntegrationService', () => {

  test('validateAlias - empty alias', () => {
    const aliasParam = ''
    const actualValidationResult = AwsSsoIntegrationService.validateAlias(aliasParam)

    expect(actualValidationResult).toBe('Empty alias')
  })

  test('validateAlias - only spaces alias', () => {
    const aliasParam = '      '
    const actualValidationResult = AwsSsoIntegrationService.validateAlias(aliasParam)

    expect(actualValidationResult).toBe('Empty alias')
  })

  test('validateAlias - valid alias', () => {
    const aliasParam = 'alias'
    const actualValidationResult = AwsSsoIntegrationService.validateAlias(aliasParam)

    expect(actualValidationResult).toBe(true)
  })

  test('validatePortalUrl - invalid Url', () => {
    const portalUrlParam = 'www.url.com'
    const actualValidationPortalUrl = AwsSsoIntegrationService.validatePortalUrl(portalUrlParam)

    expect(actualValidationPortalUrl).toBe('Invalid portal URL')
  })

  test('validatePortalUrl - http Url', () => {
    const portalUrlParam = 'http://www.url.com'
    const actualValidationPortalUrl = AwsSsoIntegrationService.validatePortalUrl(portalUrlParam)

    expect(actualValidationPortalUrl).toBe(true)
  })

  test('validatePortalUrl - https Url', () => {
    const portalUrlParam = 'https://www.url.com'
    const actualValidationPortalUrl = AwsSsoIntegrationService.validatePortalUrl(portalUrlParam)

    expect(actualValidationPortalUrl).toBe(true)
  })

  test('getIntegrations', () => {
    const expectedIntegrations = [{id: 1}]
    const repository = {
      listAwsSsoConfigurations: () => expectedIntegrations,
    } as any

    const awsIntegrationsService = new AwsSsoIntegrationService(repository, null, null, null, null, null)

    const integrations = awsIntegrationsService.getIntegrations()

    expect(integrations).toBe(expectedIntegrations)
  })

  test('getOnlineIntegrations', () => {
    const expectedIntegrations = [{id: 1}]
    const awsIntegrationsService = new AwsSsoIntegrationService(null, null, null, null, null, null)
    awsIntegrationsService.getIntegrations = () => expectedIntegrations as any
    awsIntegrationsService.isOnline = jest.fn(() => true)

    const onlineIntegrations = awsIntegrationsService.getOnlineIntegrations()

    expect(onlineIntegrations).not.toBe(expectedIntegrations)
    expect(onlineIntegrations).toEqual(expectedIntegrations)
    expect(awsIntegrationsService.isOnline).toHaveBeenCalledWith(expectedIntegrations[0])
  })

  test('getOfflineIntegrations', () => {
    const expectedIntegrations = [{id: 1}]
    const awsIntegrationsService = new AwsSsoIntegrationService(null, null, null, null, null, null)
    awsIntegrationsService.getIntegrations = () => expectedIntegrations as any
    awsIntegrationsService.isOnline = jest.fn(() => false)

    const offlineIntegrations = awsIntegrationsService.getOfflineIntegrations()

    expect(offlineIntegrations).not.toBe(expectedIntegrations)
    expect(offlineIntegrations).toEqual(expectedIntegrations)
    expect(awsIntegrationsService.isOnline).toHaveBeenCalledWith(expectedIntegrations[0])
  })

  test('isOnline, token missing', () => {
    const awsIntegrationsService = new AwsSsoIntegrationService(null, null, null, null, null, null);
    (awsIntegrationsService as any).getDate = () => new Date('2022-02-24T10:00:00')

    const isOnline = awsIntegrationsService.isOnline({} as any)
    expect(isOnline).toBe(false)
  })

  test('isOnline, token expired', () => {
    const awsIntegrationsService = new AwsSsoIntegrationService(null, null, null, null, null, null);
    (awsIntegrationsService as any).getDate = () => new Date('2022-02-24T10:00:00')

    const integration = {
      accessTokenExpiration: '2022-02-24T10:00:00',
    } as any

    const isOnline = awsIntegrationsService.isOnline(integration)
    expect(isOnline).toBe(false)
  })

  test('isOnline, token not expired', () => {
    const awsIntegrationsService = new AwsSsoIntegrationService(null, null, null, null, null, null);
    (awsIntegrationsService as any).getDate = () => new Date('2022-02-24T10:00:00')

    const integration = {
      accessTokenExpiration: '2022-02-24T10:00:01',
    } as any

    const isOnline = awsIntegrationsService.isOnline(integration)
    expect(isOnline).toBe(true)
  })

  test('remainingHours', () => {
    const awsIntegrationService = new AwsSsoIntegrationService(null, null, null, null, null, null)
    const integration = {
      accessTokenExpiration: '2022-02-24T10:30:00',
    } as any;
    (awsIntegrationService as any).getDate = () => new Date('2022-02-24T10:00:00')
    const remainingHours = awsIntegrationService.remainingHours(integration)
    expect(remainingHours).toBe('in 30 minutes')
  })

  test('getDate', () => {
    const awsIntegrationService = new AwsSsoIntegrationService(null, null, null, null, null, null)
    const time: Date = (awsIntegrationService as any).getDate()

    expect(time).toBeInstanceOf(Date)
    expect(time.getDay()).toBe(new Date().getDay())
  })

  test('getIntegrationAccessTokenKey', () => {
    const awsIntegrationService = new AwsSsoIntegrationService(null, null, null, null, null, null)
    const integrationId: string = 'integration1';

    const actualIntegrationAccessTokenKey = (awsIntegrationService as any).getIntegrationAccessTokenKey(integrationId)

    expect(actualIntegrationAccessTokenKey).toBe(`aws-sso-integration-access-token-${integrationId}`)
  })
})
