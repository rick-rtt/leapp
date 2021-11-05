import { TestBed } from '@angular/core/testing';

import { AwsSsoRoleService } from '../services/session/aws/method/aws-sso-role-service';

describe('AwsSsoRoleService', () => {
  let service: AwsSsoRoleService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AwsSsoRoleService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
