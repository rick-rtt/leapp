export class TimerService {

  private static instance: TimerService;
  private _timer: NodeJS.Timeout;
  private timeInterval = 10000;

  private constructor() { }

  static getInstance(): TimerService {
    if(!this.instance) {
      this.instance = new TimerService();
    }
    return this.instance;
  }

  set timer(value: NodeJS.Timeout) {
    this._timer = value;
  }

  get timer(): NodeJS.Timeout {
    return this._timer;
  }

  start(callback: () => void) {
    if (!this.timer) {
      this.timer = setInterval(() => {
        callback();
      }, this.timeInterval);
    }
  }
}
