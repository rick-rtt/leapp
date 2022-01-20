import {
  RegisterClientResponse,
  StartDeviceAuthorizationResponse,
  VerificationResponse
} from '../services/session/aws/aws-sso-role-service'

export interface IVerificationWindowService {
  openVerificationWindow(registerClientResponse: RegisterClientResponse,
                         startDeviceAuthorizationResponse: StartDeviceAuthorizationResponse,
                         windowModality: string, onWindowClose: () => void): Promise<VerificationResponse>
}
