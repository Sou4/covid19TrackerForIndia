import { Component, OnInit, Input, OnChanges, Output, EventEmitter } from '@angular/core';
import { DataService } from '../data.service';
import * as _ from 'underscore';
import { stateDistrictList } from '../state_district.constant';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { ChooseComponent } from '../choose/choose.component';
declare var Chart;
@Component({
  selector: 'app-status',
  templateUrl: './status.component.html',
  styleUrls: ['./status.component.css']
})
export class StatusComponent implements OnInit, OnChanges {
  @Input() type: any;
  @Input() stateName;
  @Input() stateCode;
  @Input() district;
  @Input() uid;
  data: any;
  displayedColumns = [];
  dataSource = [];
  numberFormat = new Intl.NumberFormat('en-IN');
  @Input() dispalyChart;
  @Output() changeToggle: EventEmitter<any> = new EventEmitter();
  showChart = false;
  reloadObs;
  constructor(private _dataService: DataService, private _bottomSheet: MatBottomSheet) { }

  ngOnChanges(): void {
    this.data = null;
    this.dataSource = [];
    this.load();
  }

  ngOnInit(): void {
    this.reloadObs = this._dataService.reload;
    this.reloadObs.subscribe((res) => {
      if (res) {
        this.dataSource = [];
        this.load();
      }
    });
  }

  drawLineChart(filterRange, code = 'TT', key = 'completeDataSet') {
    const completeDataSet = JSON.parse(localStorage.getItem(key));
    let chartDataSet;
    if (key === 'completeDataSet') {
      chartDataSet = this._dataService.formatSeriesData(completeDataSet, filterRange, code);
    } else {
      const userChoice = JSON.parse(localStorage.getItem('userChoice'));
      const district = userChoice.district;
      chartDataSet = this._dataService.formatStateSeriesData(completeDataSet, filterRange, code, district);
    }
    const ctx = document.getElementById('chart');
    ctx.style.width = '900px';
    ctx.style.height = '250px';
    const _c = new Chart(ctx, {
      type: 'line',
      data: {
        labels: [...chartDataSet.labels],
        datasets: [chartDataSet.positiveCases, chartDataSet.recovered, chartDataSet.activeCases, chartDataSet.deaths]
      },
      options: {
        legend: {
          position: 'bottom'
        },
        elements: {
          point: {
            radius: 0
          }
        }
      }
    });
    setTimeout(() => {
      this.showChart = true;
    }, 200);
  }

  rangeChanged(data) {
    if (this.uid === 'district' && this.type === 'district' && localStorage.getItem('userChoice')) {
      const userChoice = JSON.parse(localStorage.getItem('userChoice'));
      const stateCode = userChoice.stateCode;
      this.drawLineChart(data.value, stateCode, 'completeStateDataSet');
    }

    if (this.uid !== 'district' && this.type !== 'district') {
      this.drawLineChart(data.value, this.stateCode);
    }
  }

  load() {
    this.showChart = false;
    const res = this._dataService.getData(`${this.type}Data`);
    if (_.isEmpty(res)) {
      this.data = false;
    } else {
      this.data = res;
    }
    if (this.type !== 'district') {
      this.loadTableData();
    }
    if (this.uid === 'district' && this.type === 'district' && this.district !== '') {
      this._dataService.loadStateSeriesData()
        .subscribe(_res => {
          if (localStorage.getItem('completeStateDataSet') && localStorage.getItem('userChoice')) {
            setTimeout(() => {
              const userChoice = JSON.parse(localStorage.getItem('userChoice'));
              const stateCode = userChoice.stateCode;
              this.drawLineChart('30', stateCode, 'completeStateDataSet');
            }, 2000);
          }
        });
    }

    setTimeout(() => {
      if (this.uid === 'country' && this.type === 'country' && this.dispalyChart && localStorage.getItem('completeDataSet')) {
        this.drawLineChart('30', 'TT');
      } else if (this.uid === 'state' && this.type === 'state' && this.stateCode && this.dispalyChart && localStorage.getItem('completeDataSet')) {
        this.drawLineChart('30', this.stateCode);
      }
    }, 2000);
  }

  toggle(data) {
    if (this.uid === 'country') {
      const res: any = _.findWhere(stateDistrictList, { name: data.name });
      if (res && res.code) {
        this.changeToggle.emit({
          code: res.code,
          name: data.name,
          index: 1
        });
      }
    } else if (this.uid === 'state') {
      this.changeToggle.emit({
        code: data.name,
        index: 2
      });
    }
  }

  loadTableData() {
    this.displayedColumns = ['name', 'positiveCases', 'recovered', 'activeCases', 'deaths', 'tested'];
    const overAllData = this._dataService.getData('overAllData');
    if (this.type === 'country') {
      for (const key in overAllData) {
        if (key !== 'TT' && key !== 'UN' && Object.prototype.hasOwnProperty.call(overAllData, key)) {
          try {
            const element = overAllData[key];
            this.formatData(element, stateDistrictList[key].name);
          } catch (error) {
            console.error(key);
          }
        }
      }
    } else if (this.type === 'state' && overAllData[this.stateCode] && overAllData[this.stateCode].districts) {
      for (const key in overAllData[this.stateCode].districts) {
        if (Object.prototype.hasOwnProperty.call(overAllData[this.stateCode].districts, key)) {
          try {
            const element = overAllData[this.stateCode].districts[key];
            this.formatData(element, key);
          } catch (error) {
            console.error(key);
          }
        }
      }
    }
    this.dataSource.sort((a, b) => (a.positiveCases.total > b.positiveCases.total) ? -1 : ((b.positiveCases.total > a.positiveCases.total) ? 1 : 0));
  }

  formatData(element, name) {
    let activeCases = 0;
    if (element.total.confirmed) {
      activeCases = parseInt(element.total.confirmed);
      if (element.total.recovered) {
        activeCases -= parseInt(element.total.recovered);
      }
      if (element.total.deceased) {
        activeCases -= parseInt(element.total.deceased);
      }
    }
    this.dataSource.push({
      name: name,
      positiveCases: {
        total: element.total && element.total.confirmed ? element.total.confirmed : 0,
        latest: element.delta && element.delta.confirmed ? element.delta.confirmed : 0
      },
      recovered: {
        total: element.total && element.total.recovered ? element.total.recovered : 0,
        latest: element.delta && element.delta.recovered ? element.delta.recovered : 0
      },
      deaths: {
        total: element.total && element.total.deceased ? element.total.deceased : 0,
        latest: element.delta && element.delta.deceased ? element.delta.deceased : 0
      },
      activeCases: {
        total: activeCases
      },
      tested: {
        total: element.total && element.total.tested ? element.total.tested : 0,
        latest: element.delta && element.delta.tested ? element.delta.tested : 0
      }
    });
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
          this.load();
          this._dataService.checkChoices.next(true);
        }
      });
  }
}
