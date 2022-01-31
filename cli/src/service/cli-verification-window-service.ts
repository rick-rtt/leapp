import { IVerificationWindowService } from '@noovolari/leapp-core/interfaces/i-verification-window.service'
import {
  RegisterClientResponse,
  StartDeviceAuthorizationResponse,
  VerificationResponse
} from '@noovolari/leapp-core/services/session/aws/aws-sso-role-service'

export class CliVerificationWindowService implements IVerificationWindowService {
  async openVerificationWindow(registerClientResponse: RegisterClientResponse,
                               startDeviceAuthorizationResponse: StartDeviceAuthorizationResponse,
                               windowModality: string, onWindowClose: () => void): Promise<VerificationResponse> {
    onWindowClose()
    return {
      clientId: registerClientResponse,
      clientSecret: startDeviceAuthorizationResponse,
      deviceCode: windowModality
    } as VerificationResponse
  }

}
