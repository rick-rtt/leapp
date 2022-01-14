import { Component, OnInit } from '@angular/core'
import { AppService } from '../../../services/app.service'
import { LoggerLevel, LoggingService } from '@noovolari/leapp-core/services/logging-service'
import { LeappCoreService } from '../../../services/leapp-core.service'

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  private loggingService: LoggingService
  private profileIsOpen = false

  constructor(leappCoreServices: LeappCoreService, private appService: AppService) {
    this.loggingService = leappCoreServices.loggingService
  }

  ngOnInit() {
    this.appService.profileOpen.subscribe(res => {
      this.profileIsOpen = res
    })
  }

  toggleProfile() {
    this.profileIsOpen = !this.profileIsOpen // Toggle status
    this.appService.profileOpen.emit(this.profileIsOpen) // Emit event for screen
    this.loggingService.logger(`Profile open emitting: ${this.profileIsOpen}`, LoggerLevel.info, this)
  }
}
