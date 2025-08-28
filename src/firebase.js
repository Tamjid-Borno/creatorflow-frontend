// src/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBFlLxDk6BX7zctqoVA7I0pmBQbDqyXBL0",
  authDomain: "my-react-ai-app.firebaseapp.com",
  projectId: "my-react-ai-app",
  storageBucket: "my-react-ai-app.appspot.com", // ✅ FIXED THIS LINE
  messagingSenderId: "915226686149",
  appId: "1:915226686149:web:5be7db855eaa2ff2dd76ac"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// ✅ Use long polling fallback to fix 'offline' issue
const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  cache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
});

export { auth, provider, db };
