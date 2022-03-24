import { IVerificationWindowService } from "@noovolari/leapp-core/interfaces/i-verification-window.service";
import {
  RegisterClientResponse,
  StartDeviceAuthorizationResponse,
  VerificationResponse,
} from "@noovolari/leapp-core/services/session/aws/aws-sso-role-service";
import { RemoteProceduresClient } from "@noovolari/leapp-core/services/remote-procedures-client";

export class CliRpcVerificationWindowService implements IVerificationWindowService {
  constructor(private remoteProceduresClient: RemoteProceduresClient) {}

  async openVerificationWindow(
    registerClientResponse: RegisterClientResponse,
    startDeviceAuthorizationResponse: StartDeviceAuthorizationResponse,
    windowModality: string,
    onWindowClose: () => void
  ): Promise<VerificationResponse> {
    return this.remoteProceduresClient.openVerificationWindow(
      registerClientResponse,
      startDeviceAuthorizationResponse,
      windowModality,
      onWindowClose
    );
  }
}
