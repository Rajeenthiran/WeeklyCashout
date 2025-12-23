import { Injectable, inject } from '@angular/core';
import { Firestore, collection, addDoc, doc, setDoc, getDoc, getDocs } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private firestore = inject(Firestore);

  async saveData(data: any) {
    // We want to overwrite or update if exists, but for simplicity with generated IDs in addDoc:
    // Better to use setDoc with a custom ID (like weekId) to avoid duplicates easily.
    // Let's query first or use a known ID structure?
    // User wants to save "date as well need to show somewhere in week wise" - we are saving the whole week structure.

    // Let's use weekId as the document ID for simplicity and to ensure overwrite.
    // But addDoc generates ID. setDoc needs a ref.
    const weekId = data.weekId;
    if (weekId) {
      const docRef = doc(this.firestore, 'daily_sales', weekId);
      return setDoc(docRef, {
        ...data,
        lastUpdated: new Date()
      });
    } else {
      const colRef = collection(this.firestore, 'daily_sales');
      return addDoc(colRef, {
        ...data,
        timestamp: new Date()
      });
    }
  }

  async getWeekData(weekId: string) {
    const docRef = doc(this.firestore, 'daily_sales', weekId);
    const snapshot = await getDoc(docRef);
    return snapshot.exists() ? snapshot.data() : null;
  }

  async getSavedWeeks(): Promise<string[]> {
    const colRef = collection(this.firestore, 'daily_sales');
    const snapshot = await getDocs(colRef);
    return snapshot.docs.map(doc => doc.id).sort().reverse();
  }

  async getEmployeeNames() {
    const docRef = doc(this.firestore, 'settings', 'employees');
    const snapshot = await getDoc(docRef);
    return snapshot.exists() ? snapshot.data()?.['names'] : null;
  }

  async saveEmployeeNames(names: string[]) {
    const docRef = doc(this.firestore, 'settings', 'employees');
    return setDoc(docRef, { names });
  }
}
