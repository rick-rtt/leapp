export const constants = {
  appName: 'Leapp',

  samlRoleSessionDuration : 3600, // 1h
  sessionDuration : 60, // 1200, // 20 min
  sessionTokenDuration: 36000, // 10h
  timeout: 10000,

  lockFileDestination: '.Leapp/Leapp-lock.json',
  credentialsDestination: '.aws/credentials',
  azureAccessTokens: '.azure/accessTokens.json',
  azureProfile: '.azure/azureProfile.json',

  defaultRegion: 'us-east-1',
  defaultLocation: 'eastus',
  defaultAwsProfileName: 'default',
  defaultAzureProfileName: 'default-azure',
  latestUrl: 'https://leapp.cloud/releases.html',

  confirmed : '**CONFIRMED**',
  confirmClosed : '**MODAL_CLOSED**',
  confirmClosedAndIgnoreUpdate : '**IGNORE_UPDATE_AND_MODAL_CLOSED**',
  confirmCloseAndDownloadUpdate : '**GO_TO_DOWNLOAD_PAGE_AND_MODAL_CLOSED**',

  mac : 'mac',
  linux : 'linux',
  windows : 'windows',
  inApp : 'In-app',
  inBrowser : 'In-browser',
  forcedCloseBrowserWindow : 'ForceCloseBrowserWindow',
};
