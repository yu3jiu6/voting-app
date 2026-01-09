import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../firebase';
import { doc, onSnapshot, runTransaction, collection, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { toast } from 'react-toastify';

function EventDetail({ user, userData }) {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [attendants, setAttendants] = useState([]);
  const [myStatus, setMyStatus] = useState('NONE'); 
  const [guestName, setGuestName] = useState(''); // ✅ 게스트 이름 입력용

  useEffect(() => {
    const eventRef = doc(db, "Events", eventId);
    const unsubEvent = onSnapshot(eventRef, (snap) => {
      if (snap.exists()) setEvent({ id: snap.id, ...snap.data() });
    });

    const attRef = collection(db, "Events", eventId, "Attendance");
    // 기획서 반영: 1순위 시간, 2순위 UID (동점자 방지)
    const q = query(attRef, orderBy("timestamp", "asc"), orderBy("userId", "asc"));

    const unsubAtt = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setAttendants(list);

      // 내 상태 확인 (MEMBER로서 참여했는지)
      const me = list.find(p => p.userId === user.uid && p.type === 'MEMBER');
      setMyStatus(me ? 'MEMBER' : 'NONE');
    });

    return () => { unsubEvent(); unsubAtt(); };
  }, [eventId, user.uid]);

  // 1. 회원 직접 참여 (본인)
  const handleJoinMember = async () => {
    const now = new Date();
    if (now < event.voteStartTime.toDate()) return toast.error("아직 오픈 전입니다.");
    if (now > event.voteDeadline.toDate()) return toast.error("마감되었습니다.");

    try {
      await runTransaction(db, async (transaction) => {
        const eventRef = doc(db, "Events", eventId);
        const sfDoc = await transaction.get(eventRef);
        if (!sfDoc.exists()) throw new Error("Event does not exist!");

        const attRef = collection(db, "Events", eventId, "Attendance");
        
        // 중복 체크
        if (attendants.some(a => a.userId === user.uid && a.type === 'MEMBER')) {
          throw new Error("이미 신청했습니다.");
        }

        const currentMembers = attendants.filter(a => a.type === 'MEMBER').length;
        if (currentMembers >= event.memberLimit) {
          toast.info("정원 초과 → 대기로 등록됩니다.");
        }

        const newAttRef = doc(attRef);
        transaction.set(newAttRef, {
          userId: user.uid,
          type: "MEMBER",
          name: userData.displayName || "회원",
          timestamp: serverTimestamp()
        });
      });
      toast.success("참석 완료!");
    } catch (e) {
      toast.error(e.message || "오류 발생");
    }
  };

  // 2. 게스트 추가 (친구 데려오기) - ✅ 기획서 반영: 입력창 방식
  const handleAddGuest = async () => {
    if (!guestName.trim()) return toast.warn("게스트 이름을 입력해주세요.");
    
    const now = new Date();
    if (now > event.voteDeadline.toDate()) return toast.error("마감되었습니다.");

    try {
      await runTransaction(db, async (transaction) => {
        const currentGuests = attendants.filter(a => a.type === 'GUEST').length;
        if (currentGuests >= event.guestLimit) {
          toast.info("게스트 정원 초과 → 대기로 등록됩니다.");
        }

        const newAttRef = doc(collection(db, "Events", eventId, "Attendance"));
        transaction.set(newAttRef, {
          userId: user.uid, // 초대한 사람(나)의 ID
          type: "GUEST",
          name: guestName,  // 입력한 친구 이름
          timestamp: serverTimestamp()
        });
      });
      setGuestName(''); // 입력창 비우기
      toast.success(`${guestName}님 추가 완료!`);
    } catch (e) {
      toast.error("게스트 추가 실패");
    }
  };

  const handleCancel = async (docId) => {
    const now = new Date();
    if (now > event.voteDeadline.toDate()) return toast.error("마감되어 취소 불가합니다.");

    try {
      await runTransaction(db, async (transaction) => {
        const ref = doc(db, "Events", eventId, "Attendance", docId);
        transaction.delete(ref);
      });
      toast.info("취소되었습니다.");
    } catch (e) {
      toast.error("취소 실패");
    }
  };

  if (!event) return <div>로딩중...</div>;

  const isClosed = new Date() > event.voteDeadline.toDate();
  const members = attendants.filter(a => a.type === 'MEMBER');
  const guests = attendants.filter(a => a.type === 'GUEST');

  return (
    <div className="p-4 pb-24"> {/* 하단 여백 확보 */}
      <h2 className="text-2xl font-bold">{event.displayDate} {event.location}</h2>
      <p className="text-gray-600">{event.displayTime}</p>
      <p className="text-sm mt-1">참가비: {event.fee}원</p>

      {/* 회원 명단 */}
      <div className="mt-6">
        <h3 className="font-bold border-b pb-1">🏸 회원 ({members.length}/{event.memberLimit})</h3>
        {members.map((att, index) => {
          const isWaiting = index >= event.memberLimit;
          return (
            <div key={att.id} className={`p-2 border-b flex justify-between ${isWaiting ? 'text-red-500' : 'text-blue-600'}`}>
              <span>{index + 1}. {att.name} {isWaiting && '(대기)'}</span>
              {att.userId === user.uid && !isClosed && (
                <button onClick={() => handleCancel(att.id)} className="text-xs text-gray-500 underline">취소</button>
              )}
            </div>
          );
        })}
      </div>

      {/* 게스트 명단 */}
      <div className="mt-6">
        <h3 className="font-bold border-b pb-1">☺ 게스트 ({guests.length}/{event.guestLimit})</h3>
        {guests.map((att, index) => {
          const isWaiting = index >= event.guestLimit;
          // 내가 추가한 게스트만 취소 버튼 보임
          return (
            <div key={att.id} className={`p-2 border-b flex justify-between ${isWaiting ? 'text-red-500' : 'text-green-600'}`}>
              <span>{index + 1}. {att.name} {isWaiting && '(대기)'}</span>
              {att.userId === user.uid && !isClosed && (
                <button onClick={() => handleCancel(att.id)} className="text-xs text-gray-500 underline">취소</button>
              )}
            </div>
          );
        })}
      </div>

      {/* 하단 고정 액션바 */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t p-4 max-w-md mx-auto right-0 shadow-lg">
        {/* 게스트 추가 입력창 */}
        <div className="flex gap-2 mb-2">
           <input 
             type="text" 
             placeholder="게스트 이름" 
             value={guestName}
             onChange={(e) => setGuestName(e.target.value)}
             className="border p-2 rounded flex-1"
             disabled={isClosed}
           />
           <button 
             onClick={handleAddGuest}
             disabled={isClosed}
             className="bg-green-500 text-white px-4 rounded font-bold disabled:bg-gray-300"
           >
             + 추가
           </button>
        </div>

        {/* 내 참석 버튼 */}
        <button
          onClick={handleJoinMember}
          disabled={isClosed || myStatus === 'MEMBER'}
          className={`w-full py-3 rounded text-white font-bold text-lg ${
            isClosed ? 'bg-gray-400' : (myStatus === 'MEMBER' ? 'bg-gray-400' : 'bg-blue-600')
          }`}
        >
          {isClosed ? '투표 마감' : (myStatus === 'MEMBER' ? '참석 완료 (취소는 위에서)' : '회원으로 참석하기')}
        </button>
      </div>
    </div>
  );
}

export default EventDetail;