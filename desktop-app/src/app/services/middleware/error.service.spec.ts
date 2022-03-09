import { TestBed } from "@angular/core/testing";

import { ErrorService } from "./error.service";
import { mustInjected } from "../../../base-injectables";
import { ToastrModule } from "ngx-toastr";
import { LeappBaseError } from "@noovolari/leapp-core/errors/leapp-base-error";
import { ErrorHandler } from "@angular/core";
import { AppModule } from "../../app.module";
import { LoggerLevel } from "@noovolari/leapp-core/services/logging-service";
import { LeappCoreService } from "../leapp-core.service";
import { MessageToasterService } from "../message-toaster.service";

describe("ErrorService", () => {
  let spyLeapCoreService;
  let spyMessageToasterService;
  let spyLoggingService;
  let errorService;
  let handler;

  beforeEach(() => {
    spyLoggingService = jasmine.createSpyObj("LoggingService", ["logger"]);
    spyLoggingService.logger.and.returnValue(true);
    spyLeapCoreService = jasmine.createSpyObj("LeapCoreService", [], ["loggingService"]);
    const loggingServiceGetter = Object.getOwnPropertyDescriptor(spyLeapCoreService, "loggingService").get as any;
    loggingServiceGetter.and.returnValue(spyLoggingService);
    spyMessageToasterService = jasmine.createSpyObj("MessageToasterService", ["toast"]);
    spyMessageToasterService.toast.and.returnValue(true);

    handler = TestBed.configureTestingModule({
      imports: [AppModule, ToastrModule.forRoot()],
      providers: [
        { provide: ErrorHandler, useClass: ErrorService },
        { provide: LeappCoreService, useValue: spyLeapCoreService },
        { provide: MessageToasterService, useValue: spyMessageToasterService },
      ].concat(mustInjected()),
    }).inject(ErrorHandler) as any;

    errorService = TestBed.inject(ErrorService);
  });

  it("Create Instance", () => {
    expect(errorService).toBeTruthy();
  });

  it("should call the Error Handler is an error is thrown in code", () => {
    const spyErrorHandler = spyOn(errorService, "handleError");
    const error = new LeappBaseError("Mock Error", "testing", LoggerLevel.warn, "custom test message");
    errorService.handleError(error);
    expect(spyErrorHandler).toHaveBeenCalled();
  });

  it("should call logger and toast", () => {
    const error = new LeappBaseError("Mock Error", "testing", LoggerLevel.warn, "custom test message");
    errorService.handleError(error);

    expect(spyLoggingService.logger).toHaveBeenCalled();
    expect(spyMessageToasterService.toast).toHaveBeenCalled();
  });

  it("should be registered on the AppModule", () => {
    expect(handler).toEqual(jasmine.any(ErrorService));
  });
});
