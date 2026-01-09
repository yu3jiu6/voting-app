// src/firebase.js
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

// ⚠️ 중요: 아래 값들은 Firebase 콘솔 > 프로젝트 설정 > 일반 > '내 앱'에서 복사해와야 합니다.
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// 1. 파이어베이스 앱 초기화
const app = initializeApp(firebaseConfig);

// 2. 인증(Auth) 및 데이터베이스(DB) 도구 꺼내기
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider(); // 일단 빠른 개발을 위해 구글 로그인 사용 (나중에 카카오로 교체 가능)

export { auth, db, googleProvider };