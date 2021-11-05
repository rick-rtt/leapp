import { TestBed } from '@angular/core/testing';

import { AwsIamRoleChainedService } from '../services/session/aws/method/aws-iam-role-chained-service';
import {mustInjected} from '../../desktop-app/src/base-injectables';

describe('AwsIamRoleChainedService', () => {
  let service: AwsIamRoleChainedService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [].concat(mustInjected())
    });
    service = TestBed.inject(AwsIamRoleChainedService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
