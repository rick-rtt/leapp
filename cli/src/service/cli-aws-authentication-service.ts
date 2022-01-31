import { IAwsAuthenticationService } from '@noovolari/leapp-core/interfaces/i-aws-authentication.service'

export class CliAwsAuthenticationService implements IAwsAuthenticationService {
  async needAuthentication(idpUrl: string): Promise<boolean> {
    return idpUrl === ''
  }


  async awsSignIn(idpUrl: string, needToAuthenticate: boolean): Promise<any> {
    return idpUrl === '' && needToAuthenticate
  }
}
