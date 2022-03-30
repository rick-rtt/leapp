export interface IAwsAuthenticationService {
  needAuthentication(idpUrl: string): Promise<boolean>;

  awsSignIn(idpUrl: string, needToAuthenticate: boolean): Promise<string>;

  closeAuthenticationWindow(): Promise<void>;
}
