import { Injectable } from '@angular/core';
import {AppService} from './app.service';
import {IMfaCodePrompter} from '@noovolari/leapp-core/services/session/aws/method/aws-iam-user-service';

@Injectable({
  providedIn: 'root'
})
export class MfaCodePromptService implements IMfaCodePrompter {

  constructor(
    private appService: AppService
  ) { }

  promptForMFACode(sessionName: string, callback: any): void {
      this.appService.inputDialog('MFA Code insert', 'Insert MFA Code', `please insert MFA code from your app or device for ${sessionName}`, callback);
  }
}
