// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyC5DXJl37G_W_gTeKXzkosUas9cbuRr3IA",
  authDomain: "plero-53c8f.firebaseapp.com",
  projectId: "plero-53c8f",
  storageBucket: "plero-53c8f.firebasestorage.app",
  messagingSenderId: "569413580792",
  appId: "1:569413580792:web:f4ea8cc316dd2ceb04880d",
  measurementId: "G-MVVBQ0GKYM"
};

// Initialize Firebase for server-side use (without analytics)
const app = initializeApp(firebaseConfig);

export default app;