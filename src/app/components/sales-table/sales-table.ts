import { Component, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api';
import { ToastService } from '../../services/toast.service';
import { AuthService } from '../../services/auth.service';

interface SalesRow {
  name: string;
  direct: number | string;
  visa: number | string;
  master: number | string;
  amex: number | string;
  diner: number | string;
  coupons: number | string;
  cash: number | string;
  reading: number | string;
}

interface DayEntry {
  date: string;
  dayName: string;
  rows: SalesRow[];
}

interface WeekData {
  weekId: string;
  days: DayEntry[];
}

@Component({
  selector: 'app-sales-table',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sales-table.html',
  styleUrl: './sales-table.css'
})
export class SalesTable {
  private apiService = inject(ApiService);
  private toast = inject(ToastService);
  private auth = inject(AuthService);

  names: string[] = []; // Current active employees (for management tab)
  dropdownNames: string[] = []; // Merged list for dropdowns (active + legacy)
  savedWeeks: string[] = []; // List of saved week IDs

  get companyName() {
    return this.auth.currentCompanyNameSig();
  }

  // Tab State
  activeTab: 'cashout' | 'employees' | 'history' = 'cashout';

  selectedWeek: string = '';
  weekData: WeekData | null = null;
  editingCell: string | null = null;

  startEditing(dayIndex: number, rowIndex: number, field: string) {
    this.editingCell = `${dayIndex}-${rowIndex}-${field}`;
  }

  stopEditing() {
    this.editingCell = null;
  }

  isEditing(dayIndex: number, rowIndex: number, field: string): boolean {
    return this.editingCell === `${dayIndex}-${rowIndex}-${field}`;
  }

  constructor() {
    // React to company ID changes to load data
    effect(() => {
      const cid = this.auth.currentCompanyIdSig();
      if (cid) {
        this.loadEmployees();
        this.loadHistory();
      }
    });
  }

  async logout() {
    await this.auth.logout();
  }

  async loadHistory() {
    try {
      this.savedWeeks = await this.apiService.getSavedWeeks();
    } catch (e) {
      console.error('Error loading history', e);
    }
  }

  async openWeek(weekId: string) {
    this.selectedWeek = weekId;
    this.activeTab = 'cashout';
    this.weekData = null; // Clear current view while loading

    try {
      const data = await this.apiService.getWeekData(weekId);
      if (data) {
        this.weekData = data as WeekData;
        this.updateDropdownNames();
        this.toast.show(`Loaded Week: ${weekId}`, 'success');
      } else {
        this.toast.show('Week data not found', 'error');
      }
    } catch (e) {
      console.error(e);
      this.toast.show('Error loading week', 'error');
    }
  }

  async loadEmployees() {
    try {
      const names = await this.apiService.getEmployeeNames();
      if (names && Array.isArray(names)) {
        this.names = names;
      } else {
        // Fallback default
        this.names = ['User 1', 'User 2'];
      }
      this.updateDropdownNames();
    } catch (e) {
      console.error('Error loading employees', e);
      this.names = ['Error Loading'];
      this.updateDropdownNames();
    }
  }

  updateDropdownNames() {
    // Start with active names
    const merged = new Set(this.names);

    // Add any names found in current week data
    if (this.weekData) {
      this.weekData.days.forEach(day => {
        day.rows.forEach(row => {
          if (row.name && row.name.trim() !== '') {
            merged.add(row.name);
          }
        });
      });
    }

    this.dropdownNames = Array.from(merged).sort();
  }

  addEmployeeName() {
    this.names.push('');
  }

  removeEmployeeName(index: number) {
    this.names.splice(index, 1);
  }

  async saveEmployees() {
    // Filter empty names
    this.names = this.names.filter(n => n.trim() !== '');
    try {
      await this.apiService.saveEmployeeNames(this.names);
      this.toast.show('Employee list saved successfully!', 'success');
      this.updateDropdownNames();
    } catch (e) {
      console.error('Error saving employees', e);
      this.toast.show('Failed to save employees', 'error');
    }
  }
  async onWeekChange(event: any) {
    const weekVal = event.target.value;
    if (weekVal) {
      this.selectedWeek = weekVal;
      // Try to load existing data first
      try {
        const data = await this.apiService.getWeekData(weekVal);
        if (data) {
          this.weekData = data as WeekData;
        } else {
          this.generateWeekData(weekVal);
        }
        this.updateDropdownNames();
      } catch (e) {
        console.error('Error loading week data', e);
        this.generateWeekData(weekVal);
        this.updateDropdownNames();
      }
    }
  }

  generateWeekData(weekId: string) {
    // Create 7 days
    const [year, week] = weekId.split('-W');
    const simpleDate = new Date(parseInt(year), 0, 1 + (parseInt(week) - 1) * 7);
    const dayOfWeek = simpleDate.getDay();
    const startOfWeek = simpleDate;
    // Adjust to Monday (if needed) - "week" inputs usually follow ISO which starts Monday
    // Calculate Monday of that ISO week
    // Basic approach: input type=week gives ISO week.
    // Let's iterate 0 to 6 (Monday to Sunday)

    // Better ISO week date calc might be needed, but for "Add Rows" grouping, names are most important.
    // Let's use a helper to get dates if possible, or just strict Day Names.

    const days: DayEntry[] = [];
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    // We can just create buckets for now without strict date math if the user just wants "Week X" grouping.
    // But "add by date wise" implies dates.

    // Let's do a reliable approximation for the UI labels.
    // input type="week" value is "2023-W01".

    const w = parseInt(week);
    const y = parseInt(year);
    const d = new Date(y, 0, 4); // Jan 4th is always in week 1
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + (w - 1) * 7 - (d.getDay() || 7) + 1); // Start of ISO week (Monday)

    for (let i = 0; i < 7; i++) {
      const current = new Date(d);
      current.setDate(d.getDate() + i);
      days.push({
        date: current.toISOString().split('T')[0],
        dayName: dayNames[i],
        rows: [] // Start empty, user adds rows
      });
    }

    this.weekData = {
      weekId: weekId,
      days: days
    };
  }

  addRow(day: DayEntry) {
    day.rows.push({
      name: '',
      direct: 0,
      visa: 0,
      master: 0,
      amex: 0,
      diner: 0,
      coupons: 0,
      cash: 0,
      reading: 0
    });
  }

  removeRow(day: DayEntry, index: number) {
    day.rows.splice(index, 1);
    this.updateDropdownNames();
  }

  safeParse(val: any): number {
    if (typeof val === 'number') return val;
    if (!val) return 0;
    try {
      const parts = val.toString().split('+');
      return parts.reduce((acc: number, part: string) => acc + (parseFloat(part) || 0), 0);
    } catch (e) {
      return 0;
    }
  }

  // evaluateExpression removed - we keep the expression in the model

  getRowTotal(row: SalesRow): number {
    return this.safeParse(row.direct) + this.safeParse(row.visa) + this.safeParse(row.master) +
      this.safeParse(row.amex) + this.safeParse(row.diner) + this.safeParse(row.coupons) + this.safeParse(row.cash);
  }

  getRowTips(row: SalesRow): number {
    return this.safeParse(row.reading) * 0.04;
  }

  getDayTotal(day: DayEntry, field: keyof SalesRow): number {
    return day.rows.reduce((acc, row) => acc + this.safeParse(row[field]), 0);
  }

  getDayGrandTotal(day: DayEntry): number {
    return day.rows.reduce((acc, row) => acc + this.getRowTotal(row), 0);
  }

  getDayTotalTips(day: DayEntry): number {
    return day.rows.reduce((acc, row) => acc + this.getRowTips(row), 0);
  }

  // New Calculations
  getRowDiff(row: SalesRow): number {
    // Diff = Reading - Total
    return this.safeParse(row.reading) - this.getRowTotal(row);
  }

  getRowFinal(row: SalesRow): number {
    // Final = Tips + Diff
    return this.getRowTips(row) + this.getRowDiff(row);
  }

  getDayTotalDiff(day: DayEntry): number {
    return day.rows.reduce((acc, row) => acc + this.getRowDiff(row), 0);
  }

  getDayTotalFinal(day: DayEntry): number {
    return day.rows.reduce((acc, row) => acc + this.getRowFinal(row), 0);
  }

  getDayTotalReading(day: DayEntry): number {
    return day.rows.reduce((acc, row) => acc + this.safeParse(row.reading), 0);
  }

  // Overall Week Totals
  getWeekTotal(field: keyof SalesRow): number {
    if (!this.weekData) return 0;
    return this.weekData.days.reduce((acc, day) => acc + this.getDayTotal(day, field), 0);
  }

  getWeekGrandTotal(): number {
    if (!this.weekData) return 0;
    return this.weekData.days.reduce((acc, day) => acc + this.getDayGrandTotal(day), 0);
  }

  getWeekTotalTips(): number {
    if (!this.weekData) return 0;
    return this.weekData.days.reduce((acc, day) => acc + this.getDayTotalTips(day), 0);
  }

  getWeekTotalReading(): number {
    if (!this.weekData) return 0;
    return this.weekData.days.reduce((acc, day) => acc + this.getDayTotalReading(day), 0);
  }

  getWeekTotalDiff(): number {
    if (!this.weekData) return 0;
    return this.weekData.days.reduce((acc, day) => acc + this.getDayTotalDiff(day), 0);
  }

  getWeekTotalFinal(): number {
    if (!this.weekData) return 0;
    return this.weekData.days.reduce((acc, day) => acc + this.getDayTotalFinal(day), 0);
  }

  getWeekRange(): string {
    if (!this.weekData || this.weekData.days.length === 0) return '';
    const start = this.weekData.days[0].date;
    const end = this.weekData.days[6].date;
    return `${start} - ${end}`;
  }

  async save() {
    if (!this.weekData) return;

    // Validate Company ID presence
    const cid = this.auth.currentCompanyIdSig();
    if (!cid) {
      this.toast.show('Error: No Company ID found. Please Login again.', 'error');
      return;
    }

    try {
      // Save entire week structure
      await this.apiService.saveData(this.weekData);
      this.toast.show('Week data saved successfully!', 'success');
      this.loadHistory(); // Refresh history list
    } catch (error) {
      console.error('Error saving data:', error);
      this.toast.show('Error saving data. See console.', 'error');
    }
  }

  // Helper to format 2023-W01 -> "Jan 2 - Jan 8, 2023"
  getWeekRangeLabel(weekId: string): string {
    if (!weekId) return '';
    try {
      const parts = weekId.split('-W');
      if (parts.length < 2) return weekId;

      const year = parseInt(parts[0]);
      const week = parseInt(parts[1]);

      // Calculate start of ISO week
      const simple = new Date(year, 0, 4); // Jan 4th is always in week 1
      const day = simple.getDay() || 7; // Get day (Mon=1 ... Sun=7)
      simple.setDate(simple.getDate() + (week - 1) * 7 - day + 1);

      const start = simple;
      const end = new Date(start);
      end.setDate(start.getDate() + 6);

      const fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const fmtFull = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

      // If same year
      if (start.getFullYear() === end.getFullYear()) {
        return `${fmt(start)} - ${fmt(end)}, ${start.getFullYear()}`;
      }
      return `${fmtFull(start)} - ${fmtFull(end)}`;
    } catch (e) {
      return weekId;
    }
  }

  getWeekLabel(weekId: string): string {
    if (!weekId) return '';
    try {
      const parts = weekId.split('-W');
      if (parts.length < 2) return weekId;
      const year = parseInt(parts[0]);
      const week = parseInt(parts[1]);

      const d = new Date(year, 0, 4); // Jan 4th
      d.setHours(0, 0, 0, 0);
      d.setDate(d.getDate() + (week - 1) * 7 - (d.getDay() || 7) + 1); // Start of ISO week (Monday)

      const end = new Date(d);
      end.setDate(d.getDate() + 6); // End of week (Sunday)

      // Format: Jan 2 - Jan 8 2023
      // Helper for simple formatting
      const format = (date: Date) => {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      };

      const formatShort = (date: Date) => {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      };

      return `${formatShort(d)} - ${format(end)}`;

    } catch (e) {
      return weekId;
    }
  }

  trackByIndex(index: number, obj: any): any {
    return index;
  }
}
