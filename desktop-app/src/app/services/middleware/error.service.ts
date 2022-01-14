import {ErrorHandler, Injectable, Injector} from '@angular/core';
import {AppService} from '../app.service';
import {LoggingService} from '@noovolari/leapp-core/services/logging-service';
import {LeappBaseError} from '@noovolari/leapp-core/errors/leapp-base-error';
import { LeappCoreService } from '../leapp-core.service'

@Injectable({
  providedIn: 'root'
})
export class ErrorService implements ErrorHandler {
  private loggingService: LoggingService

  constructor(private injector: Injector, private leappCoreService: LeappCoreService) {
    this.loggingService = leappCoreService.loggingService
  }

  handleError(error: any): void {
    error = error.rejection ? error.rejection : error;
    const appService = this.injector.get(AppService);

    this.loggingService.logger((error as LeappBaseError).message, (error as LeappBaseError).severity,
      (error as LeappBaseError).context, (error as LeappBaseError).stack);

    appService.toast((error as LeappBaseError).message, (error as LeappBaseError).severity, (error as LeappBaseError).name);
  }
}
