import React, { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { toast } from 'react-toastify';

function Admin() {
  const [displayDate, setDisplayDate] = useState('');
  const [displayTime, setDisplayTime] = useState('');
  const [location, setLocation] = useState('');
  const [memberLimit, setMemberLimit] = useState(10);
  const [guestLimit, setGuestLimit] = useState(0);     // ✅ 추가
  const [fee, setFee] = useState(0);                   // ✅ 추가
  const [voteStartTime, setVoteStartTime] = useState('');
  const [voteDeadline, setVoteDeadline] = useState('');

  const handleCreate = async () => {
    if (!displayDate || !location || !voteStartTime || !voteDeadline) {
      return toast.error('모든 항목을 입력해주세요.');
    }

    try {
      await addDoc(collection(db, 'Events'), {
        displayDate,
        displayTime,
        location,
        memberLimit: Number(memberLimit),
        guestLimit: Number(guestLimit),   // ✅ 추가
        fee: Number(fee),                 // ✅ 추가
        voteStartTime: new Date(voteStartTime),
        voteDeadline: new Date(voteDeadline),
        createdAt: serverTimestamp(),
      });

      toast.success('이벤트가 생성되었습니다!');
      setDisplayDate('');
      setDisplayTime('');
      setLocation('');
      setMemberLimit(10);
      setGuestLimit(0);
      setFee(0);
      setVoteStartTime('');
      setVoteDeadline('');
    } catch (e) {
      console.error(e);
      toast.error('이벤트 생성 실패');
    }
  };

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">🛠 관리자 페이지</h2>

      <div className="space-y-3">
        <input
          type="text"
          placeholder="날짜 (예: 3/20)"
          value={displayDate}
          onChange={(e) => setDisplayDate(e.target.value)}
          className="w-full border p-2 rounded"
        />

        <input
          type="text"
          placeholder="시간 (예: 오후 7시)"
          value={displayTime}
          onChange={(e) => setDisplayTime(e.target.value)}
          className="w-full border p-2 rounded"
        />

        <input
          type="text"
          placeholder="장소"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          className="w-full border p-2 rounded"
        />

        <input
          type="number"
          placeholder="회원 정원"
          value={memberLimit}
          onChange={(e) => setMemberLimit(e.target.value)}
          className="w-full border p-2 rounded"
        />

        <input
          type="number"
          placeholder="게스트 정원"
          value={guestLimit}
          onChange={(e) => setGuestLimit(e.target.value)}
          className="w-full border p-2 rounded"
        />

        <input
          type="number"
          placeholder="참가비 (원)"
          value={fee}
          onChange={(e) => setFee(e.target.value)}
          className="w-full border p-2 rounded"
        />

       <div>
          <label className="text-sm">투표 시작 시간</label>
          <input type="datetime-local" 
          value={voteStartTime} 
          onChange={(e) => setVoteStartTime(e.target.value)} 
          className="w-full border p-2 rounded" />
        </div>
        <div>
          <label className="text-sm">투표 마감 시간</label>
          <input type="datetime-local" 
          value={voteDeadline} 
          onChange={(e) => setVoteDeadline(e.target.value)} 
          className="w-full border p-2 rounded" />
        </div>

        <button onClick={handleCreate} 
        className="w-full bg-blue-600 text-white py-2 rounded font-bold">
          이벤트 생성
        </button>
      </div>
    </div>
  );
}

export default Admin;
