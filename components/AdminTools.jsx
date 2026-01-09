// src/components/AdminTools.jsx
import React from 'react';
import { db } from '../firebase';
import { doc, setDoc, Timestamp } from 'firebase/firestore';

function AdminTools() {
  const createTestEvent = async () => {
    const eventId = "test_game_1"; // 테스트용 ID 고정
    
    // 내일 날짜 구하기
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateString = `${tomorrow.getMonth() + 1}/${tomorrow.getDate()}(${['일','월','화','수','목','금','토'][tomorrow.getDay()]})`;

    try {
      await setDoc(doc(db, "Events", eventId), {
        title: `${dateString} 정기운동`,
        displayDate: dateString,
        // 투표 시작: 어제, 마감: 내일 (테스트 위해 항상 오픈 상태로)
        voteStartTime: Timestamp.fromMillis(Date.now() - 86400000), 
        voteDeadline: Timestamp.fromMillis(Date.now() + 86400000),
        memberLimit: 20,
        guestLimit: 5,
        status: "OPEN"
      });
      alert(`성공! '/vote/${eventId}' 주소로 접속해보세요.`);
    } catch (error) {
      console.error(error);
      alert("에러 발생 (콘솔 확인)");
    }
  };

  return (
    <div className="p-10 text-center">
      <h1 className="text-xl font-bold mb-4">🔧 관리자 도구</h1>
      <button 
        onClick={createTestEvent}
        className="bg-black text-white px-6 py-3 rounded-lg font-bold hover:bg-gray-800"
      >
        테스트 투표방 생성하기 (ID: test_game_1)
      </button>
    </div>
  );
}

export default AdminTools;