import { ComponentFixture, TestBed } from "@angular/core/testing";

import { EditDialogComponent } from "./edit-dialog.component";
import { mustInjected } from "../../../../base-injectables";
import { RouterTestingModule } from "@angular/router/testing";

describe("EditDialogComponent", () => {
  let component: EditDialogComponent;
  let fixture: ComponentFixture<EditDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [EditDialogComponent],
      providers: [].concat(mustInjected()),
      imports: [RouterTestingModule],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(EditDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it("should create", () => {
    expect(component).toBeTruthy();
  });
});
