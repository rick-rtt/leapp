import { TestBed } from "@angular/core/testing";

import { LeappCoreService } from "./leapp-core.service";
import { mustInjected } from "../../base-injectables";

describe("LeappCoreService", () => {
  let service: LeappCoreService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [].concat(mustInjected()),
    });
    service = TestBed.inject(LeappCoreService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
