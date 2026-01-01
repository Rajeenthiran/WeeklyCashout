import { Routes, CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from './services/auth.service';
import { map, take, tap } from 'rxjs/operators';
import { Login } from './components/login/login';
import { Register } from './components/register/register';
import { SalesTable } from './components/sales-table/sales-table';

export const authGuard: CanActivateFn = (route, state) => {
    const auth = inject(AuthService);
    const router = inject(Router);

    return auth.user$.pipe(
        take(1),
        map(user => {
            // If user exists, allow access
            // If user DOES NOT exist, redirect to login
            if (user) return true;
            return router.createUrlTree(['/login']);
        })
    );
};

export const publicGuard: CanActivateFn = (route, state) => {
    const auth = inject(AuthService);
    const router = inject(Router);
    return auth.user$.pipe(
        take(1),
        map(user => {
            if (user) return router.createUrlTree(['/']);
            return true;
        })
    )
}

export const routes: Routes = [
    { path: '', component: SalesTable, canActivate: [authGuard] },
    { path: 'login', component: Login, canActivate: [publicGuard] },
    // { path: 'register', component: Register, canActivate: [publicGuard] },
    { path: '**', redirectTo: '' }
];
