import { TestBed } from '@angular/core/testing';

import { MfaCodePromptService } from './mfa-code-prompt.service';

describe('MfaCodePromptService', () => {
  let service: MfaCodePromptService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(MfaCodePromptService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
