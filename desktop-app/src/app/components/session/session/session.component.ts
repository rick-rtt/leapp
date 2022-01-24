import { Component, ElementRef, OnInit, ViewChild } from '@angular/core'
import { ActivatedRoute, Router } from '@angular/router'
import { HttpClient } from '@angular/common/http'
import { BsModalService } from 'ngx-bootstrap/modal'
import { Workspace } from '@noovolari/leapp-core/models/Workspace'
import { Repository } from '@noovolari/leapp-core/services/repository'
import { WorkspaceService } from '@noovolari/leapp-core/services/workspace.service'
import { LeappCoreService } from '../../../services/leapp-core.service'
import { AwsCoreService } from '@noovolari/leapp-core/services/aws-core-service'

@Component({
  selector: 'app-session',
  templateUrl: './session.component.html',
  styleUrls: ['./session.component.scss']
})
export class SessionComponent implements OnInit {

  @ViewChild('filterField', {static: false})
  filterField: ElementRef

  // Data for the select
  modalAccounts = []
  currentSelectedColor
  currentSelectedAccountNumber

  // Ssm instances
  ssmloading = true
  ssmRegions = []
  instances = []

  // Connection retries
  allSessions
  showOnly = 'ALL'

  workspace: Workspace
  repository: Repository
  workspaceService: WorkspaceService
  private awsCoreService: AwsCoreService

  constructor(private router: Router, private route: ActivatedRoute, private httpClient: HttpClient,
              private modalService: BsModalService, leappCoreService: LeappCoreService) {
    this.repository = leappCoreService.repository
    this.workspaceService = leappCoreService.workspaceService
    this.awsCoreService = leappCoreService.awsCoreService
  }

  ngOnInit() {
    // Set regions for ssm
    this.ssmRegions = this.awsCoreService.getRegions()
  }

  /**
   * Go to Account Management
   */
  createAccount() {
    // Go! Golang?!? XD
    this.router.navigate(['/managing', 'create-account']).then(_ => {
    })
  }

  setVisibility(name) {
    if (this.showOnly === name) {
      this.showOnly = 'ALL'
    } else {
      this.showOnly = name
    }
  }
}
