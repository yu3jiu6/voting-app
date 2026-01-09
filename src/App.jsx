import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// 페이지 컴포넌트
import EventList from './pages/EventList';
import EventDetail from './pages/EventDetail';
import Admin from './pages/Admin';

function App() {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditingName, setIsEditingName] = useState(false); // 이름 수정 모드
  const [newName, setNewName] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        const userRef = doc(db, "Users", currentUser.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          const newUser = {
            uid: currentUser.uid,
            displayName: currentUser.displayName,
            isAdmin: false, 
          };
          await setDoc(userRef, newUser);
          setUserData(newUser);
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

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error(error);
      toast.error("로그인 실패");
    }
  };

  // ✅ 닉네임 변경 함수 (전략 A 핵심)
  const handleUpdateName = async () => {
    if (!newName.trim()) return;
    try {
      const userRef = doc(db, "Users", user.uid);
      await updateDoc(userRef, { displayName: newName });
      setUserData({ ...userData, displayName: newName }); // 화면 즉시 반영
      setIsEditingName(false);
      toast.success("이름이 변경되었습니다!");
    } catch (e) {
      toast.error("이름 변경 실패");
    }
  };

  if (loading) return <div className="p-10 text-center">로딩중...</div>;

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-yellow-400">
        <h1 className="text-3xl font-bold mb-8 text-slate-800">🏸 배드민턴 투표</h1>
        <button 
          onClick={handleGoogleLogin}
          className="bg-white p-4 rounded-lg shadow-lg font-bold text-lg hover:bg-gray-100 transition"
        >
          구글 계정으로 시작하기
        </button>
        <p className="mt-4 text-sm text-gray-700">로그인 후 이름을 수정할 수 있습니다.</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="max-w-md mx-auto bg-gray-50 min-h-screen border-x relative">
        {/* 상단 헤더 */}
        <header className="p-4 bg-white shadow flex justify-between items-center sticky top-0 z-50">
          <div className="flex items-center gap-2">
            {isEditingName ? (
              <div className="flex gap-1">
                <input 
                  value={newName} 
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="새 이름"
                  className="border rounded px-2 py-1 text-sm w-24"
                />
                <button onClick={handleUpdateName} className="bg-blue-500 text-white px-2 rounded text-xs">저장</button>
                <button onClick={() => setIsEditingName(false)} className="bg-gray-300 px-2 rounded text-xs">취소</button>
              </div>
            ) : (
              <div className="flex items-center gap-2 cursor-pointer" onClick={() => {
                setNewName(userData?.displayName);
                setIsEditingName(true);
              }}>
                <span className="font-bold text-lg">{userData?.displayName}님</span>
                <span className="text-xs text-gray-400 border rounded px-1">✏️수정</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {userData?.isAdmin && (
              <Link to="/admin" className="text-sm bg-red-100 text-red-600 px-2 py-1 rounded font-bold">
                ⚙️ 관리자
              </Link>
            )} 
            <button onClick={() => signOut(auth)} className="text-xs text-gray-500 underline">
              로그아웃
            </button>
          </div>
        </header>

        <Routes>
          <Route path="/" element={<EventList user={user} />} />
          <Route
            path="/event/:eventId"
            element={<EventDetail user={user} userData={userData} />}
          />
          <Route
            path="/admin"
            element={userData?.isAdmin ? <Admin /> : <Navigate to="/" />}
          />
        </Routes>

        <ToastContainer position="bottom-center" autoClose={2000} />
      </div>
    </BrowserRouter>
  );
}

export default App;