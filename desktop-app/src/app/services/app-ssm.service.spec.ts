import { TestBed } from "@angular/core/testing";

import { AppSsmService } from "./app-ssm.service";
import { mustInjected } from "../../base-injectables";

describe("SsmService", () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [].concat(mustInjected()),
    });
  });

  it("should be created", () => {
    const service: AppSsmService = TestBed.get(AppSsmService);
    expect(service).toBeTruthy();
  });
});
