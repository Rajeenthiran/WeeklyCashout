import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    templateUrl: './login.html',
    styleUrl: './login.css'
})
export class Login {
    email = '';
    password = '';
    isLoading = false;
    auth = inject(AuthService);
    router = inject(Router);
    toast = inject(ToastService);

    async onLogin() {
        if (!this.email || !this.password) {
            this.toast.show('Please fill in all fields', 'error');
            return;
        }
        try {
            this.isLoading = true;
            await this.auth.login(this.email, this.password);
            this.toast.show('Logged in successfully', 'success');
            this.router.navigate(['/']);
        } catch (e: any) {
            console.error(e);
            this.toast.show('Login failed: ' + e.message, 'error');
        } finally {
            this.isLoading = false;
        }
    }
}
