import { Injectable, inject, signal } from '@angular/core';
import { Auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, user, User } from '@angular/fire/auth';
import { Firestore, doc, setDoc, getDoc } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { Observable, switchMap, of, from } from 'rxjs'; // Use rxjs for complex async flows if needed, but signals are great for state

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private auth = inject(Auth);
    private firestore = inject(Firestore);
    private router = inject(Router);

    // Expose current user as a signal or observable
    user$ = user(this.auth);
    currentUserSig = signal<User | null>(null);
    currentCompanyIdSig = signal<string | null>(null);
    currentCompanyNameSig = signal<string | null>(null);

    constructor() {
        // Subscribe to user changes to sync signals and fetch company ID
        this.user$.subscribe(async (u) => {
            this.currentUserSig.set(u);
            if (u) {
                const companyId = await this.fetchUserCompanyId(u.uid);
                this.currentCompanyIdSig.set(companyId);
                if (companyId) {
                    const name = await this.fetchCompanyName(companyId);
                    this.currentCompanyNameSig.set(name);
                }
            } else {
                this.currentCompanyIdSig.set(null);
                this.currentCompanyNameSig.set(null);
            }
        });
    }

    async register(companyName: string, email: string, pass: string) {
        try {
            const cred = await createUserWithEmailAndPassword(this.auth, email, pass);
            const uid = cred.user.uid;

            // 1. Create Company
            const companyRef = doc(this.firestore, 'companies', companyName); // Using name as ID for simplicity or auto-id? 
            // Plan said "Create companies document with name and ownerId". 
            // Let's use auto-ID for company to avoid name collisions? Or simple slug?
            // User request: "company registation"
            // Let's use a generated ID for robustness, or unique name. 
            // Let's use a unique ID for the company to allow name changes later.
            const companyId = crypto.randomUUID(); // Or let Firestore gen it, but we need it for user link.

            await setDoc(doc(this.firestore, 'companies', companyId), {
                name: companyName,
                ownerId: uid,
                createdAt: new Date()
            });

            // 2. Link User to Company
            await setDoc(doc(this.firestore, 'users', uid), {
                email: email,
                companyId: companyId,
                role: 'admin' // First user is admin/owner
            });

            // Manually set signal to avoid race condition with user$ subscription
            this.currentCompanyIdSig.set(companyId);
            this.currentCompanyNameSig.set(companyName);

            return true;
        } catch (e) {
            console.error('Registration failed', e);
            throw e;
        }
    }

    async login(email: string, pass: string) {
        return signInWithEmailAndPassword(this.auth, email, pass);
    }

    async logout() {
        await signOut(this.auth);
        this.router.navigate(['/login']);
    }

    private async fetchUserCompanyId(uid: string): Promise<string | null> {
        const snap = await getDoc(doc(this.firestore, 'users', uid));
        if (snap.exists()) {
            return snap.data()['companyId'];
        }
        return null;
    }

    private async fetchCompanyName(companyId: string): Promise<string | null> {
        const snap = await getDoc(doc(this.firestore, 'companies', companyId));
        if (snap.exists()) {
            return snap.data()['name'];
        }
        return null;
    }
}
