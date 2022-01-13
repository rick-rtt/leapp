import {Component, OnInit, ViewEncapsulation} from '@angular/core';
import {FormControl, FormGroup} from '@angular/forms';
import {AppService, ToastLevel} from '../../../services/app.service';
import {Router} from '@angular/router';
import {environment} from '../../../../environments/environment';
import * as uuid from 'uuid';
import {WorkspaceService} from '../../../services/workspace.service';
import {SessionFactoryService} from '../../../services/session-factory.service';
import {constants} from '@noovolari/leapp-core/models/constants';
import { Repository } from "@noovolari/leapp-core/services/repository";
import {LoggerLevel, LoggingService} from "@noovolari/leapp-core/services/logging-service";
import {SessionType} from "@noovolari/leapp-core/models/session-type";
import {AwsIamRoleFederatedSession} from "@noovolari/leapp-core/models/aws-iam-role-federated-session";
import {SessionStatus} from "@noovolari/leapp-core/models/session-status";

@Component({
  selector: 'app-profile-page',
  templateUrl: './profile-page.component.html',
  styleUrls: ['./profile-page.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ProfilePageComponent implements OnInit {

  eConstants = constants;
  awsProfileValue: { id: string; name: string };
  idpUrlValue;
  editingIdpUrl: boolean;
  editingAwsProfile: boolean;

  showProxyAuthentication = false;
  proxyProtocol = 'https'; // Default
  proxyUrl;
  proxyPort = '8080'; // Default
  proxyUsername;
  proxyPassword;

  locations: { location: string }[];
  regions: { region: string }[];
  selectedLocation: string;
  selectedRegion: string;
  selectedBrowserOpening = constants.inApp.toString();

  public form = new FormGroup({
    idpUrl: new FormControl(''),
    awsProfile: new FormControl(''),
    proxyUrl: new FormControl(''),
    proxyProtocol: new FormControl(''),
    proxyPort: new FormControl(''),
    proxyUsername: new FormControl(''),
    proxyPassword: new FormControl(''),
    showAuthCheckbox: new FormControl(''),
    regionsSelect: new FormControl(''),
    locationsSelect: new FormControl(''),
    defaultBrowserOpening: new FormControl('')
  });

  repository: Repository;

  /* Simple profile page: shows the Idp Url and the workspace json */
  private sessionService: any;

  constructor(
    public workspaceService: WorkspaceService,
    private appService: AppService,
    private sessionProviderService: SessionFactoryService,
    private router: Router
  ) {
    this.repository = Repository.getInstance();
  }

  ngOnInit() {
    const proxyConfiguration = Repository.getInstance().getProxyConfiguration();
    this.idpUrlValue = '';
    this.proxyProtocol = proxyConfiguration.proxyProtocol;
    this.proxyUrl = proxyConfiguration.proxyUrl;
    this.proxyPort = proxyConfiguration.proxyPort;
    this.proxyUsername = proxyConfiguration.username || '';
    this.proxyPassword = proxyConfiguration.password || '';

    this.form.controls['idpUrl'].setValue(this.idpUrlValue);
    this.form.controls['proxyUrl'].setValue(this.proxyUrl);
    this.form.controls['proxyProtocol'].setValue(this.proxyProtocol);
    this.form.controls['proxyPort'].setValue(this.proxyPort);
    this.form.controls['proxyUsername'].setValue(this.proxyUsername);
    this.form.controls['proxyPassword'].setValue(this.proxyPassword);

    const isProxyUrl = proxyConfiguration.proxyUrl && proxyConfiguration.proxyUrl !== 'undefined';
    this.proxyUrl = isProxyUrl ? proxyConfiguration.proxyUrl : '';

    if (this.proxyUsername || this.proxyPassword) {
      this.showProxyAuthentication = true;
    }

    this.regions = this.appService.getRegions();
    this.locations = this.appService.getLocations();
    this.selectedRegion   = Repository.getInstance().getDefaultRegion() || environment.defaultRegion;
    this.selectedLocation = Repository.getInstance().getDefaultLocation() || environment.defaultLocation;
    this.selectedBrowserOpening = Repository.getInstance().getAwsSsoConfiguration().browserOpening || constants.inApp.toString();

    this.appService.validateAllFormFields(this.form);
  }

  /**
   * Save the idp-url again
   */
  saveOptions() {
    if (this.form.valid) {
      const proxyConfiguration = Repository.getInstance().getProxyConfiguration();
      proxyConfiguration.proxyUrl = this.form.controls['proxyUrl'].value;
      proxyConfiguration.proxyProtocol = this.form.controls['proxyProtocol'].value;
      proxyConfiguration.proxyPort = this.form.controls['proxyPort'].value;
      proxyConfiguration.username = this.form.controls['proxyUsername'].value;
      proxyConfiguration.password = this.form.controls['proxyPassword'].value;
      Repository.getInstance().updateProxyConfiguration(proxyConfiguration);

      Repository.getInstance().updateDefaultRegion(this.selectedRegion);
      Repository.getInstance().updateDefaultLocation(this.selectedLocation);
      Repository.getInstance().updateBrowserOpening(this.selectedBrowserOpening);

      if (this.checkIfNeedDialogBox()) {

        this.appService.confirmDialog('You\'ve set a proxy url: the app must be restarted to update the configuration.', (res) => {
          if (res !== constants.confirmClosed) {
            LoggingService.getInstance().logger('User have set a proxy url: the app must be restarted to update the configuration.', LoggerLevel.info, this);
            this.appService.restart();
          }
        });
      } else {
        LoggingService.getInstance().logger('Option saved.', LoggerLevel.info, this, JSON.stringify(this.form.getRawValue(), null, 3));
        this.appService.toast('Option saved.', ToastLevel.info, 'Options');
        this.router.navigate(['/sessions', 'session-selected']).then(_ => {});
      }
    }
  }

  /**
   * Check if we need a dialog box to request restarting the application
   */
  checkIfNeedDialogBox() {
    return this.form.controls['proxyUrl'].value !== undefined &&
      this.form.controls['proxyUrl'].value !== null &&
      (this.form.controls['proxyUrl'].dirty ||
       this.form.controls['proxyProtocol'].dirty ||
       this.form.controls['proxyPort'].dirty ||
       this.form.controls['proxyUsername'].dirty ||
       this.form.controls['proxyPassword'].dirty);
  }

  /**
   * Return to home screen
   */
  goBack() {
    this.router.navigate(['/', 'sessions', 'session-selected']).then(_ => {});
  }

  manageIdpUrl(id) {
    const idpUrl = Repository.getInstance().getIdpUrl(id);
    if (this.form.get('idpUrl').value !== '') {
      if (!idpUrl) {
        Repository.getInstance().addIdpUrl({ id: uuid.v4(), url: this.form.get('idpUrl').value });
      } else {
        Repository.getInstance().updateIdpUrl(id, this.form.get('idpUrl').value);
      }
    }
    this.editingIdpUrl = false;
    this.idpUrlValue = undefined;
    this.form.get('idpUrl').setValue('');
  }

  editIdpUrl(id) {
    const idpUrl = Repository.getInstance().getIdpUrls().filter(u => u.id === id)[0];
    this.idpUrlValue = idpUrl;
    this.form.get('idpUrl').setValue(idpUrl.url);
    this.editingIdpUrl = true;
  }

  deleteIdpUrl(id) {
    // Assumable sessions with this id
    this.sessionService = this.sessionProviderService.getService(SessionType.awsIamRoleFederated);
    let sessions = this.workspaceService.sessions.filter(s => (s as AwsIamRoleFederatedSession).idpUrlId === id);

    // Add iam Role Chained from iam role iam_federated_role
    sessions.forEach(parent => {
      const childs = this.workspaceService.listIamRoleChained(parent);
      sessions = sessions.concat(childs);
    });

    // Get only names for display
    let sessionsNames = sessions.map(s => `<li><div class="removed-sessions"><b>${s.sessionName}</b> - <small>${(s as AwsIamRoleFederatedSession).roleArn.split('/')[1]}</small></div></li>`);
    if (sessionsNames.length === 0) {
      sessionsNames = ['<li><b>no sessions</b></li>'];
    }

    // Ask for deletion
    this.appService.confirmDialog(`Deleting this Idp url will also remove these sessions: <br><ul>${sessionsNames.join('')}</ul>Do you want to proceed?`, (res) => {
      if (res !== constants.confirmClosed) {
        LoggingService.getInstance().logger(`Removing idp url with id: ${id}`, LoggerLevel.info, this);

        Repository.getInstance().removeIdpUrl(id);

        sessions.forEach(session => {
          this.sessionService.delete(session.sessionId);
        });
      }
    });
  }

  async manageAwsProfile(id: string | number) {

    const profileIndex = Repository.getInstance().getProfiles().findIndex(p => p.id === id.toString());
    if (this.form.get('awsProfile').value !== '') {
      if (profileIndex === -1) {
        Repository.getInstance().addProfile({ id: uuid.v4(), name: this.form.get('awsProfile').value });
      } else {
        Repository.getInstance().updateProfile(id.toString(), this.form.get('awsProfile').value);

        for(let i = 0; i < this.workspaceService.sessions.length; i++) {
          const sess = this.workspaceService.sessions[i];
          this.sessionService = this.sessionProviderService.getService(sess.type);

          if( (sess as any).profileId === id.toString()) {
            if ((sess as any).status === SessionStatus.active) {
              await this.sessionService.stop(sess.sessionId);
              await this.sessionService.start(sess.sessionId);
            }
          }
        }
      }
    }
    this.editingAwsProfile = false;
    this.awsProfileValue = undefined;
    this.form.get('awsProfile').setValue('');
  }

  editAwsProfile(id: string) {
    const profile = Repository.getInstance().getProfiles().filter(u => u.id === id)[0];
    this.awsProfileValue = profile;
    this.form.get('awsProfile').setValue(profile.name);
    this.editingAwsProfile = true;
  }

  deleteAwsProfile(id: string) {
    // With profile
    const sessions = this.workspaceService.sessions.filter(sess => (sess as any).profileId === id);

    // Get only names for display
    let sessionsNames = sessions.map(s => `<li><div class="removed-sessions"><b>${s.sessionName}</b> - <small>${(s as AwsIamRoleFederatedSession).roleArn ? (s as AwsIamRoleFederatedSession).roleArn.split('/')[1] : ''}</small></div></li>`);
    if (sessionsNames.length === 0) {
      sessionsNames = ['<li><b>no sessions</b></li>'];
    }

    // Ask for deletion
    this.appService.confirmDialog(`Deleting this profile will set default to these sessions: <br><ul>${sessionsNames.join('')}</ul>Do you want to proceed?`, async (res) => {
      if (res !== constants.confirmClosed) {
        LoggingService.getInstance().logger(`Reverting to default profile with id: ${id}`, LoggerLevel.info, this);
        Repository.getInstance().removeProfile(id);
        // Reverting all sessions to default profile
        for(let i = 0; i < sessions.length; i++) {
          const sess = sessions[i];
          this.sessionService = this.sessionProviderService.getService(sess.type);

          let wasActive = false;
          if ((sess as any).status === SessionStatus.active) {
            wasActive = true;
            await this.sessionService.stop(sess.sessionId);
          }

          (sess as any).profileId = Repository.getInstance().getDefaultProfileId();
          this.sessionService.update(sess.sessionId, sess);

          if(wasActive) {
            this.sessionService.start(sess.sessionId);
          }
        }
      }
    });
  }
}
