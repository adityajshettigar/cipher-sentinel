// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAjBBl0HBMDVEmZy5N5xzicD2hoLk6H5PI",
  authDomain: "cipher-sentinel.firebaseapp.com",
  projectId: "cipher-sentinel",
  storageBucket: "cipher-sentinel.firebasestorage.app",
  messagingSenderId: "1096678991289",
  appId: "1:1096678991289:web:62263dfac0a37437d8c268",
  measurementId: "G-NZSFK9LZVC"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth and Google Provider
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();