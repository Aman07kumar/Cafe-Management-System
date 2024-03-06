import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { BillService } from 'src/app/services/bill.service';
import { CategoryService } from 'src/app/services/category.service';
import { ProductService } from 'src/app/services/product.service';
import { SnackbarService } from 'src/app/services/snackbar.service';
import { GlobalConstants } from 'src/app/shared/global-contants';
import { saveAs } from 'file-saver';


@Component({
  selector: 'app-manage-order',
  templateUrl: './manage-order.component.html',
  styleUrls: ['./manage-order.component.scss']
})
export class ManageOrderComponent implements OnInit {

  displayedColumns:string[] =['name','category','price','quantity','total','edit'];
  dataSource:any =[];
  manageOrderForm:any = FormGroup;
  categorys:any =[];
  products:any =[];
  price:any;
  totalAmount:number =0;
  responseMessage:any;

  constructor(private formBuilder:FormBuilder,
    private categoryService:CategoryService,
    private productService:ProductService,
    private snackbarService:SnackbarService,
    private billService:BillService) { }

  ngOnInit(): void {
    this.getCategorys();
    this.manageOrderForm =this.formBuilder.group({
      name:[null,[Validators.required,Validators.pattern(GlobalConstants.nameRegex)]],
      email:[null,[Validators.required,Validators.pattern(GlobalConstants.emailRegex)]],
      contactNumber:[null,[Validators.required,Validators.pattern(GlobalConstants.contactNumberRegex)]],
      paymentMethod:[null,[Validators.required]],
      product:[null,[Validators.required]],
      category:[null,[Validators.required]],
      quantity:[null,[Validators.required]],
      price:[null,[Validators.required]],
      total:[0,[Validators.required]]
    })
  }

  getCategorys(){
    this.categoryService.getCategorys().subscribe((response:any)=>{
      this.categorys = response;

    },(error:any)=>{
      if(error.error?.message){
        this.responseMessage = error.error?.message;
      }
      else{
        this.responseMessage =GlobalConstants.genericError;
      }
      this.snackbarService.openSnackBar(this.responseMessage,GlobalConstants.error);
    })
  }

  getProductsByCategory(value:any){
    this.productService.getProductByCategory(value.id).subscribe((response:any)=>{
      this.products = response;
      this.manageOrderForm.controls['price'].setValue('');
      this.manageOrderForm.controls['quantity'].setValue('');
      this.manageOrderForm.controls['total'].setValue(0);
    },(error:any)=>{
      if(error.error?.message){
        this.responseMessage = error.error?.message;
      }
      else{
        this.responseMessage =GlobalConstants.genericError;
      }
      this.snackbarService.openSnackBar(this.responseMessage,GlobalConstants.error);
    })
  }

  getProductDetails(value:any){
    this.productService.getById(value.id).subscribe((response:any)=>{
      this.price = response.price;
      this.manageOrderForm.controls['price'].setValue(response.price);
      this.manageOrderForm.controls['quantity'].setValue('1');
      this.manageOrderForm.controls['total'].setValue(this.price*1);
    },(error:any)=>{
      if(error.error?.message){
        this.responseMessage = error.error?.message;
      }
      else{
        this.responseMessage =GlobalConstants.genericError;
      }
      this.snackbarService.openSnackBar(this.responseMessage,GlobalConstants.error);
    })
  }

  setQuantity(value:any){
    var temp = this.manageOrderForm.controls['quantity'].value;
    if(temp>0){
      this.manageOrderForm.controls['total'].setValue(this.manageOrderForm.controls['quantity'].value*this.manageOrderForm.controls['price'].value);
    }
    else if(temp !=''){
      this.manageOrderForm.controls['quantity'].setValue('1');
      this.manageOrderForm.controls['total'].setValue(this.manageOrderForm.controls['quantity'].value*this.manageOrderForm.controls['price'].value);
    }
  }
  validateProductAdd(){
    if(this.manageOrderForm.controls['total'].value === 0 || this.manageOrderForm.controls['total'].value === null || this.manageOrderForm.controls['quantity'].value <=0)
    return true;

    else
    return false;
  }

