import { Injectable, inject } from '@angular/core';
import { Firestore, collection, addDoc, doc, setDoc, getDoc, getDocs } from '@angular/fire/firestore';

import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private firestore = inject(Firestore);
  private authService = inject(AuthService);

  private get companyId() {
    return this.authService.currentCompanyIdSig();
  }

  // Helper to ensure we have a company ID or throw/return null
  private get companyRef() {
    const cid = this.companyId;
    if (!cid) throw new Error('No company ID found');
    return doc(this.firestore, 'companies', cid);
  }

  async saveData(data: any) {
    // We want to overwrite or update if exists, but for simplicity with generated IDs in addDoc:
    // Better to use setDoc with a custom ID (like weekId) to avoid duplicates easily.
    // Let's query first or use a known ID structure?
    // User wants to save "date as well need to show somewhere in week wise" - we are saving the whole week structure.

    // Let's use weekId as the document ID for simplicity and to ensure overwrite.
    // But addDoc generates ID. setDoc needs a ref.
    const weekId = data.weekId;
    if (weekId) {
      // companies/{cid}/daily_sales/{weekId}
      const docRef = doc(this.firestore, 'companies', this.companyId!, 'daily_sales', weekId);
      return setDoc(docRef, {
        ...data,
        lastUpdated: new Date()
      });
    } else {
      // Ideally we don't hit this if weekId is always present in save, but just in case
      const colRef = collection(this.firestore, 'companies', this.companyId!, 'daily_sales');
      return addDoc(colRef, {
        ...data,
        timestamp: new Date()
      });
    }
  }

  async getWeekData(weekId: string) {
    if (!this.companyId) return null;
    const docRef = doc(this.firestore, 'companies', this.companyId, 'daily_sales', weekId);
    const snapshot = await getDoc(docRef);
    return snapshot.exists() ? snapshot.data() : null;
  }

  async getSavedWeeks(): Promise<string[]> {
    if (!this.companyId) return [];
    const colRef = collection(this.firestore, 'companies', this.companyId, 'daily_sales');
    const snapshot = await getDocs(colRef);
    return snapshot.docs.map(doc => doc.id).sort().reverse();
  }

  async getEmployeeNames() {
    if (!this.companyId) return null;
    const docRef = doc(this.firestore, 'companies', this.companyId, 'settings', 'employees');
    const snapshot = await getDoc(docRef);
    return snapshot.exists() ? snapshot.data()?.['names'] : null;
  }

  async saveEmployeeNames(names: string[]) {
    if (!this.companyId) throw new Error('No Company ID');
    const docRef = doc(this.firestore, 'companies', this.companyId, 'settings', 'employees');
    return setDoc(docRef, { names });
  }

  async getCompanyConfig() {
    if (!this.companyId) return null;
    const docRef = doc(this.firestore, 'companies', this.companyId, 'settings', 'config');
    const snapshot = await getDoc(docRef);
    return snapshot.exists() ? snapshot.data() : null;
  }

  async saveCompanyConfig(config: any) {
    if (!this.companyId) throw new Error('No Company ID');
    const docRef = doc(this.firestore, 'companies', this.companyId, 'settings', 'config');
    return setDoc(docRef, config);
  }
}
