export class TimerService {
  private timeOutTimer: NodeJS.Timeout
  private timeInterval = 10000

  public constructor() {
  }

  set timer(value: NodeJS.Timeout) {
    this.timeOutTimer = value
  }

  get timer(): NodeJS.Timeout {
    return this.timeOutTimer
  }

  start(callback: () => void) {
    if (!this.timer) {
      this.timer = setInterval(() => {
        callback()
      }, this.timeInterval)
    }
  }
}
