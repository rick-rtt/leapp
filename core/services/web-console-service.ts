import { IShellService } from "../interfaces/i-shell-service";
import { CredentialsInfo } from "../models/credentials-info";
import { LoggerLevel, LoggingService } from "./logging-service";

export class WebConsoleService {
  constructor(private shellService: IShellService, private loggingService: LoggingService) {}

  async openingWebConsole(credentialsInfo: CredentialsInfo, sessionRegion: string, sessionDuration: number = 3200) {
    const federationUrl = "https://signin.aws.amazon.com/federation";
    const consoleHomeURL = `https://${sessionRegion}.console.aws.amazon.com/console/home?region=${sessionRegion}`;

    if (sessionRegion.startsWith("us-gov-") || sessionRegion.startsWith("cn-")) {
      throw new Error("Unsupported Region");
    }

    this.loggingService.logger(`Starting opening Web Console`, LoggerLevel.info, this);

    const sessionStringJSON = {
      sessionId: credentialsInfo.sessionToken.aws_access_key_id,
      sessionKey: credentialsInfo.sessionToken.aws_secret_access_key,
      sessionToken: credentialsInfo.sessionToken.aws_session_token,
    };

    const queryParametersSigninToken = `?Action=getSigninToken&SessionDuration=${sessionDuration}&Session=${encodeURIComponent(
      JSON.stringify(sessionStringJSON)
    )}`;

    const res = await fetch(`${federationUrl}${queryParametersSigninToken}`);
    const response = await res.json();

    const loginURL = `${federationUrl}?Action=login&Issuer=Leapp&Destination=${consoleHomeURL}&SigninToken=${response.SigninToken}`;

    this.shellService.openExternalUrl(loginURL);
  }
}
