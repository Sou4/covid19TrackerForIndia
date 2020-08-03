import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of } from 'rxjs';
import { DatePipe } from '@angular/common';

@Injectable({
  providedIn: 'root'
})
export class DataService {
  checkChoices: BehaviorSubject<boolean> = new BehaviorSubject(false);
  reload: BehaviorSubject<boolean> = new BehaviorSubject(false);
  constructor(private _http: HttpClient, private datePipe: DatePipe) { }

  loadOverallData() {
    return new Observable((observer) => {
      this._http.get('https://api.covid19india.org/v4/min/data.min.json')
      .subscribe(res => {
        this.formatOverallData(res, observer);
      }, err => {
        console.log(err);
        observer.next();
        observer.complete();
      });
    });
  }

  private formatOverallData(data, observer) {
    this.formatData(data, 'TT', 'countryData');
    setTimeout(() => {
      if (localStorage.getItem('userChoice')) {
        const userChoice = JSON.parse(localStorage.getItem('userChoice'));
        if (userChoice.stateCode && userChoice.stateName && userChoice.district) {
          this.loadStateData(data, userChoice.stateCode, userChoice.stateName, userChoice.district);
        }
      }
    }, 20);
    localStorage.setItem('overAllData', JSON.stringify(data));
    observer.next();
    observer.complete();
  }

  loadStateData(data, stateCode, stateName, district) {
    this.formatData(data, stateCode, 'stateData', stateName, district);
  }

  formatData(data, code = 'TT', storageKey, stateName?, district?) {
    const result: any = {};
    try {
      if (data[code]) {
        if (code === 'TT') {
          result.name = 'India';
        } else {
          result.name = stateName;
          result.code = code;
        }
        
        if (data[code].meta) {
          result.population = data[code].meta.population ? data[code].meta.population : 0;
          result.lastUpdated = data[code].meta.last_updated ? data[code].meta.last_updated : new Date().toDateString();
        }
        if (data[code].total) {
          result.total = {};
          result.total.positveCases = data[code].total.confirmed ? data[code].total.confirmed : 0;
          result.total.recovered = data[code].total.recovered ? data[code].total.recovered : 0;
          result.total.deaths = data[code].total.deceased ? data[code].total.deceased : 0;
          result.total.tested = data[code].total.tested ? data[code].total.tested : 0;
          result.total.activeCases = parseInt(result.total.positveCases) 
          - (parseInt(result.total.recovered) + parseInt(result.total.deaths));
        }
        if (data[code].delta) {
          result.latest = {};
          result.latest.positveCases = data[code].delta.confirmed ? data[code].delta.confirmed : 0;
          result.latest.recovered = data[code].delta.recovered ? data[code].delta.recovered : 0;
          result.latest.deaths = data[code].delta.deceased ? data[code].delta.deceased : 0;
          result.latest.tested = data[code].delta.tested ? data[code].delta.tested : 0;
        }
      }
      result.positivityRate = (parseInt(result.total.positveCases) * 100 / parseInt(result.total.tested)).toFixed(0);
      result.recoveryRate = (parseInt(result.total.recovered) * 100 / parseInt(result.total.positveCases)).toFixed(0);
      result.activeRate = (parseInt(result.total.activeCases) * 100 / parseInt(result.total.positveCases)).toFixed(0);
      result.fatalityRate = (parseInt(result.total.deaths) * 100 / parseInt(result.total.positveCases)).toFixed(0);
      localStorage.setItem(storageKey, JSON.stringify(result));
      
      if (district) {
        const stateData = data[code];
        if (stateData.districts[district]) {
          const districtResult: any = {};
          districtResult.name = district;

          if (stateData.districts[district].meta) {
            districtResult.population = stateData.districts[district].meta.population ? stateData.districts[district].meta.population : 0;
            districtResult.lastUpdated = data[code].meta.last_updated ? data[code].meta.last_updated : new Date().toDateString();
          }
          if (stateData.districts[district].total) {
            districtResult.total = {};
            districtResult.total.positveCases = stateData.districts[district].total.confirmed ? stateData.districts[district].total.confirmed : 0;
            districtResult.total.recovered = stateData.districts[district].total.recovered ? stateData.districts[district].total.recovered : 0;
            districtResult.total.deaths = stateData.districts[district].total.deceased ? stateData.districts[district].total.deceased : 0;
            districtResult.total.tested = stateData.districts[district].total.tested ? stateData.districts[district].total.tested : 0;
            districtResult.total.activeCases = parseInt(districtResult.total.positveCases) 
            - (parseInt(districtResult.total.recovered) + parseInt(districtResult.total.deaths));
          }
          if (stateData.districts[district].delta) {
            districtResult.latest = {};
            districtResult.latest.positveCases = stateData.districts[district].delta.confirmed ? stateData.districts[district].delta.confirmed : 0;
            districtResult.latest.recovered = stateData.districts[district].delta.recovered ? stateData.districts[district].delta.recovered : 0;
            districtResult.latest.deaths = stateData.districts[district].delta.deceased ? stateData.districts[district].delta.deceased : 0;
            districtResult.latest.tested = stateData.districts[district].delta.tested ? stateData.districts[district].delta.tested : 0;
          }
          districtResult.positivityRate = (parseInt(districtResult.total.positveCases) * 100 / parseInt(districtResult.total.tested)).toFixed(0);
          districtResult.recoveryRate = (parseInt(districtResult.total.recovered) * 100 / parseInt(districtResult.total.positveCases)).toFixed(0);
          districtResult.activeRate = (parseInt(districtResult.total.activeCases) * 100 / parseInt(districtResult.total.positveCases)).toFixed(0);
          districtResult.fatalityRate = (parseInt(districtResult.total.deaths) * 100 / parseInt(districtResult.total.positveCases)).toFixed(0);
          localStorage.setItem('districtData', JSON.stringify(districtResult));
        }
      }
    } catch (error) {
      console.log(error);
    }
  }

