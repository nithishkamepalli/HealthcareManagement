import { Component, Inject, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormGroup, FormBuilder, Validators } from "@angular/forms";
import { Mode } from '../models/mode.enum';
import {IModel as IPatientModel} from '../patient/patient.component';

export const ROUTE_NAME = 'doctor';

@Component({
  selector: 'app-doctor-component',
  templateUrl: './doctor.component.html'
})
export class DoctorComponent {
  mode = Mode;

  mainForm!: FormGroup;
  records!: Array<IModel>;
  currentMode = Mode.Read;
  highlightRecord!: IModel;
  highlightRecords!: Array<IPatientModel>;

  constructor(private readonly http: HttpClient,
    @Inject('BASE_URL') private readonly baseUrl: string,
    private readonly formBuilder: FormBuilder,) {
    this.records = new Array<IModel>();
    this.highlightRecords = new Array<IPatientModel>();
    this.buildForm();
  }

  buildForm = () => {
    this.mainForm = this.formBuilder.group({
      doctorId: [0],
      name: [null, [Validators.required]],
      specialty: [null,[Validators.required]],
      phone: [null, [Validators.required]]
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
      this.http.delete(this.baseUrl + ROUTE_NAME + "/" + record.doctorId).subscribe((_) => {
        this.records = this.records.filter(x => x.doctorId !== record.doctorId);
      }, (error: any) => console.error(error));
    }
  }

  onHighlight = (record: IModel) => {
    this.highlightRecord = record;
    this.changeMode(Mode.Highlight);
    this.http.get<IPatientModel[]>(this.baseUrl + "doctor-patient/" + record.doctorId).subscribe(result => {
      this.highlightRecords = result;
    }, (error: any) => console.error(error));
  }

  changeMode = (mode: Mode, record?: IModel) => {
    if(mode === Mode.Add) {
      this.mainForm.reset();
    }

    if(mode === Mode.Update) {
      this.mainForm.patchValue({...record});
    }
    this.currentMode = mode;
  }

  submit = () => {
    if(!this.mainForm.valid) {
      alert("Required filed needs to inserted");
      return;
    }

    let id = this.mainForm.value.doctorId;
    if(this.currentMode === Mode.Update) {
      this.http.put<IModel>(this.baseUrl + ROUTE_NAME + "/" + id, this.mainForm.value).subscribe(_ => {
        let index = this.records.findIndex(x => x.doctorId === id);
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
  doctorId: number;
  name: string;
  specialty: string;
  phone: string;
}

