import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import type { User } from '../types';

class AuthService {
  async register(email: string, password: string, name: string, role: 'admin' | 'client' = 'admin'): Promise<User> {
    try {
      // Create Firebase user
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Create user document in Firestore
      const user: User = {
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
        name,
        role,
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'users', firebaseUser.uid), user);
      
      return user;
    } catch (error) {
      throw new Error(this.getErrorMessage(error));
    }
  }

  async login(email: string, password: string): Promise<User> {
    try {
      // Sign in with Firebase
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;

      // Get user data from Firestore
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      
      if (!userDoc.exists()) {
        throw new Error('User data not found');
      }

      return userDoc.data() as User;
    } catch (error) {
      throw new Error(this.getErrorMessage(error));
    }
  }

  async logout(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error) {
      throw new Error(this.getErrorMessage(error));
    }
  }

  getCurrentUser(): User | null {
    const firebaseUser = auth.currentUser;
    if (!firebaseUser) return null;
    
    // Return basic user info from Firebase
    // Full info should be fetched from Firestore
    return {
      id: firebaseUser.uid,
      email: firebaseUser.email || '',
      name: firebaseUser.displayName || 'Usuario',
      role: 'admin',
      createdAt: new Date().toISOString(),
    };
  }

  isAuthenticated(): boolean {
    return auth.currentUser !== null;
  }

  getAuthState() {
    return auth.currentUser;
  }

  private getErrorMessage(error: unknown): string {
    const code =
      error && typeof error === 'object' && 'code' in error
        ? String((error as { code: string }).code)
        : '';
    const message =
      error && typeof error === 'object' && 'message' in error
        ? String((error as { message: string }).message)
        : '';

    const errorMessages: Record<string, string> = {
      'auth/email-already-in-use': 'Este email ya está registrado',
      'auth/invalid-email': 'Email inválido',
      'auth/weak-password': 'La contraseña debe tener al menos 6 caracteres',
      'auth/user-not-found': 'Usuario no encontrado',
      'auth/wrong-password': 'Contraseña incorrecta',
      'auth/too-many-requests': 'Demasiados intentos. Intenta más tarde',
    };

    return errorMessages[code] || message || 'Error de autenticación';
  }
}

export const authService = new AuthService();

