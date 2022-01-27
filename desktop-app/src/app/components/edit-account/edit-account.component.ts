import { Component, ElementRef, OnInit, ViewChild } from '@angular/core'
import { FormControl, FormGroup, Validators } from '@angular/forms'
import { ActivatedRoute, Router } from '@angular/router'
import { environment } from '../../../environments/environment'
import { SessionType } from '@noovolari/leapp-core/models/session-type'
import { AwsIamUserSession } from '@noovolari/leapp-core/models/aws-iam-user-session'
import { Workspace } from '@noovolari/leapp-core/models/workspace'
import { KeychainService } from '@noovolari/leapp-core/services/keychain-service'
import { WorkspaceService } from '@noovolari/leapp-core/services/workspace.service'
import { LeappCoreService } from '../../services/leapp-core.service'
import { WindowService } from '../../services/window.service'
import { AwsCoreService } from '@noovolari/leapp-core/services/aws-core-service'
import { MessageToasterService, ToastLevel } from '../../services/message-toaster.service'
import { constants } from '@noovolari/leapp-core/models/constants'

@Component({
  selector: 'app-edit-account',
  templateUrl: './edit-account.component.html',
  styleUrls: ['./edit-account.component.scss']
})
export class EditAccountComponent implements OnInit {
  @ViewChild('roleInput', {static: false}) roleInput: ElementRef

  accountType = SessionType.awsIamUser
  provider = SessionType.awsIamRoleFederated
  selectedSession: AwsIamUserSession

  selectedAccountNumber = ''
  selectedRole = ''
  selectedRegion
  regions = []

  workspace: Workspace

  public form = new FormGroup({
    secretKey: new FormControl('', [Validators.required]),
    accessKey: new FormControl('', [Validators.required]),
    name: new FormControl('', [Validators.required]),
    awsRegion: new FormControl(''),
    mfaDevice: new FormControl('')
  })

  private keychainService: KeychainService
  private workspaceService: WorkspaceService
  private awsCoreService: AwsCoreService

  /* Setup the first account for the application */
  constructor(private router: Router, private activatedRoute: ActivatedRoute, private windowService: WindowService,
              private messageToasterService: MessageToasterService, leappCoreService: LeappCoreService) {
    this.keychainService = leappCoreService.keyChainService
    this.workspaceService = leappCoreService.workspaceService
    this.awsCoreService = leappCoreService.awsCoreService
  }

  ngOnInit() {
    this.activatedRoute.queryParams.subscribe(params => {
      // Get the workspace and the account you need
      this.selectedSession = this.workspaceService.sessions.find(session => session.sessionId === params.sessionId) as AwsIamUserSession

      // Get the region
      this.regions = this.awsCoreService.getRegions()
      this.selectedRegion = this.regions.find(r => r.region === this.selectedSession.region).region
      this.form.controls['awsRegion'].setValue(this.selectedRegion)

      // Get other readonly properties
      this.form.controls['name'].setValue(this.selectedSession.sessionName)
      this.form.controls['mfaDevice'].setValue(this.selectedSession.mfaDevice)
    })
  }

  /**
   * Save the edited account in the workspace
   */
  saveAccount() {
    if (this.form.valid) {
      this.selectedSession.sessionName = this.form.controls['name'].value
      this.selectedSession.region = this.selectedRegion
      this.selectedSession.mfaDevice = this.form.controls['mfaDevice'].value
      this.keychainService.saveSecret(constants.appName, `${this.selectedSession.sessionId}-iam-user-aws-session-access-key-id`, this.form.controls['accessKey'].value).then(_ => {
      })
      this.keychainService.saveSecret(constants.appName, `${this.selectedSession.sessionId}-iam-user-aws-session-secret-access-key`, this.form.controls['secretKey'].value).then(_ => {
      })

      this.workspaceService.updateSession(this.selectedSession.sessionId, this.selectedSession)
      this.messageToasterService.toast('Session updated correctly.', ToastLevel.success, 'Session Update')

      this.router.navigate(['/sessions', 'session-selected']).then(_ => {
      })
    }
  }

  formValid() {
    // TODO: Implement form validation
    return true
  }

  goBack() {
    this.router.navigate(['/sessions', 'session-selected']).then(_ => {
    })
  }

  openAccessStrategyDocumentation() {
    this.windowService.openExternalUrl('https://github.com/Noovolari/leapp/blob/master/README.md')
  }
}
