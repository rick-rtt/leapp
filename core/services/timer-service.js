export class TimerService {
    constructor() {
        this.timeInterval = 10000;
    }
    static getInstance() {
        if (!this.instance) {
            this.instance = new TimerService();
        }
        return this.instance;
    }
    set timer(value) {
        this._timer = value;
    }
    get timer() {
        return this._timer;
    }
    start(callback) {
        if (!this.timer) {
            this.timer = setInterval(() => {
                callback();
            }, this.timeInterval);
        }
    }
}
//# sourceMappingURL=timer-service.js.map