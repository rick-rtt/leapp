import { Injectable } from '@angular/core';
import { LoggerLevel } from '@noovolari/leapp-core/services/logging-service';
import { ToastrService } from 'ngx-toastr';

export enum ToastLevel {
  info,
  warn,
  error,
  success
}

@Injectable({providedIn: 'root'})
export class MessageToasterService {

  constructor(private toastr: ToastrService) {}

  /**
   * Show a toast message with different styles for different type of toast
   *
   * @param message - the message to show
   * @param type - the type of message from Toast Level
   * @param title - [optional]
   */
  toast(message: string, type: ToastLevel | LoggerLevel, title?: string): void {
    switch (type) {
      case ToastLevel.success:
        this.toastr.success(message, title);
        break;
      case ToastLevel.info || LoggerLevel.info:
        this.toastr.info(message, title);
        break;
      case ToastLevel.warn || LoggerLevel.warn:
        this.toastr.warning(message, title);
        break;
      case ToastLevel.error || LoggerLevel.error:
        this.toastr.error(message, title ? title : 'Invalid Action!');
        break;
      default:
        this.toastr.error(message, title);
        break;
    }
  }
}
