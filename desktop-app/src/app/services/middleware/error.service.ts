import {ErrorHandler, Injectable, Injector} from '@angular/core';
import {LeappBaseError} from '../../../../core/errors/leapp-base-error';
import {LoggingService} from '../../../../core/services/logging-service';
import {AppService} from '../app.service';

@Injectable({
  providedIn: 'root'
})
export class ErrorService implements ErrorHandler {

  constructor(private injector: Injector) { }

  handleError(error: any): void {
    error = error.rejection ? error.rejection : error;
    const loggingService = LoggingService.getInstance();
    const appService = this.injector.get(AppService);

    loggingService.logger((error as LeappBaseError).message, (error as LeappBaseError).severity, (error as LeappBaseError).context, (error as LeappBaseError).stack);
    appService.toast((error as LeappBaseError).message, (error as LeappBaseError).severity, (error as LeappBaseError).name);
  }
}
