import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormControl } from '@angular/forms';

import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import {
  map, distinctUntilChanged,
  switchMap, startWith, tap, delay, debounceTime
} from 'rxjs/operators';

export interface User {
  gender: string;
  name: {
    first: string;
    last: string;
  }
}

export interface Pagination {
  selectedSize: number;
  currentPage: number;
  pageSizes: number[];
}

export interface RandomUserResponse {
  results: User[];
}

export interface UserState {
  users: User[];
  pagination: Pagination;
  criteria: string;
  loading: boolean;
}

let _state: UserState = {
  users: [],
  criteria: 'ngDominican',
  pagination: {
    currentPage: 0,
    selectedSize: 5,
    pageSizes: [5, 10, 20, 50]
  },
  loading: false
};


@Injectable()
export class UserFacade {

  private store  = new BehaviorSubject<UserState>(_state);
  private state$ = this.store.asObservable();

  users$      = this.state$.pipe(map(state => state.users), distinctUntilChanged());
  criteria$   = this.state$.pipe(map(state => state.criteria), distinctUntilChanged());
  pagination$ = this.state$.pipe(map(state => state.pagination), distinctUntilChanged());
  loading$    = this.state$.pipe(map(state => state.loading));

  /**
   * Viewmodel that resolves once all the data is ready (or updated)...
   */
  vm$: Observable<UserState> = combineLatest(this.pagination$,this.criteria$,this.users$,this.loading$).pipe(
    map( ([pagination, criteria, users, loading]) => {
      return { pagination, criteria, users, loading };
    })
  );

  /**
   * Watch 2 streams to trigger user loads and state updates
   */
  constructor(private http: HttpClient) {
    combineLatest(this.criteria$, this.pagination$).pipe(
      switchMap(([criteria, pagination]) => {
        return this.findAllUsers(criteria, pagination);
      })
    ).subscribe(users => {
      this.updateState({ ..._state, users,  loading: false });
    });
  }

  // ------- Public Methods ------------------------

  // Allows quick snapshot access to data for ngOnInit() purposes
  getStateSnapshot(): UserState {
    return {..._state, pagination: {..._state.pagination}};
  }

  buildSearchTermControl(): FormControl {
    const searchTerm = new FormControl();
    searchTerm.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(value => this.updateSearchCriteria(value));

    return searchTerm;
  }

  updateSearchCriteria(criteria: string) {
    this.updateState({ ..._state, criteria, loading: true });
  }

  updatePagination(selectedSize: number, currentPage: number = 0) {
    const pagination = { ..._state.pagination, currentPage, selectedSize };
    this.updateState({ ..._state, pagination, loading: true });
  }

  // ------- Private Methods ------------------------

  /** Update internal state cache and emit from store... */
  private updateState(state:UserState) {
    this.store.next(_state = state); 
  }

  /** RandomUser REST call */
  private findAllUsers(criteria: string, pagination: Pagination): Observable<User[]> {
    const url = buildUserUrl(criteria, pagination);
    return this.http.get<RandomUserResponse>(url).pipe(
      map(response => response.results)
    );
  }

}

function buildUserUrl(criteria: string, pagination: Pagination): string {
  const URL = 'https://randomuser.me/api/';
  const currentPage = `page=${pagination.currentPage}`;
  const pageSize = `results=${pagination.selectedSize}&`;
  const searchFor = `seed=${criteria}`;

  return `${URL}?${searchFor}&${pageSize}&${currentPage}`;
}