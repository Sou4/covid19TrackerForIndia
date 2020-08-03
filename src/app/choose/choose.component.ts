import { Component, OnInit } from '@angular/core';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { FormControl, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { stateDistrictList } from '../state_district.constant';
import * as _ from 'underscore';

@Component({
  selector: 'app-choose',
  templateUrl: './choose.component.html',
  styleUrls: ['./choose.component.css']
})
export class ChooseComponent implements OnInit {
  stateControl = new FormControl('', Validators.required);
  districtControl = new FormControl('', Validators.required);
  stateOptions: any[] = [];
  districtOptions: string[] = [];
  filteredOptions: Observable<string[]>;
  filteredDistrictOptions: Observable<string[]>;
  constructor(private _bottomSheetRef: MatBottomSheetRef<ChooseComponent>) { }

  ngOnInit(): void {
    for (const key in stateDistrictList) {
      if (Object.prototype.hasOwnProperty.call(stateDistrictList, key)) {
        const element = stateDistrictList[key];
        this.stateOptions.push({
          code: key,
          name: element.name
        });
      }
    }

    this.filteredOptions = this.stateControl.valueChanges
      .pipe(
        startWith({
          code: '',
          name: ''
        }),
        map(value => this._filter(value))
      );

    if (localStorage.getItem('userChoice')) {
      const userChoice = JSON.parse(localStorage.getItem('userChoice'));
      this.stateControl.setValue(userChoice.stateName);
      this.loadDistricts(userChoice.stateCode);
      this.districtControl.setValue(userChoice.district);
    }
  }

  submit(event: MouseEvent): void {
    if (this.stateControl.value && this.districtControl.value) {
      this._bottomSheetRef.dismiss({
        stateCode: _.findWhere(this.stateOptions, { name: this.stateControl.value }).code,
        stateName: this.stateControl.value,
        district: this.districtControl.value
      });
    }
    event.preventDefault();
  }

  private _filter(value: any): string[] {
    let filterValue = '';
    if (_.isObject(value)) {
      filterValue = value.name.toLowerCase();
    } else {
      filterValue = value.toLowerCase();
    }
    const res: any = this.stateOptions.filter(option => option.name.toLowerCase().includes(filterValue))
    if (res.length === 1) {
      this.loadDistricts(res[0].code);
    }
    return res;
  }

  private _filterDistricts(value: string): string[] {
    const filterValue = value.toLowerCase();

    return this.districtOptions.filter(option => option.toLowerCase().includes(filterValue));
  }

  loadDistricts(stateCode) {
    this.districtOptions = [];
    this.districtControl.setValue('');
    if (localStorage.getItem('overAllData')) {
      const overAllData = JSON.parse(localStorage.getItem('overAllData'));
      const stateData = overAllData[stateCode]?.districts;
      for (const key in stateData) {
        if (Object.prototype.hasOwnProperty.call(stateData, key)) {
          this.districtOptions.push(key);
        }
      }
    }

    this.filteredDistrictOptions = this.districtControl.valueChanges
    .pipe(
      startWith(''),
      map(value => this._filterDistricts(value))
    );
  }
}
