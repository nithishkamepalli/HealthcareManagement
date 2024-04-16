import { Component, Inject, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { FormGroup, FormBuilder, Validators } from "@angular/forms";
import { Mode } from '../models/mode.enum';
import {IModel as IPatientModel, ROUTE_NAME as PATIENT_ROUTE_NAME} from '../patient/patient.component';
import {IModel as IDoctorModel, ROUTE_NAME as DOCTOR_ROUTE_NAME} from '../doctor/doctor.component';
import { formatDate } from '@angular/common';

const ROUTE_NAME = 'appointment';

@Component({
  selector: 'app-appointment',
  templateUrl: './appointment.component.html',
})
export class AppointmentComponent {
  mode = Mode;

  mainForm!: FormGroup;
  filterForm!: FormGroup;
  records!: Array<IModel>;
  doctors!: Array<IDoctorModel>;
  patients!: Array<IPatientModel>;
  currentMode = Mode.Read;

  constructor(private readonly http: HttpClient,
    @Inject('BASE_URL') private readonly baseUrl: string,
    private readonly formBuilder: FormBuilder,) {
    this.records = new Array<IModel>();
    this.buildForm();
    this.buildFilterForm();
  }

  buildForm = () => {
    this.mainForm = this.formBuilder.group({
      appointmentId: [0],
      doctorId: [0, [Validators.required]],
      patientId: [0, [Validators.required]],
      appointmentDate: [null, [Validators.required]],
      appointmentTime: [null,[Validators.required]],
      notes: [null, [Validators.required]]
    });
  }

  buildFilterForm = () => {
    this.filterForm = this.formBuilder.group({
      appointmentId: [null],
      patientName: [null],
      doctorName: [null],
      appointmentDate: [null]
    });
  }

  ngOnInit() {
    this.fetchDoctors();
    this.fetchPatients();
    this.fetch();
  }

  fetch = () => {
    this.http.post<IModel[]>(this.baseUrl + ROUTE_NAME + "/filter", this.filterForm.value).subscribe(result => {
      this.records = result;
    }, (error: any) => console.error(error));
  }

  reset = () => {
    this.filterForm.reset();
    this.fetch();
  }

  fetchDoctors = () => {
    this.http.get<IDoctorModel[]>(this.baseUrl + DOCTOR_ROUTE_NAME).subscribe(result => {
      this.doctors = result;
    }, (error: any) => console.error(error));
  }

  fetchPatients = () => {
    this.http.get<IPatientModel[]>(this.baseUrl + PATIENT_ROUTE_NAME).subscribe(result => {
      this.patients = result;
    }, (error: any) => console.error(error));
  }

  onDelete = (record: IModel) => {
    let flag = confirm("Are you sure you wanna delete?");
    if(flag) {
      this.http.delete(this.baseUrl + ROUTE_NAME + "/" + record.appointmentId).subscribe((_) => {
        this.records = this.records.filter(x => x.appointmentId !== record.appointmentId);
      }, (error: any) => console.error(error));
    }
  }

  changeMode = (mode: Mode, record?: IModel) => {
    if(mode === Mode.Add) {
      this.mainForm.reset();
    }

    if(mode === Mode.Update) {
      this.mainForm.patchValue({...record, appointmentDate: formatDate(record?.appointmentDate || new Date(),'yyyy-MM-dd','en')});
    }
    this.currentMode = mode;
  }

  submit = () => {
    if(!this.mainForm.valid) {
      alert("Required filed needs to inserted");
      return;
    }

    let id = this.mainForm.value.appointmentId;
    let timeTokens = this.mainForm.value.appointmentTime.toString().split(":");
    let data = {
      ...this.mainForm.value,
      appointmentTime: timeTokens.length >=3
        ? this.mainForm.value.appointmentTime
        : this.mainForm.value.appointmentTime + ":00"
    }
    if(this.currentMode === Mode.Update) {
      this.http.put<IModel>(this.baseUrl + ROUTE_NAME + "/" + id, data).subscribe(_ => {
        let index = this.records.findIndex(x => x.appointmentId === id);
        let patient = this.patients.find(x => x.patientId === data.patientId);
        let doctor = this.doctors.find(x => x.doctorId === data.doctorId);
        this.records[index] = {...this.mainForm.value, patientName: patient?.name, doctorName: doctor?.name};
        this.changeMode(Mode.Read);
      }, (error: any) => console.error(error));
    } else {
      this.http.post<IModel>(this.baseUrl + ROUTE_NAME + "/create", data).subscribe((result: IModel) => {
        let patient = this.patients.find(x => x.patientId === data.patientId);
        let doctor = this.doctors.find(x => x.doctorId === data.doctorId);
        let cloneResult = {...result, patientName: patient?.name, doctorName: doctor?.name} as IModel;
        this.records.push(cloneResult);
        this.changeMode(Mode.Read);
      }, (error: any) => console.error(error));
    }
  }
}

export interface IModel {
  appointmentId: number;
  patientId: number;
  doctorId: number;
  patientName: string;
  doctorName: string;
  appointmentDate: Date;
  appointmentTime: Date;
  notes: string;
}

interface IFilterModel {
patientName: string;
doctorName: string;
appointmentDate?: Date;
appointmentId?: number
}

