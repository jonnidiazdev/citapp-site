import { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { useAuthStore } from '../store/authStore';
import type { User } from '../types';

export const useAuthStateListener = () => {
  const setUser = useAuthStore((state) => state.setUser);

  useEffect(() => {
    // Listen for auth state changes from Firebase
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Fetch user data from Firestore
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          
          if (userDoc.exists()) {
            const user = userDoc.data() as User;
            setUser(user);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setUser(null);
        }
      } else {
        // User logged out or not authenticated
        setUser(null);
      }
    });

    return () => unsubscribe();
  }, [setUser]);
};
