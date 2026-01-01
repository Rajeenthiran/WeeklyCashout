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
    errorMessage = '';
    auth = inject(AuthService);
    router = inject(Router);
    toast = inject(ToastService);

    async onLogin() {
        this.errorMessage = ''; // Clear previous errors

        if (!this.email || !this.password) {
            this.errorMessage = 'Please enter both email and password.';
            return;
        }

        try {
            this.isLoading = true;
            await this.auth.login(this.email, this.password);
            this.toast.show('Logged in successfully', 'success');
            this.router.navigate(['/']);
        } catch (e: any) {
            console.error(e);
            this.errorMessage = this.getFriendlyErrorMessage(e);
        } finally {
            this.isLoading = false;
        }
    }

    private getFriendlyErrorMessage(error: any): string {
        const code = error.code || error.message;

        switch (code) {
            case 'auth/invalid-credential':
            case 'auth/wrong-password':
            case 'auth/user-not-found':
                return 'Invalid email or password.';
            case 'auth/invalid-email':
                return 'Please enter a valid email address.';
            case 'auth/too-many-requests':
                return 'Access blocked due to unusual activity. Try again later.';
            case 'auth/network-request-failed':
                return 'Network error. Please check your internet connection.';
            default:
                return 'Login failed. Please try again.';
        }
    }
}
