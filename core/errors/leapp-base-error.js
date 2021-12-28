export class LeappBaseError extends Error {
    constructor(name, context, severity, message) {
        super(message);
        this.name = name;
        this._context = context;
        this._severity = severity;
        Object.setPrototypeOf(this, new.target.prototype);
    }
    get severity() {
        return this._severity;
    }
    get context() {
        return this._context;
    }
}
//# sourceMappingURL=leapp-base-error.js.map