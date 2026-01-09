// src/App.jsx
import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useParams } from 'react-router-dom';
import VoteDetail from './components/VoteDetail';
import Login from './pages/Login';
import AdminTools from './components/AdminTools';

// 투표 화면과 로그인을 연결하는 '중간 관리자' 컴포넌트
function VotePage() {
  const { eventId } = useParams(); // URL에서 'eventId'
  const [user, setUser] = useState(null);

  // 아직 로그인을 안 했다면 -> 로그인 화면
  if (!user) {
    return <Login onLogin={(loggedInUser) => setUser(loggedInUser)} />;
  }

  // 로그인 했다면 -> 투표 화면
  return <VoteDetail user={user} eventId={eventId} />;
}

function App() {

  // ✅ 카카오 SDK 초기화 (앱 최초 로드 시 1회)
  useEffect(() => {
    if (window.Kakao && !window.Kakao.isInitialized()) {
     window.Kakao.init(import.meta.env.VITE_KAKAO_APP_KEY || 'e615e80c24e48050c8251dbddbfadfe9');
  }, []);

  return (
    <BrowserRouter>
      <div className="bg-gray-100 min-h-screen flex justify-center">
        <div className="w-full max-w-[480px] bg-white shadow-lg min-h-screen">
          
          <Routes>
            {/* 1. 기본 주소 */}
            <Route
              path="/"
              element={
                <div className="p-10 text-center">
                  <h2 className="font-bold mb-4">잘못된 접근입니다.</h2>
                  <p className="text-sm text-gray-500">공유받은 투표 링크를 클릭해주세요.</p>
                  <a
                    href="/vote/test_event_1"
                    className="block mt-10 text-blue-500 underline"
                  >
                    [개발용] 테스트 투표방 입장하기
                  </a>
                </div>
              }
            />

            {/* 2. 실제 투표 링크 */}
            <Route path="/vote/:eventId" element={<VotePage />} />

            {/* 3. 관리자 페이지 */}
            <Route path="/admin" element={<AdminTools />} />
          </Routes>

        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
