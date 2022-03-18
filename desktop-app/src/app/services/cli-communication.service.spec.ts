import { TestBed } from "@angular/core/testing";

import { CliCommunicationService } from "./cli-communication.service";
import { mustInjected } from "../../base-injectables";

describe("CliCommunicationService", () => {
  let service: CliCommunicationService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [].concat(mustInjected()),
    });
    service = TestBed.inject(CliCommunicationService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
