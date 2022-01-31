import { Component, ElementRef, Input, OnInit, ViewChild } from '@angular/core'
import { FormControl, FormGroup, Validators } from '@angular/forms'

import { ActivatedRoute, Router } from '@angular/router'
import { AwsNamedProfile } from '@noovolari/leapp-core/models/aws-named-profile'
import { AwsIamRoleChainedSessionRequest } from '@noovolari/leapp-core/services/session/aws/aws-iam-role-chained-session-request'
import { AwsIamRoleFederatedSessionRequest } from '@noovolari/leapp-core/services/session/aws/aws-iam-role-federated-session-request'
import { AwsIamUserSessionRequest } from '@noovolari/leapp-core/services/session/aws/aws-iam-user-session-request'
import { AzureSessionRequest } from '@noovolari/leapp-core/services/session/azure/azure-session-request'
import * as uuid from 'uuid'
import { SessionType } from '@noovolari/leapp-core/models/session-type'
import { Repository } from '@noovolari/leapp-core/services/repository'
import { LoggerLevel, LoggingService } from '@noovolari/leapp-core/services/logging-service'
import { WorkspaceService } from '@noovolari/leapp-core/services/workspace.service'
import { LeappParseError } from '@noovolari/leapp-core/errors/leapp-parse-error'
import { AwsIamUserService } from '@noovolari/leapp-core/services/session/aws/aws-iam-user-service'
import { AwsIamRoleFederatedService } from '@noovolari/leapp-core/services/session/aws/aws-iam-role-federated-service'
import { LeappCoreService } from '../../services/leapp-core.service'
import { AwsIamRoleChainedService } from '@noovolari/leapp-core/services/session/aws/aws-iam-role-chained-service'
import { AzureService } from '@noovolari/leapp-core/services/session/azure/azure.service'
import { SessionFactory } from '@noovolari/leapp-core/services/session-factory'
import { WindowService } from '../../services/window.service'
import { AzureCoreService } from '@noovolari/leapp-core/services/azure-core.service'
import { AwsCoreService } from '@noovolari/leapp-core/services/aws-core-service'
import { constants } from '@noovolari/leapp-core/models/constants'

@Component({
  selector: 'app-create-account',
  templateUrl: './create-account.component.html',
  styleUrls: ['./create-account.component.scss']
})
export class CreateAccountComponent implements OnInit {

  @Input() selectedSession
  @Input() selectedAccountNumber = ''
  @Input() selectedRole = ''
  @Input() selectedSamlUrl = ''

  @ViewChild('roleInput', {static: false}) roleInput: ElementRef

  firstTime = false
  providerSelected = false
  typeSelection = false
  hasOneGoodSession = false
  hasSsoUrl = false

  sessionType
  provider

  idpUrls: { value: string; label: string }[] = []
  selectedIdpUrl: { value: string; label: string }

  profiles: { value: string; label: string }[] = []
  selectedProfile: { value: string; label: string }

  assumerAwsSessions = []

  regions = []
  selectedRegion
  locations = []
  selectedLocation

  eSessionType = SessionType

  public form = new FormGroup({
    idpArn: new FormControl('', [Validators.required]),
    accountNumber: new FormControl('', [Validators.required, Validators.maxLength(12), Validators.minLength(12)]),
    subscriptionId: new FormControl('', [Validators.required]),
    tenantId: new FormControl('', [Validators.required]),
    name: new FormControl('', [Validators.required]),
    role: new FormControl('', [Validators.required]),
    roleArn: new FormControl('', [Validators.required]),
    roleSessionName: new FormControl('', [Validators.pattern('[a-zA-Z\\d\\-\\_\\@\\=\\,\\.]+')]),
    federatedOrIamRoleChained: new FormControl('', [Validators.required]),
    federatedRole: new FormControl('', [Validators.required]),
    federationUrl: new FormControl('', [Validators.required, Validators.pattern('https?://.+')]),
    secretKey: new FormControl('', [Validators.required]),
    accessKey: new FormControl('', [Validators.required]),
    awsRegion: new FormControl(''),
    mfaDevice: new FormControl(''),
    awsProfile: new FormControl('', [Validators.required]),
    azureLocation: new FormControl('', [Validators.required]),
    assumerSession: new FormControl('', [Validators.required])
  })