  getData(key): any {
    if (!localStorage.getItem(key)) {
      return {};
    }
    return JSON.parse(localStorage.getItem(key));
  }

  loadSeriesData() {
    return new Observable((observer) => {
      this._http.get('https://api.covid19india.org/v4/min/timeseries.min.json')
      .subscribe(res => {
        localStorage.setItem('completeDataSet', JSON.stringify(res));
        observer.next();
        observer.complete();
      }, err => {
        console.log(err);
        observer.next();
        observer.complete();
      });
    });
  }

  loadStateSeriesData() {
    if (localStorage.getItem('userChoice')) {
      const userChoice = JSON.parse(localStorage.getItem('userChoice'));
      const stateCode = userChoice.stateCode;
      return new Observable((observer) => {
        this._http.get(`https://api.covid19india.org/v4/min/timeseries-${stateCode}.min.json`)
        .subscribe(res => {
          localStorage.setItem('completeStateDataSet', JSON.stringify(res));
          observer.next();
          observer.complete();
        }, err => {
          console.log(err);
          observer.next();
          observer.complete();
        });
      });
    } else {
      return of();
    }
  }

  formatSeriesData(res, fiterRange = 'all', code = 'TT') {
    const completeDataSet = {
      labels: [],
      positiveCases: {
        label: 'Positive Cases',
        data: [],
        backgroundColor: [
          'rgba(255, 243, 245, 1)'
        ],
        borderColor: [
          'rgba(255, 7, 58, 1)'
        ],
        borderWidth: 1,
        fill: true
      },
      activeCases: {
        label: 'Active Cases',
        data: [],
        backgroundColor: [
          'rgba(226, 240, 255, 1)'
        ],
        borderColor: [
          'rgba(0, 123, 255, 1)'
        ],
        borderWidth: 1,
        fill: true,
        hidden: true
      },
      recovered: {
        label: 'Recovered Cases',
        data: [],
        backgroundColor: [
          'rgba(240, 255, 243, 1)'
        ],
        borderColor: [
          'rgba(40, 167, 69, 1)'
        ],
        borderWidth: 1,
        fill: true,
        hidden: true
      },
      deaths: {
        label: 'Deaths',
        data: [],
        backgroundColor: [
          'rgba(242, 242, 242, 1)'
        ],
        borderColor: [
          'rgba(108, 117, 125, 1)'
        ],
        borderWidth: 1,
        fill: true,
        hidden: true
      }
    };

    if (res?.[code].dates) {
      for (const key in res[code].dates) {
        if (Object.prototype.hasOwnProperty.call(res[code].dates, key)) {
          const element = res[code].dates[key];
          completeDataSet.labels.push(this.datePipe.transform(key, 'MMM,d'));
          let activeCases = 0;
          if (element?.delta?.confirmed) {
            completeDataSet.positiveCases.data.push(element.delta.confirmed);
            activeCases = parseInt(element.delta.confirmed);
          } else {
            completeDataSet.positiveCases.data.push(0);
          }

          if (element?.delta?.recovered) {
            completeDataSet.recovered.data.push(element.delta.recovered);
            activeCases -= parseInt(element.delta.recovered);
          } else {
            completeDataSet.recovered.data.push(0);
          }

          if (element?.delta?.deceased) {
            completeDataSet.deaths.data.push(element.delta.deceased);
            activeCases -= parseInt(element.delta.deceased);
          } else {
            completeDataSet.deaths.data.push(0);
          }
          completeDataSet.activeCases.data.push(activeCases);
        }
      }
    }

    if (fiterRange !== 'all') {
      completeDataSet.labels = completeDataSet.labels.splice(completeDataSet.labels.length - (parseInt(fiterRange) + 1));
      completeDataSet.positiveCases.data = completeDataSet.positiveCases.data.splice(completeDataSet.positiveCases.data.length - (parseInt(fiterRange) + 1));
      completeDataSet.activeCases.data = completeDataSet.activeCases.data.splice(completeDataSet.activeCases.data.length - (parseInt(fiterRange) + 1));
      completeDataSet.recovered.data = completeDataSet.recovered.data.splice(completeDataSet.recovered.data.length - (parseInt(fiterRange) + 1));
      completeDataSet.deaths.data = completeDataSet.deaths.data.splice(completeDataSet.deaths.data.length - (parseInt(fiterRange) + 1));
    }
    return completeDataSet;
  }

