import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from '../lib/firebase';

const ADMIN_EMAIL = 'barkissac80@gmail.com';

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  adminEmail: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setLoading(true);
      setError(null);

      if (!currentUser) {
        setUser(null);
        setIsAdmin(false);
        setLoading(false);
        return;
      }

      setUser(currentUser);

      try {
        const isMasterEmail = currentUser.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase();

        // Check if admin record exists in Firestore admins collection
        let adminExists = false;
        try {
          const adminDocRef = doc(db, 'admins', currentUser.uid);
          const adminSnap = await getDoc(adminDocRef);

          if (adminSnap.exists()) {
            adminExists = true;
          } else if (isMasterEmail) {
            // Bootstrap master admin in Firestore
            await setDoc(adminDocRef, {
              id: currentUser.uid,
              email: currentUser.email,
              name: currentUser.displayName || 'Super Admin',
              role: 'superadmin',
              created_at: new Date().toISOString(),
            }, { merge: true });
            adminExists = true;
          }
        } catch (dbErr) {
          console.warn('Could not read admin doc from Firestore directly:', dbErr);
          // If master email matches, still grant admin locally
          if (isMasterEmail) {
            adminExists = true;
          }
        }

        setIsAdmin(adminExists || isMasterEmail);
      } catch (err: any) {
        console.error('Error verifying admin permissions:', err);
        setError(err.message || 'Erreur lors de la vérification des droits.');
        setIsAdmin(currentUser.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase());
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setError(null);
    setLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error('Google sign-in error:', err);
      setError(err.message || 'Échec de la connexion Google');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setIsAdmin(false);
    } catch (err: any) {
      console.error('Logout error:', err);
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        loading,
        error,
        signInWithGoogle,
        logout,
        adminEmail: ADMIN_EMAIL,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
