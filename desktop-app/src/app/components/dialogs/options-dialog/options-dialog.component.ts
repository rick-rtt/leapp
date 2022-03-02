import {AfterViewInit, Component, Input, OnInit, ViewChild, ViewEncapsulation} from '@angular/core';
import {FormControl, FormGroup} from '@angular/forms';
import {AppService} from '../../../services/app.service';
import {Router} from '@angular/router';
import * as uuid from 'uuid';
import {MatTabGroup} from '@angular/material/tabs';
import {constants} from '@noovolari/leapp-core/models/constants';
import {LoggerLevel} from '@noovolari/leapp-core/services/logging-service';
import {MessageToasterService, ToastLevel} from '../../../services/message-toaster.service';
import {WindowService} from '../../../services/window.service';
import {SessionType} from '@noovolari/leapp-core/models/session-type';
import {AwsIamRoleFederatedSession} from '@noovolari/leapp-core/models/aws-iam-role-federated-session';
import {SessionStatus} from '@noovolari/leapp-core/models/session-status';
import {SessionService} from '@noovolari/leapp-core/services/session/session-service';
import {LeappCoreService} from '../../../services/leapp-core.service';

@Component({
  selector: 'app-options-dialog',
  templateUrl: './options-dialog.component.html',
  styleUrls: ['./options-dialog.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class OptionsDialogComponent implements OnInit, AfterViewInit {

  @Input()
  selectedIndex;

  @ViewChild('tabs', { static: false })
  tabGroup: MatTabGroup;

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
  selectedTerminal;

  form = new FormGroup({
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
    defaultBrowserOpening: new FormControl(''),
    terminalSelect: new FormControl('')
  });

  /* Simple profile page: shows the Idp Url and the workspace json */
  private sessionService: SessionService;

  constructor(
    public leappCoreService: LeappCoreService,
    public appService: AppService,
    private windowService: WindowService,
    private toasterService: MessageToasterService,
    private router: Router
  ) {
    this.selectedTerminal = this.leappCoreService.repository.getWorkspace().macOsTerminal || constants.macOsTerminal;
  }

  public ngOnInit(): void {
    this.idpUrlValue = '';
    this.proxyProtocol = this.leappCoreService.repository.getWorkspace().proxyConfiguration.proxyProtocol;
    this.proxyUrl = this.leappCoreService.repository.getWorkspace().proxyConfiguration.proxyUrl;
    this.proxyPort = this.leappCoreService.repository.getWorkspace().proxyConfiguration.proxyPort;
    this.proxyUsername = this.leappCoreService.repository.getWorkspace().proxyConfiguration.username || '';
    this.proxyPassword = this.leappCoreService.repository.getWorkspace().proxyConfiguration.password || '';

    this.form.controls['idpUrl'].setValue(this.idpUrlValue);
    this.form.controls['proxyUrl'].setValue(this.proxyUrl);
    this.form.controls['proxyProtocol'].setValue(this.proxyProtocol);
    this.form.controls['proxyPort'].setValue(this.proxyPort);
    this.form.controls['proxyUsername'].setValue(this.proxyUsername);
    this.form.controls['proxyPassword'].setValue(this.proxyPassword);

    const isProxyUrl = this.leappCoreService.repository.getWorkspace().proxyConfiguration.proxyUrl &&
                       this.leappCoreService.repository.getWorkspace().proxyConfiguration.proxyUrl !== 'undefined';
    this.proxyUrl = isProxyUrl ? this.leappCoreService.repository.getWorkspace().proxyConfiguration.proxyUrl : '';

    if (this.proxyUsername || this.proxyPassword) {
      this.showProxyAuthentication = true;
    }

    this.regions = this.leappCoreService.awsCoreService.getRegions();
    this.locations = this.leappCoreService.azureCoreService.getLocations();
    this.selectedRegion   = this.leappCoreService.repository.getWorkspace().defaultRegion || constants.defaultRegion;
    this.selectedLocation = this.leappCoreService.repository.getWorkspace().defaultLocation || constants.defaultLocation;

    this.appService.validateAllFormFields(this.form);


  }

  public ngAfterViewInit(): void {
    if(this.selectedIndex) {
      this.tabGroup.selectedIndex = this.selectedIndex;
    }
  }

  /**
   * Save the idp-url again
   */
  public saveOptions(): void {
    if (this.form.valid) {
      this.leappCoreService.repository.getWorkspace().proxyConfiguration.proxyUrl = this.form.controls['proxyUrl'].value;
      this.leappCoreService.repository.getWorkspace().proxyConfiguration.proxyProtocol = this.form.controls['proxyProtocol'].value;
      this.leappCoreService.repository.getWorkspace().proxyConfiguration.proxyPort = this.form.controls['proxyPort'].value;
      this.leappCoreService.repository.getWorkspace().proxyConfiguration.username = this.form.controls['proxyUsername'].value;
      this.leappCoreService.repository.getWorkspace().proxyConfiguration.password = this.form.controls['proxyPassword'].value;
      this.leappCoreService.repository.updateProxyConfiguration(this.leappCoreService.repository.getWorkspace().proxyConfiguration);

      this.leappCoreService.repository.getWorkspace().defaultRegion = this.selectedRegion;
      this.leappCoreService.repository.updateDefaultRegion(this.leappCoreService.repository.getWorkspace().defaultRegion);

      this.leappCoreService.repository.getWorkspace().defaultLocation = this.selectedLocation;
      this.leappCoreService.repository.updateDefaultLocation(this.leappCoreService.repository.getWorkspace().defaultLocation);

      this.leappCoreService.repository.getWorkspace().macOsTerminal = this.selectedTerminal;
      this.leappCoreService.repository.updateMacOsTerminal(this.leappCoreService.repository.getWorkspace().macOsTerminal);

      if (this.checkIfNeedDialogBox()) {
        this.windowService.confirmDialog('You\'ve set a proxy url: the app must be restarted to update the configuration.', (res) => {
          if (res !== constants.confirmClosed) {
            this.leappCoreService.loggingService.logger('User have set a proxy url: the app must be restarted to update the configuration.', LoggerLevel.info, this);
            this.appService.restart();
          }
        }, 'Restart', 'Cancel');
      } else {
        this.appService.closeModal();
        this.leappCoreService.loggingService.logger('Option saved.', LoggerLevel.info, this, JSON.stringify(this.form.getRawValue(), null, 3));
        this.toasterService.toast('Option saved.', ToastLevel.info, 'Options');
      }
    }
  }

  /**
   * Check if we need a dialog box to request restarting the application
   */
  public checkIfNeedDialogBox(): boolean {
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
  public goBack(): void {
    this.router.navigate(['/dashboard']).then(() => {});
  }

  public manageIdpUrl(id: string): void {
    const idpUrl = this.leappCoreService.repository.getIdpUrl(id);
    if (this.form.get('idpUrl').value !== '') {
      if (!idpUrl) {
        this.leappCoreService.repository.addIdpUrl({ id: uuid.v4(), url: this.form.get('idpUrl').value });
      } else {
        this.leappCoreService.repository.updateIdpUrl(id, this.form.get('idpUrl').value);
      }
    }
    this.editingIdpUrl = false;
    this.idpUrlValue = undefined;
    this.form.get('idpUrl').setValue('');
  }

  public editIdpUrl(id: string): void {
    const idpUrl = this.leappCoreService.repository.getWorkspace().idpUrls.filter((u) => u.id === id)[0];
    this.idpUrlValue = idpUrl;
    this.form.get('idpUrl').setValue(idpUrl.url);
    this.editingIdpUrl = true;
  }

  public deleteIdpUrl(id: string): void {
    // Assumable sessions with this id
    this.sessionService = this.leappCoreService.sessionFactory.getSessionService(SessionType.awsIamRoleFederated);
    let sessions = this.leappCoreService.repository.getSessions().filter((s) => (s as AwsIamRoleFederatedSession).idpUrlId === id);

    // Add iam Role Chained from iam role iam_federated_role
    sessions.forEach((parent) => {
      const childs = this.leappCoreService.repository.listIamRoleChained(parent);
      sessions = sessions.concat(childs);
    });

    // Get only names for display
    let sessionsNames = sessions.map((s) =>
      `<li>
            <div class="removed-sessions">
            <b>${s.sessionName}</b> - <small>${(s as AwsIamRoleFederatedSession).roleArn.split('/')[1]}</small>
            </div>
      </li>`);

    if (sessionsNames.length === 0) {
      sessionsNames = ['<li><b>no sessions</b></li>'];
    }

    // Ask for deletion
    // eslint-disable-next-line max-len
    this.windowService.confirmDialog(`Deleting this IdP URL will also remove these sessions: <br><ul>${sessionsNames.join('')}</ul>Do you want to proceed?`, (res) => {
      if (res !== constants.confirmClosed) {
        this.leappCoreService.loggingService.logger(`Removing idp url with id: ${id}`, LoggerLevel.info, this);

        sessions.forEach((session) => {
          this.leappCoreService.repository.deleteSession(session.sessionId);
          this.leappCoreService.workspaceService.deleteSession(session.sessionId);
        });

        this.leappCoreService.repository.removeIdpUrl(id);
      }
    }, 'Delete IdP URL', 'Cancel');
  }

  public async manageAwsProfile(id: string | number): Promise<void> {

    const profileIndex = this.leappCoreService.repository.getWorkspace()
      .profiles
      .findIndex((p) => p.id === id.toString());

    if (this.form.get('awsProfile').value !== '') {
      if (profileIndex === -1) {
        this.leappCoreService.repository.addProfile({ id: uuid.v4(), name: this.form.get('awsProfile').value });
      } else {
        this.leappCoreService.repository.updateProfile(id.toString(), this.form.get('awsProfile').value);

        // eslint-disable-next-line @typescript-eslint/prefer-for-of
        for (let i = 0; i < this.leappCoreService.workspaceService.sessions.length; i++) {
          const sess = this.leappCoreService.workspaceService.sessions[i];
          this.sessionService = this.leappCoreService.sessionFactory.getSessionService(sess.type);

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

  public editAwsProfile(id: string): void {
    const profile = this.leappCoreService.repository.getWorkspace().profiles.filter((u) => u.id === id)[0];
    this.awsProfileValue = profile;
    this.form.get('awsProfile').setValue(profile.name);
    this.editingAwsProfile = true;
  }

  public deleteAwsProfile(id: string): void {
    // With profile
    const sessions = this.leappCoreService.repository.getSessions().filter((sess) => (sess as any).profileId === id);

    // Get only names for display
    let sessionsNames = sessions.map((s) => `<li><div class="removed-sessions"><b>${s.sessionName}</b> - <small>${(s as AwsIamRoleFederatedSession).roleArn ? (s as AwsIamRoleFederatedSession).roleArn.split('/')[1] : ''}</small></div></li>`);
    if (sessionsNames.length === 0) {
      sessionsNames = ['<li><b>no sessions</b></li>'];
    }

    // Ask for deletion
    // eslint-disable-next-line max-len
    this.windowService.confirmDialog(`Deleting this profile will set default to these sessions: <br><ul>${sessionsNames.join('')}</ul>Do you want to proceed?`, async (res) => {
      if (res !== constants.confirmClosed) {
        this.leappCoreService.loggingService.logger(`Reverting to default profile with id: ${id}`, LoggerLevel.info, this);

        // Reverting all sessions to default profile
        // eslint-disable-next-line @typescript-eslint/prefer-for-of
        for(let i = 0; i < sessions.length; i++) {
          const sess = sessions[i];
          this.sessionService = this.leappCoreService.sessionFactory.getSessionService(sess.type);

          let wasActive = false;
          if ((sess as any).status === SessionStatus.active) {
            wasActive = true;
            await this.sessionService.stop(sess.sessionId);
          }

          (sess as any).profileId = this.leappCoreService.repository.getDefaultProfileId();

          this.leappCoreService.repository.updateSession(sess.sessionId, sess);
          this.leappCoreService.workspaceService.updateSession(sess.sessionId, sess);
          if(wasActive) {
            this.sessionService.start(sess.sessionId);
          }
        }

        this.leappCoreService.repository.removeProfile(id);
      }
    }, 'Delete Profile', 'Cancel');
  }
}
