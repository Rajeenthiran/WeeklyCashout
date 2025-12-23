import { Component, inject } from '@angular/core';
import { SalesTable } from './components/sales-table/sales-table';
import { ToastComponent } from './components/toast/toast';
import { ToastService } from './services/toast.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [SalesTable, ToastComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class AppComponent {
  title = 'cashout-app';
}
