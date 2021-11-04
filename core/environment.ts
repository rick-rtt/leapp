const environment = {
  appName: 'Leapp',
  samlRoleSessionDuration: 3600, // 1h
  sessionDuration: 60, // 1200, // 20 min
  sessionTokenDuration: 36000, // 10h
  timeout: 10000,
  lockFileDestination: '.Leapp/Leapp-lock.json',
  production: false,
  credentialsDestination: '.aws/credentials',
  azureAccessTokens: '.azure/accessTokens.json',
  azureProfile: '.azure/azureProfile.json',
  defaultRegion: 'us-east-1',
  defaultLocation: 'eastus',
  defaultAwsProfileName: 'default',
  defaultAzureProfileName: 'default-azure',
  latestUrl: 'https://leapp.cloud/releases.html'
};

export { environment };
