import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// 페이지 컴포넌트들 (나중에 파일로 분리하면 좋습니다)
import EventList from './pages/EventList';
import EventDetail from './pages/EventDetail';
import Admin from './pages/Admin';

function App() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        // 유저 DB 확인 및 생성
        const userRef = doc(db, "Users", currentUser.uid);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
          // 신규 가입
          await setDoc(userRef, {
            uid: currentUser.uid,
            displayName: currentUser.displayName,
            isAdmin: false // 기본값 false
          });
          setUserData({ uid: currentUser.uid, displayName: currentUser.displayName, isAdmin: false });
        } else {
          setUserData(userSnap.data());
        }
        setUser(currentUser);
      } else {
        setUser(null);
        setUserData(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider(); // 일단 구글로 진행
    await signInWithPopup(auth, provider);
  };

  if (loading) return <div>로딩중...</div>;

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-yellow-400">
        <h1 className="text-3xl font-bold mb-8">🏀 농구 동호회 투표</h1>
        <button onClick={handleLogin} className="bg-white p-4 rounded-lg shadow-lg font-bold">
          카카오(구글) 계정으로 시작하기
        </button>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="max-w-md mx-auto bg-gray-50 min-h-screen border-x">
        <header className="p-4 bg-white shadow flex justify-between items-center">
          <span className="font-bold">{userData?.displayName}님</span>
          {userData?.isAdmin && <a href="/admin" className="text-sm bg-red-100 p-1 rounded">⚙️관리자</a>}
          <button onClick={() => signOut(auth)} className="text-xs text-gray-500 ml-2">로그아웃</button>
        </header>
        
        <Routes>
          <Route path="/" element={<EventList user={user} />} />
          <Route path="/event/:eventId" element={<EventDetail user={user} userData={userData} />} />
          <Route path="/admin" element={userData?.isAdmin ? <Admin /> : <Navigate to="/" />} />
        </Routes>
        <ToastContainer position="bottom-center" />
      </div>
    </BrowserRouter>
  );
}

export default App;