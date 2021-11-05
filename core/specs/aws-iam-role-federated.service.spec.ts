import { TestBed } from '@angular/core/testing';

import { AwsIamRoleFederatedService } from '../services/session/aws/method/aws-iam-role-federated-service';
import {mustInjected} from '../../desktop-app/src/base-injectables';

describe('AwsIamRoleFederatedService', () => {
  let service: AwsIamRoleFederatedService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [].concat(mustInjected())
    });
    service = TestBed.inject(AwsIamRoleFederatedService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
