import { TestBed } from "@angular/core/testing";

import { MfaCodePromptService } from "./mfa-code-prompt.service";
import { mustInjected } from "../../base-injectables";

describe("MfaCodePromptService", () => {
  let service: MfaCodePromptService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [].concat(mustInjected()),
    });
    service = TestBed.inject(MfaCodePromptService);
  });

  it("should be created", () => {
    expect(service).toBeTruthy();
  });
});
