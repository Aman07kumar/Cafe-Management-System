import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { ActivatedRouteSnapshot, Router } from '@angular/router';
import { SnackbarService } from './snackbar.service';
import { GlobalConstants } from '../shared/global-contants';
import { jwtDecode } from 'jwt-decode';

@Injectable({
  providedIn: 'root'
})
export class RouteGuardService {

  constructor( public auth:AuthService,
    public router:Router,
    private sanckbarService:SnackbarService) { }

    canActivate(route:ActivatedRouteSnapshot):boolean{
      let expectedRoleArray = route.data;
      expectedRoleArray = expectedRoleArray.expectedRole;

      const token:any = localStorage.getItem('token');
      var tokenPayload:any;
      try {
        tokenPayload = jwtDecode(token);
      }
      catch(err){
        localStorage.clear();
        this.router.navigate(['/']);
      }

      let checkRole = false;

      for (let i=0;i<expectedRoleArray.length;i++){
        if(expectedRoleArray[i] == tokenPayload.role){
          checkRole= true;
        }
      }
      if(tokenPayload.role == 'user' || tokenPayload.role =='admin'){
        if (this.auth.isAuthenticated() && checkRole){
          return true;
        }
        this.sanckbarService.openSnackBar(GlobalConstants.unauthroized,GlobalConstants.error);
        this.router.navigate(['/cafe/dashboard']);
        return false;
      }
      else {
        this.router.navigate(['/']);
        localStorage.clear();
        return false;
      }
    }
}