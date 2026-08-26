/**
 * Lumina Studio Pro - Production Authentication & Identity Service
 * Real Firebase Authentication with session persistence, Google Sign-In, and user profile management.
 */

import {
  signInWithPopup,
  signInWithRedirect,
  signOut,
  onAuthStateChanged,
  deleteUser,
  User,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, FirestoreOperationType } from './firebase';
import { CloudUserIdentity } from '../types/cloudSync';

export class AuthService {
  private currentUser: User | null = null;
  private currentProfile: CloudUserIdentity | null = null;
  private listeners: ((user: User | null, profile: CloudUserIdentity | null) => void)[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      onAuthStateChanged(auth, async (user) => {
        this.currentUser = user;
        if (user) {
          try {
            this.currentProfile = await this.syncUserProfile(user);
          } catch (err) {
            console.warn('[Lumina Auth] Profile sync warning:', err);
          }
        } else {
          this.currentProfile = null;
        }
        this.notifyListeners();
      });
    }
  }

  /**
   * Subscribes to real-time authentication & profile state changes
   */
  public subscribe(callback: (user: User | null, profile: CloudUserIdentity | null) => void): () => void {
    this.listeners.push(callback);
    callback(this.currentUser, this.currentProfile);
    return () => {
      this.listeners = this.listeners.filter((cb) => cb !== callback);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((cb) => cb(this.currentUser, this.currentProfile));
  }

  public getCurrentUser(): User | null {
    return this.currentUser;
  }

  public getUser(): User | null {
    return this.currentUser;
  }

  public getCurrentProfile(): CloudUserIdentity | null {
    return this.currentProfile;
  }

  public isAuthenticated(): boolean {
    return !!this.currentUser && !this.currentUser.isAnonymous;
  }

  public getUserId(): string | null {
    return this.currentUser?.uid || null;
  }

  /**
   * Google Sign-In via popup with redirect fallback
   */
  public async signInWithGoogle(): Promise<User> {
    try {
      const cred = await signInWithPopup(auth, googleProvider);
      this.currentUser = cred.user;
      this.currentProfile = await this.syncUserProfile(cred.user);
      this.notifyListeners();
      return cred.user;
    } catch (err: any) {
      console.warn('[Lumina Auth] Popup login failed, attempting redirect fallback:', err);
      try {
        await signInWithRedirect(auth, googleProvider);
        throw new Error('Redirecting to Google Sign-In...');
      } catch (redirectErr: any) {
        throw new Error(err.message || 'Google Sign-In failed');
      }
    }
  }

  /**
   * Sign out current user
   */
  public async signOut(): Promise<void> {
    await signOut(auth);
    this.currentUser = null;
    this.currentProfile = null;
    this.notifyListeners();
  }

  /**
   * Syncs user profile document to Firestore `users/{userId}`
   */
  public async syncUserProfile(user: User): Promise<CloudUserIdentity> {
    const userRef = doc(db, 'users', user.uid);
    const path = `users/${user.uid}`;

    try {
      const snap = await getDoc(userRef);

      if (snap.exists()) {
        const data = snap.data() as any;
        const profile: CloudUserIdentity = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || data.displayName || 'Lumina Creator',
          photoURL: user.photoURL || data.photoURL || null,
          isAnonymous: user.isAnonymous,
          emailVerified: user.emailVerified,
          tier: data.tier || 'Pro Studio',
          createdAt: data.createdAt || Date.now(),
          lastActive: Date.now(),
          storageUsedBytes: data.storageUsedBytes || 0,
          storageQuotaBytes: data.storageQuotaBytes || 10 * 1024 * 1024 * 1024, // 10 GB
        };

        await updateDoc(userRef, {
          lastActive: Date.now(),
          displayName: profile.displayName,
          photoURL: profile.photoURL,
        });

        return profile;
      }

      const initialProfile: CloudUserIdentity = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || 'Lumina Creator',
        photoURL: user.photoURL || null,
        isAnonymous: user.isAnonymous,
        emailVerified: user.emailVerified,
        tier: 'Pro Studio',
        createdAt: Date.now(),
        lastActive: Date.now(),
        storageUsedBytes: 0,
        storageQuotaBytes: 10 * 1024 * 1024 * 1024, // 10 GB
      };

      await setDoc(userRef, initialProfile);
      return initialProfile;
    } catch (error) {
      handleFirestoreError(error, FirestoreOperationType.WRITE, path);
    }
  }

  /**
   * Secure account deletion & data erasure
   */
  public async deleteAccount(): Promise<void> {
    if (!this.currentUser) throw new Error('No authenticated user to delete');
    const userRef = doc(db, 'users', this.currentUser.uid);
    try {
      await updateDoc(userRef, {
        deletedAt: Date.now(),
        email: 'deleted@user.invalid',
        displayName: 'Deleted User',
      });
      await deleteUser(this.currentUser);
      this.currentUser = null;
      this.currentProfile = null;
      this.notifyListeners();
    } catch (err: any) {
      throw new Error(`Failed to delete account: ${err.message}`);
    }
  }
}

export const authService = new AuthService();
