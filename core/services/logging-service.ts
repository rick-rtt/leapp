import {environment} from '../../src/environments/environment';
import NativeService from './native-service';

/*
* External enum to the logger level so we can use this to define the type of log
*/
export enum LoggerLevel {
  info,
  warn,
  error
}

export class LoggingService {

  static instance: LoggingService;

  private constructor() {}

  static getInstance() {
    if(!this.instance) {
      this.instance = new LoggingService();
    }
    return this.instance;
  }

  /**
   * Log the message to a file and also to console for development mode
   *
   * @param message - the message to log
   * @param type - the LoggerLevel type
   * @param instance - The structured data of the message
   * @param stackTrace - Stack trace in case of error log
   */
  logger(message: any, type: LoggerLevel, instance?: any, stackTrace?: string) {
    if (typeof message !== 'string') {
      message = JSON.stringify(message, null, 3);
    }

    if (instance) {
      message = `[${instance.constructor['name']}] ${message}`;
    }

    if (stackTrace) {
      message = `${message} ${stackTrace}`;
    }

    switch (type) {
      case LoggerLevel.info:
        if (!environment.production) {
          NativeService.getInstance().log.info(message);
        }
        break;
      case LoggerLevel.warn:
        if (!environment.production) {
          NativeService.getInstance().log.warn(message);
        }
        break;
      case LoggerLevel.error:
        NativeService.getInstance().log.error(message);
        break;
      default:
        if (!environment.production) {
          NativeService.getInstance().log.error(message);
        }
        break;
    }
  }
}
