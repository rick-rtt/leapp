var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Component, Input } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { constants } from "../../../../../../core/models/constants";
let InputDialogComponent = class InputDialogComponent {
    /* Just a restyled modal to show a confirmation for delete actions */
    constructor(bsModalRef) {
        this.bsModalRef = bsModalRef;
        this.form = new FormGroup({
            value: new FormControl('', [Validators.required])
        });
    }
    ngOnInit() {
    }
    /**
     * Launch a callback on yes (which is the actual action), then close
     */
    confirm() {
        if (this.callback && this.form.valid) {
            this.callback(this.form.value.value);
            this.bsModalRef.hide();
        }
    }
    close() {
        this.callback(constants.confirmClosed);
        this.bsModalRef.hide();
    }
};
__decorate([
    Input()
], InputDialogComponent.prototype, "title", void 0);
__decorate([
    Input()
], InputDialogComponent.prototype, "message", void 0);
__decorate([
    Input()
], InputDialogComponent.prototype, "placeholder", void 0);
__decorate([
    Input()
], InputDialogComponent.prototype, "callback", void 0);
InputDialogComponent = __decorate([
    Component({
        selector: 'app-input-dialog',
        templateUrl: './input-dialog.component.html',
        styleUrls: ['./input-dialog.component.scss']
    })
], InputDialogComponent);
export { InputDialogComponent };
//# sourceMappingURL=input-dialog.component.js.map