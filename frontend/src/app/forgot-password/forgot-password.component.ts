import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserService } from '../services/user.service';
import { MatDialogRef } from '@angular/material/dialog';
import { SnackbarService } from '../services/snackbar.service';
import { GlobalConstants } from '../shared/global-contants';


@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent implements OnInit {

  forgotPasswordForm:any =FormGroup;
  reponseMessage : any;

  constructor(private formBuilder:FormBuilder,
    private userService:UserService,
    private dialogRef:MatDialogRef<ForgotPasswordComponent>,
    private snackbarService:SnackbarService) { }

  ngOnInit(): void {
    this.forgotPasswordForm = this.formBuilder.group({
      email: [null,[Validators.required,Validators.pattern(GlobalConstants.emailRegex)]]
    });
  }

  handleSubmit(){
    var formData = this.forgotPasswordForm.value;
    var data = {
      email: formData.email
    }

    this.userService.forgotPassword(data).subscribe((response:any)=> {
      this.reponseMessage = response?.message;
      this.dialogRef.close();
      this.snackbarService.openSnackBar(this.reponseMessage,"");
    },(error)=>{
      if(error.error?.message){
        this.reponseMessage = error.error?.message;
      }
      else {
        this.reponseMessage = GlobalConstants.genericError;
      }
      this.snackbarService.openSnackBar(this.reponseMessage,GlobalConstants.error);
    })
  }
}
