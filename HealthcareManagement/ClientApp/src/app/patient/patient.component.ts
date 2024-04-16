import { Component, Inject, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormGroup, FormBuilder, Validators } from "@angular/forms";
import { Mode } from '../models/mode.enum';
import { formatDate } from '@angular/common';
import {IModel as IAppointmentModel} from '../appointment/appointment.component';

export const ROUTE_NAME = 'patient';

@Component({
  selector: 'app-patient',
  templateUrl: './patient.component.html'
})
export class PatientComponent implements OnInit {

  mode = Mode;

  mainForm!: FormGroup;
  records!: Array<IModel>;
  currentMode = Mode.Read;
  highlightRecord!: IModel;
  highlightRecords!: Array<IAppointmentModel>;

  constructor(private readonly http: HttpClient,
    @Inject('BASE_URL') private readonly baseUrl: string,
    private readonly formBuilder: FormBuilder,) {
    this.records = new Array<IModel>();
    this.highlightRecords = new Array<IAppointmentModel>();
    this.buildForm();
  }

  buildForm = () => {
    this.mainForm = this.formBuilder.group({
      patientId: [0],
      name: [null, [Validators.required]],
      address: [null],
      phone: [null, [Validators.required]],
      dateOfBirth: [null, [Validators.required]],
      gender: [null, [Validators.required]]
    });
  }

  ngOnInit() {
    this.fetch();
  }

  fetch = () => {
    this.http.get<IModel[]>(this.baseUrl + ROUTE_NAME).subscribe(result => {
      this.records = result;
    }, (error: any) => console.error(error));
  }

  onDelete = (record: IModel) => {
    let flag = confirm("Are you sure you wanna delete: " + record.name);
    if(flag) {
      this.http.delete(this.baseUrl + ROUTE_NAME + "/" + record.patientId).subscribe((_) => {
        this.records = this.records.filter(x => x.patientId !== record.patientId);
      }, (error: any) => console.error(error));
    }
  }

  onHighlight = (record: IModel) => {
    this.highlightRecord = record;
    this.changeMode(Mode.Highlight);
    this.http.get<IAppointmentModel[]>(this.baseUrl + "patient-appointment/" + record.patientId).subscribe(result => {
      this.highlightRecords = result;
    }, (error: any) => console.error(error));
  }

  changeMode = (mode: Mode, record?: IModel) => {
    if(mode === Mode.Add) {
      this.mainForm.reset();
    }

    if(mode === Mode.Update) {
      this.mainForm.patchValue({...record, dateOfBirth: formatDate(record?.dateOfBirth || new Date(),'yyyy-MM-dd','en')});
    }
    this.currentMode = mode;
  }

  submit = () => {
    if(!this.mainForm.valid) {
      alert("Required filed needs to inserted");
      return;
    }

    let id = this.mainForm.value.patientId;
    if(this.currentMode === Mode.Update) {
      this.http.put<IModel>(this.baseUrl + ROUTE_NAME + "/" + id, this.mainForm.value).subscribe(_ => {
        let index = this.records.findIndex(x => x.patientId === id);
        this.records[index] = {...this.mainForm.value};
        this.changeMode(Mode.Read);
      }, (error: any) => console.error(error));
    } else {
      this.http.post<IModel>(this.baseUrl + ROUTE_NAME, this.mainForm.value).subscribe((result: IModel) => {
        this.records.push(result);
        this.changeMode(Mode.Read);
      }, (error: any) => console.error(error));
    }
  }

}

export interface IModel {
  patientId: number;
  name: string;
  phone: string;
  dateOfBirth: Date;
  gender: string;
  address?: string;
}

