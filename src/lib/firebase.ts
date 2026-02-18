import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
    apiKey: "AIzaSyDZhlUASBCkHmlZeBVvuCB3GSJigQMFnaE",
    authDomain: "rasepluss.firebaseapp.com",
    databaseURL:
        "https://rasepluss-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "rasepluss",
    storageBucket: "rasepluss.firebasestorage.app",
    messagingSenderId: "873403185967",
    appId: "1:873403185967:web:a8e5357029a7203ad37fda",
    measurementId: "G-PYX007N1J5",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app);
