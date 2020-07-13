import { Component, ChangeDetectionStrategy } from '@angular/core';
import { FormControl } from '@angular/forms';

import { Observable } from 'rxjs';
import { UserFacade, Pagination, UserState } from './user.facade';

@Component({
  selector: 'my-app',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {
  searchTerm: FormControl;
  showButton = true;
  vm$: Observable<UserState> = this.facade.vm$;

  constructor(public facade: UserFacade) { }

  ngOnInit() {
    const {criteria} = this.facade.getStateSnapshot();
    
    this.searchTerm = this.facade.buildSearchTermControl();
    this.searchTerm.patchValue(criteria, { emitEvent: false });
  }

  getPageSize() {
    this.showButton = false;
  }
}
