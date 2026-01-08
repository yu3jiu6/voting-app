// src/firebase.js

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

// ⬇️ 아래 부분을 아까 복사한 'firebaseConfig' 내용으로 바꿔치기 하세요!
const firebaseConfig = {
  apiKey: "AIzaSyD6PDYQWFrm5Rl9KEJviju5Dk3UXXPQq-o",
  authDomain: "smart-vote-da32c.firebaseapp.com",
  projectId: "smart-vote-da32c",
  storageBucket: "smart-vote-da32c.firebasestorage.app",
  messagingSenderId: "594684717370",
  appId: "1:594684717370:web:ee0b9115e9a9b2939a0803",
  measurementId: "G-7TDVJ8XT69"
};
// ⬆️ 여기까지

// Firebase 초기화 (건드리지 마세요)
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);