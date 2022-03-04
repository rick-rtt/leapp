import { TestBed } from "@angular/core/testing";

import { LeappCoreService } from "./leapp-core.service";

describe("LeappCoreService", () => {
  let service: LeappCoreService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LeappCoreService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
