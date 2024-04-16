import { Component, Inject, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { FormGroup, FormBuilder, Validators } from "@angular/forms";
import { Mode } from '../models/mode.enum';
import { ActivatedRoute } from '@angular/router';

export const ROUTE_NAME = 'prescription';

@Component({
  selector: 'app-prescription-component',
  templateUrl: './prescription.component.html'
})
export class PrescriptionComponent {
  mode = Mode;

  mainForm!: FormGroup;
  records!: Array<IModel>;
  currentMode = Mode.Read;
  appointmentId!: number;

  constructor(private readonly http: HttpClient,
    @Inject('BASE_URL') private readonly baseUrl: string,
    private readonly formBuilder: FormBuilder,
    private route: ActivatedRoute,) {
    this.records = new Array<IModel>();
    this.buildForm();
  }

  buildForm = () => {
    this.mainForm = this.formBuilder.group({
      prescriptionId: [0],
      appointmentId: [0, [Validators.required]],
      medicationName: [null, [Validators.required]],
      dosage: [null,[Validators.required]],
      instructions: [null, [Validators.required]]
    });
  }

  ngOnInit() {
    this.appointmentId = +(this.route.snapshot.paramMap.get('id') || 0);
    this.mainForm.patchValue({
      appointmentId: this.appointmentId
    });
    this.fetch();
  }

  fetch = () => {
    this.http.post<IModel[]>(this.baseUrl + ROUTE_NAME + "/filter", {appointmentId: this.appointmentId}).subscribe(result => {
      this.records = result;
    }, (error: any) => console.error(error));
  }

  onDelete = (record: IModel) => {
    let flag = confirm("Are you sure you wanna delete: " + record.medicationName);
    if(flag) {
      this.http.delete(this.baseUrl + ROUTE_NAME + "/" + record.prescriptionId).subscribe((_) => {
        this.records = this.records.filter(x => x.prescriptionId !== record.prescriptionId);
      }, (error: any) => console.error(error));
    }
  }

  changeMode = (mode: Mode, record?: IModel) => {
    if(mode === Mode.Add) {
      this.mainForm.reset({appointmentId: this.appointmentId});
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

    let id = this.mainForm.value.prescriptionId;
    if(this.currentMode === Mode.Update) {
      this.http.put<IModel>(this.baseUrl + ROUTE_NAME + "/" + id, this.mainForm.value).subscribe(_ => {
        let index = this.records.findIndex(x => x.prescriptionId === id);
        this.records[index] = {...this.mainForm.value};
        this.changeMode(Mode.Read);
      }, (error: any) => console.error(error));
    } else {
      this.http.post<IModel>(this.baseUrl + ROUTE_NAME + "/create", this.mainForm.value).subscribe((result: IModel) => {
        this.records.push(result);
        this.changeMode(Mode.Read);
      }, (error: any) => console.error(error));
    }
  }
}

export interface IModel {
  prescriptionId: number;
  appointmentId: number;
  medicationName: string;
  dosage: string;
  instructions: string;
}

