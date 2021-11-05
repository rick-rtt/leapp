import { TestBed } from '@angular/core/testing';

import { AzureService } from '../services/session/azure/azure.service';
import {mustInjected} from '../../desktop-app/src/base-injectables';

describe('AzureService', () => {
  let service: AzureService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [].concat(mustInjected())
    });
    service = TestBed.inject(AzureService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
