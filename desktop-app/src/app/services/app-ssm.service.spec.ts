import { TestBed } from "@angular/core/testing";

import { AppSsmService } from "./app-ssm.service";
import { mustInjected } from "../../base-injectables";
import { AppProviderService } from "./app-provider.service";
import SpyObj = jasmine.SpyObj;
import { CredentialsInfo } from "@noovolari/leapp-core/models/credentials-info";
import { AppService } from "./app.service";

describe("SsmService", () => {
  let service: AppSsmService;
  let leappCoreService: SpyObj<AppProviderService>;

  beforeEach(() => {
    leappCoreService = jasmine.createSpyObj("LeappCoreService", [], {
      ssmService: {
        getSsmInstances: (_0: CredentialsInfo, _1: string, _2?: any) => {},
        startSession: (_0: CredentialsInfo, _1: string, _2: string) => {},
      },
      loggingService: {},
      executeService: {},
    });

    TestBed.configureTestingModule({
      providers: [AppService].concat(mustInjected()),
    });

    service = TestBed.inject(AppSsmService);
    (service as any).coreSsmService = leappCoreService.ssmService;
    (service as any).loggingService = leappCoreService.loggingService;
    (service as any).executeService = leappCoreService.executeService;
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });

  it("should call getSsmInstances on core method passing a credential info object and a region", () => {
    const spyGetSsmInstances = spyOn(leappCoreService.ssmService, "getSsmInstances").and.callThrough();
    const appService: AppService = TestBed.inject(AppService);
    const credentials: CredentialsInfo = { sessionToken: "abcdefghi" };

    service.getSsmInstances(credentials, "eu-west-1");
    expect(spyGetSsmInstances).toHaveBeenCalledOnceWith(credentials, "eu-west-1", appService.setFilteringForEc2Calls);
  });

  it("should call startSession on core method passing a credential info object, an instance id and a region", () => {
    const spyGetSsmStartSession = spyOn(leappCoreService.ssmService, "startSession").and.callThrough();
    const credentials: CredentialsInfo = { sessionToken: "abcdefghi" };

    service.startSession(credentials, "instance-id", "eu-west-1");
    expect(spyGetSsmStartSession).toHaveBeenCalledOnceWith(credentials, "instance-id", "eu-west-1");
  });
});