  validateSubmit(){
   
      const nameControl = this.manageOrderForm.controls['name'];
      const emailControl = this.manageOrderForm.controls['email'];
      const contactNumberControl = this.manageOrderForm.controls['contactNumber'];
      const paymentMethodControl = this.manageOrderForm.controls['paymentMethod'];
    
      if (this.totalAmount === 0 ||
          !nameControl.value ||
          !emailControl.value ||
          !contactNumberControl.value ||
          !paymentMethodControl.value ||
          !contactNumberControl.valid ||
          !emailControl.valid) {
        return true;
      } else {
        return false;
      }
    
    
    // if(this.totalAmount ===0 
    //   || this.manageOrderForm.controls['name'].value === 0 
    //   || this.manageOrderForm.controls['email'].value === 0 
    //   || this.manageOrderForm.controls['contactNumber'].value === 0
    //   || this.manageOrderForm.controls['paymentMethod'].value === 0 
    //   || !(this.manageOrderForm.controls['contactNUmber'].valid) 
    //   || !(this.manageOrderForm.controls['email'].valid))
    // return true;

    // else
    // return false;
  }

  add(){
    var formData = this.manageOrderForm.value;
    var productName = this.dataSource.find((e:{id:number;})=>e.id == formData.product.id);
    if(productName == undefined){
      this.totalAmount = this.totalAmount + formData.total;
      this.dataSource.push({id:formData.product.id,name:formData.product.name,category:formData.category,quantity:formData.quantity,price:formData.price,total:formData.total});
      this.dataSource= [...this.dataSource];
      this.snackbarService.openSnackBar(GlobalConstants.productAdded,"success");
    }

    else {
      this.snackbarService.openSnackBar(GlobalConstants.productExistError,GlobalConstants.error)
    }
  }

  handleDeleteAction(value:any,element:any){
    this.totalAmount = this.totalAmount - element.total;
    this.dataSource.splice(value,1);
    this.dataSource = [...this.dataSource];
  }

  submitAction() {
    var formData = this.manageOrderForm.value;

    var data = {
        name: formData.name,
        email: formData.email,
        contactNumber: formData.contactNumber,
        paymentMethod: formData.paymentMethod,
        totalAmount: this.totalAmount,
        productDetails: JSON.stringify(this.dataSource)
    };

    this.billService.generateReport(data).subscribe(
        (response: any) => {
            // If the report is successfully generated, download the file
            this.downloadFile(response?.uuid);
            
            // Reset form, clear data source, and total amount
            this.manageOrderForm.reset();
            this.dataSource = [];
            this.totalAmount = 0;
        },
        (error: any) => {
            // Handle errors
            if (error.error?.message) {
                this.responseMessage = error.error?.message;
            } else {
                this.responseMessage = GlobalConstants.genericError;
            }
            
            // Display error message using a snackbar or similar UI component
            this.snackbarService.openSnackBar(this.responseMessage, GlobalConstants.error);
        }
    );
}

  // submitAction(){
  //   var formData = this.manageOrderForm.value;

  //   var data = {
  //     name:formData.name,
  //     email:formData.email,
  //     contactNumber:formData.contactNumber,
  //     paymentMethod:formData.paymentMethod,
  //     totalAmount:this.totalAmount,
  //     productDetails:JSON.stringify(this.dataSource)
  //   }

  //   this.billService.generateReport(data).subscribe((response:any)=>{
  //     this.downloadFile(response?.uuid);
  //     this.manageOrderForm.reset();
  //     this.dataSource = [];
  //     this.totalAmount = 0;

  //   },(error:any)=>{
  //     if(error.error?.message){
  //       this.responseMessage = error.error?.message;
  //     }
  //     else{
  //       this.responseMessage =GlobalConstants.genericError;
  //     }
  //     this.snackbarService.openSnackBar(this.responseMessage,GlobalConstants.error);

  //   })

    
  // }

  downloadFile(fileName:any){
    var data = {
      uuid:fileName
    }
    this.billService.getPDf(data).subscribe((response:any)=>{
      saveAs(response,fileName+'.pdf');
    })
  }

}
