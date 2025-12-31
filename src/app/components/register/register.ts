import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';

@Component({
    selector: 'app-register',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterModule],
    templateUrl: './register.html',
    styleUrl: './register.css'
})
export class Register {
    companyName = '';
    email = '';
    password = '';
    isLoading = false;

    auth = inject(AuthService);
    router = inject(Router);
    toast = inject(ToastService);

    async onRegister() {
        if (!this.companyName || !this.email || !this.password) {
            this.toast.show('Please fill in all fields', 'error');
            return;
        }


        try {
            this.isLoading = true;
            await this.auth.register(this.companyName, this.email, this.password);
            this.toast.show('Company registered successfully!', 'success');
            this.router.navigate(['/']);
        } catch (e: any) {
            console.error(e);
            this.toast.show('Registration failed: ' + e.message, 'error');
        } finally {
            this.isLoading = false;
        }
    }
}
