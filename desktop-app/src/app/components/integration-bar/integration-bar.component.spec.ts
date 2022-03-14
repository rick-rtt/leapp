import { async, ComponentFixture, TestBed } from "@angular/core/testing";

import { IntegrationBarComponent } from "./integration-bar.component";
import { MAT_SNACK_BAR_DATA, MatSnackBarRef } from "@angular/material/snack-bar";
import { mustInjected } from "../../../base-injectables";
import { RouterTestingModule } from "@angular/router/testing";
import { LeappCoreService } from "../../services/leapp-core.service";

describe("IntegrationBarComponent", () => {
  let component: IntegrationBarComponent;
  let fixture: ComponentFixture<IntegrationBarComponent>;

  beforeEach(async(() => {
    const spyRepositoryService = jasmine.createSpyObj("Repository", {
      getProfiles: [],
      getSessions: [],
      getSegments: [],
      listAwsSsoIntegrations: [],
    });
    const spyLeappCoreService = jasmine.createSpyObj("LeappCoreService", [], {
      repository: spyRepositoryService,
      awsCoreService: { getRegions: () => ["mocked-region-1", "mocked-region-2"] },
      awsSsoOidcService: { listeners: [] },
    });

    TestBed.configureTestingModule({
      imports: [RouterTestingModule],
      declarations: [IntegrationBarComponent],
      providers: [
        { provide: MAT_SNACK_BAR_DATA, useValue: {} },
        { provide: MatSnackBarRef, useValue: {} },
      ].concat(mustInjected().concat([{ provide: LeappCoreService, useValue: spyLeappCoreService }])),
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(IntegrationBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
