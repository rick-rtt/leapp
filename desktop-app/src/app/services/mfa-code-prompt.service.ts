import { Injectable } from '@angular/core';
import {IMfaCodePrompter} from '../../../core/services/session/aws/method/aws-iam-user-service';
import {AppService} from './app.service';

@Injectable({
  providedIn: 'root'
})
export class MfaCodePromptService implements IMfaCodePrompter{

  constructor(
    private appService: AppService
  ) { }

  promptForMFACode(sessionName: string, callback: any): void {
      this.appService.inputDialog('MFA Code insert', 'Insert MFA Code', `please insert MFA code from your app or device for ${sessionName}`, callback);
  }
}
