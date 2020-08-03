import { Component, OnInit } from '@angular/core';
import { DataService } from './data.service';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { ChooseComponent } from './choose/choose.component';
import { interval } from 'rxjs';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  contryData: any;
  viewProgessBar = true;
  stateName = 'State';
  stateCode = '';
  district = 'District';
  dispalyChart = false;
  type = 'country';
  selectedIndex = 0;
  constructor(private _dataService: DataService, private _bottomSheet: MatBottomSheet) { }

  ngOnInit(): void {
    this.load();
    this._dataService.reload
    .subscribe((res) => {
      if (res) {
        this.load();
      }
    });
    setInterval(() => {
      localStorage.setItem('selectedIndex', '' + this.selectedIndex);
      this._dataService.reload.next(true);
    }, 240000);
    localStorage.setItem('selectedIndex', '0');
  }

  refresh() {
    this.viewProgessBar = true;
    setTimeout(() => {
      localStorage.setItem('selectedIndex', '' + this.selectedIndex);
      this._dataService.reload.next(true);
    }, 200);
  }

  load() {
    this._dataService.loadOverallData()
      .subscribe(() => {
        setTimeout(() => {
          this.viewProgessBar = false;
          this.check('');
        }, 200);
      });
    this._dataService.loadSeriesData()
      .subscribe(_res => {
        if (localStorage.getItem('completeDataSet')) {
          this.dispalyChart = true;
        }
      });
    this._dataService.checkChoices
      .subscribe(res => {
        if (res) {
          this.check('');
        }
      });

    if (localStorage.getItem('userChoice')) {
      const userChoice = JSON.parse(localStorage.getItem('userChoice'));
      this.district = userChoice.district;
      this.stateCode = userChoice.stateCode;
      this.stateName = userChoice.stateName;
    }
  }

  openBottomSheet(): void {
    this._bottomSheet.open(ChooseComponent)
      .afterDismissed().subscribe(res => {
        if (res) {
          localStorage.setItem('userChoice', JSON.stringify(res));
          this.district = res.district;
          this.stateCode = res.stateCode;
          this.stateName = res.stateName;
          const data = JSON.parse(localStorage.getItem('overAllData'));
          this._dataService.loadStateData(data, this.stateCode, this.stateName, this.district);
        }
      });
  }

  changeToggle(data: any) {
    if (data) {
      if (data.index === 1) {
        const res = {
          stateCode: data.code,
          stateName: data.name,
          district: ''
        };
        localStorage.setItem('userChoice', JSON.stringify(res));
        this.district = res.district;
        this.stateCode = res.stateCode;
        this.stateName = res.stateName;
        if (!this.district) {
          localStorage.removeItem('districtData');
        }
        const data2 = JSON.parse(localStorage.getItem('overAllData'));
        this._dataService.loadStateData(data2, this.stateCode, this.stateName, this.district);
        this.selectedIndex = 1;
      } else {
        const userChoice = JSON.parse(localStorage.getItem('userChoice'));
        userChoice['district'] = data.code;
        localStorage.setItem('userChoice', JSON.stringify(userChoice));
        this.district = userChoice.district;
        const data2 = JSON.parse(localStorage.getItem('overAllData'));
        this._dataService.loadStateData(data2, this.stateCode, this.stateName, this.district);
        this.selectedIndex = 2;
      }
    }
  }

  swipe(data, index) {
    if (this.selectedIndex === undefined) {
      this.selectedIndex = 0;
    }
    console.log(data);
    if (this.selectedIndex + parseInt(index) < 0 || this.selectedIndex + parseInt(index) > 2) {
      return;
    }
    this.selectedIndex = this.selectedIndex + parseInt(index);
  }

  check(value) {
    if (!value) {
      const previous = localStorage.getItem('selectedIndex');
      this.selectedIndex = parseInt(previous);
    } else {
      this.selectedIndex = value.index;
    }
   
    if (value && value.index === 0) {
      this.type = 'country';
      return;
    }

    if (value && value.index === 1) {
      this.type = 'state';
    } else if (value && value.index === 2) {
      this.type = 'district';
    }
    if (!localStorage.getItem('userChoice')) {
      this.openBottomSheet();
    } else {
      const userChoice = JSON.parse(localStorage.getItem('userChoice'));
      this.district = userChoice.district;
      this.stateCode = userChoice.stateCode;
      this.stateName = userChoice.stateName;
    }
  }
}
