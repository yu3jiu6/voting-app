// src/App.jsx
import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, useParams, useNavigate } from 'react-router-dom';
import VoteDetail from './components/VoteDetail';
import { Login } from './pages/Login';
import AdminTools from './components/AdminTools';

// 투표 화면과 로그인을 연결하는 '중간 관리자' 컴포넌트
function VotePage() {
  const { eventId } = useParams(); // URL에서 'eventId' (예: vote_1)를 꺼냅니다.
  const [user, setUser] = useState(null);

  // 아직 로그인을 안 했다면 -> 로그인 화면 보여줌
  if (!user) {
    return (
      <Login onLogin={(loggedInUser) => setUser(loggedInUser)} />
    );
  }

  // 로그인 했다면 -> 투표 화면 (eventId를 넘겨줌)
  return <VoteDetail user={user} eventId={eventId} />;
}

function App() {
  return (
    <BrowserRouter>
      <div className="bg-gray-100 min-h-screen flex justify-center">
        <div className="w-full max-w-[480px] bg-white shadow-lg min-h-screen">
          
          <Routes>
            {/* 1. 기본 주소로 들어왔을 때 (테스트용 리다이렉트) */}
            <Route path="/" element={
              <div className="p-10 text-center">
                <h2 className="font-bold mb-4">잘못된 접근입니다.</h2>
                <p className="text-sm text-gray-500">공유받은 투표 링크를 클릭해주세요.</p>
                {/* 개발용: 편의를 위해 테스트 링크 제공 */}
                <a href="/vote/test_event_1" className="block mt-10 text-blue-500 underline">
                  [개발용] 1/9 정기운동 투표방 입장하기
                </a>
              </div>
            } />

            {/* 2. 실제 투표 링크 (예: /vote/event_123) */}
            <Route path="/vote/:eventId" element={<VotePage />} />
            <Route path="/admin" element={<AdminTools />} /> 
            <Route path="/vote/:eventId" element={<VotePage />} />

          </Routes>

        </div>
      </div>
    </BrowserRouter>
  );
}

export default App;
