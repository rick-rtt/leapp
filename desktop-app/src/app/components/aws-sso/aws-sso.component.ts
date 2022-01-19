import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {AppService} from '../../services/app.service';
import {AwsSsoOidcService, BrowserWindowClosing} from '../../services/aws-sso-oidc.service';
import { Repository } from '@noovolari/leapp-core/services/repository';
import { WorkspaceService } from '@noovolari/leapp-core/services/workspace.service';
import {constants} from '@noovolari/leapp-core/models/constants';
import {AwsSsoRoleService, SsoRoleSession} from "../../services/session/aws/method/aws-sso-role-service";
import { LeappCoreService } from '../../services/leapp-core.service'

@Component({
  selector: 'app-aws-sso',
  templateUrl: './aws-sso.component.html',
  styleUrls: ['./aws-sso.component.scss']
})
export class AwsSsoComponent implements OnInit, BrowserWindowClosing {

  eConstants = constants;
  isAwsSsoActive: boolean;
  regions = [];
  selectedRegion;
  portalUrl;
  loadingInBrowser = false;
  loadingInApp = false;
  selectedBrowserOpening: string;

  public form = new FormGroup({
    portalUrl: new FormControl('', [Validators.required, Validators.pattern('https?://.+')]),
    awsRegion: new FormControl('', [Validators.required]),
    defaultBrowserOpening: new FormControl('', [Validators.required])
  });

  private repository: Repository
  private workspaceService: WorkspaceService

  constructor(private appService: AppService, private awsSsoRoleService: AwsSsoRoleService, private router: Router,
              private awsSsoOidcService: AwsSsoOidcService, leappCoreService: LeappCoreService) {
    this.repository = leappCoreService.repository
    this.workspaceService = leappCoreService.workspaceService
  }

  ngOnInit() {
    this.awsSsoOidcService.listeners.push(this);

    this.awsSsoRoleService.awsSsoActive().then(res => {
      this.isAwsSsoActive = res;
      this.loadingInBrowser = false;
      this.loadingInApp = false;
      this.setValues();
    });
  }

  async login() {
    if (this.form.valid && !this.loadingInApp) {
      this.loadingInBrowser = (this.selectedBrowserOpening === constants.inBrowser.toString());
      this.loadingInApp = (this.selectedBrowserOpening === constants.inApp.toString());

      this.repository.setAwsSsoConfiguration(
        this.selectedRegion,
        this.form.value.portalUrl,
        this.selectedBrowserOpening,
        this.repository.getAwsSsoConfiguration().expirationTime
      );

      try {
        const ssoRoleSessions: SsoRoleSession[] = await this.awsSsoRoleService.sync();
        ssoRoleSessions.forEach(ssoRoleSession => {
          this.awsSsoRoleService.create(ssoRoleSession, this.repository.getDefaultProfileId());
        });
        this.router.navigate(['/sessions', 'session-selected']);
        this.loadingInBrowser = false;
        this.loadingInApp = false;
      } catch (err) {
        await this.logout();
        throw err;
      }
    }
  }

  async logout() {
    await this.awsSsoRoleService.logout();
    this.isAwsSsoActive = false;
    this.loadingInBrowser = false;
    this.loadingInApp = false;
    this.setValues();
  }

  async forceSync() {
    try {
      const ssoRoleSessions: SsoRoleSession[] = await this.awsSsoRoleService.sync();
      ssoRoleSessions.forEach(ssoRoleSession => {
        this.awsSsoRoleService.create(ssoRoleSession, ssoRoleSession.profileId);
      });
      this.router.navigate(['/sessions', 'session-selected']);
      this.loadingInBrowser = false;
      this.loadingInApp = false;
    } catch(err) {
      await this.logout();
      throw err;
    }
  }

  async goBack() {
    await this.router.navigate(['/sessions', 'session-selected']);
  }

  gotoWebForm() {
    this.awsSsoOidcService.interrupt();
    this.login();
  }

  setValues() {
    this.regions = this.appService.getRegions();
    const region = this.repository.getAwsSsoConfiguration().region;
    const portalUrl = this.repository.getAwsSsoConfiguration().portalUrl;
    this.selectedBrowserOpening = this.repository.getAwsSsoConfiguration().browserOpening || constants.inApp;

    this.selectedRegion = region || this.regions[0].region;
    this.portalUrl = portalUrl;
    this.form.controls['portalUrl'].setValue(portalUrl);
  }

  closeLoadingScreen() {
    this.awsSsoOidcService.interrupt();
    this.loadingInBrowser = false;
    this.loadingInApp = false;
  }

  catchClosingBrowserWindow(): void {
    this.loadingInBrowser = false;
    this.loadingInApp = false;
  }
}
