import React, { createContext, useState, useContext, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  sendEmailVerification
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../../firebase'; 
const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
       
        await loadUserData(firebaseUser.uid);
      } else {
        setUser(null);
        setUserData(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const loadUserData = async (uid) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', uid));
      if (userDoc.exists()) {
        setUserData(userDoc.data());
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  
  const register = async (formData) => {
    try {
      const { firstName, middleName, lastName, email, password } = formData;

      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

     
      await sendEmailVerification(userCredential.user);

      
      await setDoc(doc(db, 'users', uid), {
        uid,
        firstName,
        middleName: middleName || '',
        lastName,
        email,
        fullName: `${firstName} ${middleName ? middleName + ' ' : ''}${lastName}`,
        role: 'teacher', // Default role
        emailVerified: false,
        createdAt: new Date().toISOString(),
      });

      // Sign out the user after registration (they need to verify email first)
      await signOut(auth);

      return { 
        success: true, 
        message: 'Registration successful! Please check your email to verify your account before logging in.' 
      };
    } catch (error) {
      console.error('Registration error:', error);
      
      // Handle Firebase errors
      let errorMessage = 'Registration failed. Please try again.';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'This email is already registered. Please login instead.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please use a stronger password.';
      }

      return { success: false, error: errorMessage };
    }
  };

  
  const login = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
   
      if (!userCredential.user.emailVerified) {
        
        await signOut(auth);
        return { 
          success: false, 
          error: 'Please verify your email address before logging in. Check your inbox for the verification link.',
          needsVerification: true
        };
      }

      await loadUserData(userCredential.user.uid);

  
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        emailVerified: true
      }, { merge: true });

      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      
      let errorMessage = 'Login failed. Please try again.';
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Invalid email address.';
      } else if (error.code === 'auth/invalid-credential') {
        errorMessage = 'Invalid email or password.';
      }

      return { success: false, error: errorMessage };
    }
  };

 
  const resendVerificationEmail = async () => {
    try {
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
        return { 
          success: true, 
          message: 'Verification email sent! Please check your inbox.' 
        };
      }
      return { 
        success: false, 
        error: 'No user logged in. Please login first.' 
      };
    } catch (error) {
      console.error('Resend verification error:', error);
      return { 
        success: false, 
        error: 'Failed to send verification email. Please try again later.' 
      };
    }
  };

  
  const logout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setUserData(null);
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error: 'Logout failed. Please try again.' };
    }
  };

  const value = {
    user,
    userData,
    loading,
    register,
    login,
    logout,
    resendVerificationEmail,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}