  formatStateSeriesData(res, fiterRange = 'all', code, districtName) {
    const completeDataSet = {
      labels: [],
      positiveCases: {
        label: 'Positive Cases',
        data: [],
        backgroundColor: [
          'rgba(255, 243, 245, 1)'
        ],
        borderColor: [
          'rgba(255, 7, 58, 1)'
        ],
        borderWidth: 1,
        fill: true
      },
      activeCases: {
        label: 'Active Cases',
        data: [],
        backgroundColor: [
          'rgba(226, 240, 255, 1)'
        ],
        borderColor: [
          'rgba(0, 123, 255, 1)'
        ],
        borderWidth: 1,
        fill: true,
        hidden: true
      },
      recovered: {
        label: 'Recovered Cases',
        data: [],
        backgroundColor: [
          'rgba(240, 255, 243, 1)'
        ],
        borderColor: [
          'rgba(40, 167, 69, 1)'
        ],
        borderWidth: 1,
        fill: true,
        hidden: true
      },
      deaths: {
        label: 'Deaths',
        data: [],
        backgroundColor: [
          'rgba(242, 242, 242, 1)'
        ],
        borderColor: [
          'rgba(108, 117, 125, 1)'
        ],
        borderWidth: 1,
        fill: true,
        hidden: true
      }
    };

    if (res[code].districts[districtName]?.dates) {
      for (const key in res[code].districts[districtName].dates) {
        if (Object.prototype.hasOwnProperty.call(res[code].districts[districtName].dates, key)) {
          const element = res[code].districts[districtName].dates[key];
          completeDataSet.labels.push(this.datePipe.transform(key, 'MMM,d'));
          let activeCases = 0;
          if (element?.delta?.confirmed) {
            completeDataSet.positiveCases.data.push(element.delta.confirmed);
            activeCases = parseInt(element.delta.confirmed);
          } else {
            completeDataSet.positiveCases.data.push(0);
          }

          if (element?.delta?.recovered) {
            completeDataSet.recovered.data.push(element.delta.recovered);
            activeCases -= parseInt(element.delta.recovered);
          } else {
            completeDataSet.recovered.data.push(0);
          }

          if (element?.delta?.deceased) {
            completeDataSet.deaths.data.push(element.delta.deceased);
            activeCases -= parseInt(element.delta.deceased);
          } else {
            completeDataSet.deaths.data.push(0);
          }
          completeDataSet.activeCases.data.push(activeCases);
        }
      }
    }

    if (fiterRange !== 'all') {
      completeDataSet.labels = completeDataSet.labels.splice(completeDataSet.labels.length - (parseInt(fiterRange) + 1));
      completeDataSet.positiveCases.data = completeDataSet.positiveCases.data.splice(completeDataSet.positiveCases.data.length - (parseInt(fiterRange) + 1));
      completeDataSet.activeCases.data = completeDataSet.activeCases.data.splice(completeDataSet.activeCases.data.length - (parseInt(fiterRange) + 1));
      completeDataSet.recovered.data = completeDataSet.recovered.data.splice(completeDataSet.recovered.data.length - (parseInt(fiterRange) + 1));
      completeDataSet.deaths.data = completeDataSet.deaths.data.splice(completeDataSet.deaths.data.length - (parseInt(fiterRange) + 1));
    }
    return completeDataSet;
  }
}
