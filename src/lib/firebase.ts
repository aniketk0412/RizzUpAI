// Import the functions you need from the SDKs you need
import { initializeApp, getApps } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  "projectId": "rizzup-ai",
  "appId": "1:458871428413:web:93845a3637d176e21d2154",
  "storageBucket": "rizzup-ai.firebasestorage.app",
  "apiKey": "AIzaSyCN0YMdOPesj37FJSiaoaazE-P1n8O3sW4",
  "authDomain": "rizzup-ai.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "458871428413"
};

// Initialize Firebase
let app;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
}

const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

export { app, auth, googleProvider };