  private workspaceService: WorkspaceService
  private repository: Repository
  private loggingService: LoggingService
  private sessionFactory: SessionFactory
  private azureCoreService: AzureCoreService
  private awsCoreService: AwsCoreService

  constructor(private router: Router, private activatedRoute: ActivatedRoute, private windowService: WindowService,
              leappCoreService: LeappCoreService) {
    this.repository = leappCoreService.repository
    this.loggingService = leappCoreService.loggingService
    this.workspaceService = leappCoreService.workspaceService
    this.sessionFactory = leappCoreService.sessionFactory
    this.azureCoreService = leappCoreService.azureCoreService
    this.awsCoreService = leappCoreService.awsCoreService
  }

  ngOnInit() {

    this.activatedRoute.queryParams.subscribe(params => {
      // We get all the applicable idp urls
      if (this.repository.getIdpUrls() && this.repository.getIdpUrls().length > 0) {
        this.repository.getIdpUrls().forEach(idp => {
          if (idp !== null) {
            this.idpUrls.push({value: idp.id, label: idp.url})
          }
        })
      }

      // We got all the applicable profiles
      // Note: we don't use azure profile so we remove default azure profile from the list
      this.repository.getProfiles().forEach(idp => {
        if (idp !== null && idp.name !== constants.defaultAzureProfileName) {
          this.profiles.push({value: idp.id, label: idp.name})
        }
      })

      // This way we also fix potential incongruences when you have half saved setup
      this.hasOneGoodSession = this.workspaceService.sessions.length > 0
      this.firstTime = params['firstTime'] || !this.hasOneGoodSession

      // Show the assumable accounts
      this.assumerAwsSessions = this.workspaceService.listAssumable().map(session => ({
        sessionName: session.sessionName,
        session
      }))

      // Only for start screen: disable IAM Chained creation
      if (this.firstTime) {
        this.form.controls['federatedOrIamRoleChained'].disable({onlySelf: true})
      }

      // Get all regions and locations from app service lists
      this.regions = this.awsCoreService.getRegions()
      this.locations = this.azureCoreService.getLocations()

      // Select default values
      this.selectedRegion = this.repository.getDefaultRegion() || constants.defaultRegion || this.regions[0].region
      this.selectedLocation = this.repository.getDefaultLocation() || constants.defaultLocation || this.locations[0].location
      this.selectedProfile = this.repository.getProfiles().filter(p => p.name === 'default').map(p => ({
        value: p.id,
        label: p.name
      }))[0]
    })
  }

  /**
   * Add a new single sing-on url to list
   *
   * @param tag
   */
  addNewSSO(tag: string): { value: string; label: string } {
    return {value: uuid.v4(), label: tag}
  }

  /**
   * Add a new profile to list
   *
   * @param tag
   */
  addNewProfile(tag: string): { value: string; label: string } {
    return {value: uuid.v4(), label: tag}
  }

  /**
   * Save the first account in the workspace
   */
  saveSession() {
    this.loggingService.logger(`Saving account...`, LoggerLevel.info, this)
    this.addProfileToWorkspace()
    this.saveNewSsoRolesToWorkspace()
    this.createSession()
    this.router.navigate(['/sessions', 'session-selected']).then(_ => {
    })
  }

  /**
   * Form validation mechanic
   */
  formValid() {
    // TODO: validate form
    return true
  }

  /**
   * First step of the wizard: set the Cloud provider or go to the SSO integration
   *
   * @param name
   */
  setProvider(name) {
    this.provider = name
    this.providerSelected = true
    if (name === SessionType.azure) {
      this.sessionType = SessionType.azure
    }
    if (name === SessionType.awsIamRoleFederated) {
      this.typeSelection = true
    }
  }

