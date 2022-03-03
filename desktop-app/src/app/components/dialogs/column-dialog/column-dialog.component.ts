import {Component, OnDestroy, OnInit} from '@angular/core';
import {BsModalRef} from 'ngx-bootstrap/modal';
import {AppService} from '../../../services/app.service';
import {FormControl, FormGroup} from '@angular/forms';
import {compactMode, globalColumns, IGlobalColumns} from '../../command-bar/command-bar.component';

@Component({
  selector: 'app-column-dialog',
  templateUrl: './column-dialog.component.html',
  styleUrls: ['./column-dialog.component.scss']
})
export class ColumnDialogComponent implements OnInit, OnDestroy {

  eGlobalColumns: IGlobalColumns;

  columnForm = new FormGroup({
    role: new FormControl(),
    provider: new FormControl(),
    namedProfile: new FormControl(),
    region: new FormControl()
  });

  showRegion;

  private subscription;
  private subscription2;
  private values;

  constructor(private bsModalRef: BsModalRef, private appService: AppService) {}

  public ngOnInit(): void {
    // Set new state
    Object.keys(this.eGlobalColumns).forEach((key) => {
      this.columnForm.get(key).setValue(this.eGlobalColumns[key]);
    });

    this.subscription = this.columnForm.valueChanges.subscribe((values: IGlobalColumns) => {
      this.values = values;
    });

    this.subscription2 = compactMode.subscribe((value) => this.showRegion = !value);
  }

  public ngOnDestroy(): void {
    this.subscription.unsubscribe();
    this.subscription2.unsubscribe();
  }

  public closeModal(): void {
    this.appService.closeModal();
  }

  public setColumns(): void {
    globalColumns.next(this.values);
    this.appService.closeModal();
  }
}
