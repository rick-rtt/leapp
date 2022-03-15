import { ComponentFixture, TestBed } from "@angular/core/testing";

import { CreateDialogComponent } from "./create-dialog.component";
import { mustInjected } from "../../../../base-injectables";
import { RouterTestingModule } from "@angular/router/testing";

describe("CreateDialogComponent", () => {
  let component: CreateDialogComponent;
  let fixture: ComponentFixture<CreateDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [CreateDialogComponent],
      providers: [].concat(mustInjected()),
      imports: [RouterTestingModule],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