  /**
   * Second step of wizard: set the strategy in the UI
   *
   * @param strategy
   */
  setAccessStrategy(strategy) {
    this.sessionType = strategy
    this.provider = strategy
    this.typeSelection = false
  }

  /**
   * Open the Leapp documentation in the default browser
   *
   */
  openAccessStrategyDocumentation() {
    this.windowService.openExternalUrl('https://github.com/Noovolari/leapp/wiki')
  }

  /**
   * Go to the Single Sing-On integration page
   *
   */
  goToAwsSso() {
    this.router.navigate(['/', 'aws-sso']).then(_ => {
    })
  }

  /**
   * Go to Session Selection screen or to first stage of wizard
   * depending if if there are sessions already or not
   *
   */
  goBack() {
    this.router.navigate(['/sessions', 'session-selected']).then(_ => {
    })
  }

  /**
   * Save actual session based on Session Type
   *
   * @private
   */
  private async createSession() {
    const sessionService = this.sessionFactory.getSessionService(this.sessionType)
    if (sessionService instanceof AwsIamRoleFederatedService) {
      const awsFederatedAccountRequest: AwsIamRoleFederatedSessionRequest = {
        sessionName: this.form.value.name.trim(),
        region: this.selectedRegion,
        idpUrl: this.selectedIdpUrl.value.trim(),
        idpArn: this.form.value.idpArn.trim(),
        roleArn: this.form.value.roleArn.trim(),
        profileId: this.selectedProfile.value
      }
      await sessionService.create(awsFederatedAccountRequest)
    } else if (sessionService instanceof AwsIamUserService) {
      const awsIamUserSessionRequest: AwsIamUserSessionRequest = {
        sessionName: this.form.value.name.trim(),
        region: this.selectedRegion,
        accessKey: this.form.value.accessKey.trim(),
        secretKey: this.form.value.secretKey.trim(),
        mfaDevice: this.form.value.mfaDevice.trim(),
        profileId: this.selectedProfile.value
      }
      await sessionService.create(awsIamUserSessionRequest)
    } else if (sessionService instanceof AwsIamRoleChainedService) {
      const awsIamRoleChainedAccountRequest: AwsIamRoleChainedSessionRequest = {
        sessionName: this.form.value.name.trim(),
        region: this.selectedRegion,
        roleArn: this.form.value.roleArn.trim(),
        roleSessionName: this.form.value.roleSessionName.trim(),
        parentSessionId: this.selectedSession.sessionId,
        profileId: this.selectedProfile.value
      }
      await sessionService.create(awsIamRoleChainedAccountRequest)
    } else if (sessionService instanceof AzureService) {
      const azureSessionRequest: AzureSessionRequest = {
        sessionName: this.form.value.name,
        region: this.selectedLocation,
        subscriptionId: this.form.value.subscriptionId,
        tenantId: this.form.value.tenantId
      }
      await sessionService.create(azureSessionRequest)
    }
  }

  /**
   * Save a new Single Sign on object in workspace if new
   *
   * @private
   */
  private saveNewSsoRolesToWorkspace() {
    if (this.sessionType === SessionType.awsIamRoleFederated) {
      try {
        const ipdUrl = {id: this.selectedIdpUrl.value, url: this.selectedIdpUrl.label}
        if (!this.repository.getIdpUrl(ipdUrl.id)) {
          this.repository.addIdpUrl(ipdUrl)
        }
      } catch (err) {
        throw new LeappParseError(this, err.message)
      }
    }
  }

  /**
   * Save a New profile if is not in the workspace
   *
   * @private
   */
  private addProfileToWorkspace() {
    try {
      const profile = new AwsNamedProfile(this.selectedProfile.value, this.selectedProfile.label)
      if (!this.repository.getProfileName(profile.id)) {
        this.repository.addProfile(profile)
      }
    } catch (err) {
      throw new LeappParseError(this, err.message)
    }
  }
}
