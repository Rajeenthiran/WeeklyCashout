import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AuthService } from './services/auth.service';
import { CommonModule } from '@angular/common';
import { ToastComponent } from './components/toast/toast';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, ToastComponent],
  template: `
    <div *ngIf="isLoading()" class="fixed inset-0 flex items-center justify-center bg-white z-50">
      Loading...
    </div>
    <app-toast></app-toast>
    <router-outlet></router-outlet>
  `
})
export class AppComponent {
  auth = inject(AuthService);
  // Simple loading check - in real app we might want more robust auth state check
  // but auth.user$ is initially null until first emission?
  // User$ emits null if not logged in.

  isLoading() {
    // Optional: Global loading state
    return false;
  }
}
