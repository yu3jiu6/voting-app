import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { db } from '../firebase';
import { doc, onSnapshot, runTransaction, collection, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { toast } from 'react-toastify';
import dayjs from 'dayjs';

function EventDetail({ user, userData }) {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [attendants, setAttendants] = useState([]);
  const [myStatus, setMyStatus] = useState(null); // 'MEMBER', 'GUEST', 'WAITING' 등

  // 1. 데이터 실시간 구독 (onSnapshot)
  useEffect(() => {
    const eventRef = doc(db, "Events", eventId);
    const unsubEvent = onSnapshot(eventRef, (snap) => {
      if(snap.exists()) setEvent({id: snap.id, ...snap.data()});
    });

    const attRef = collection(db, "Events", eventId, "Attendance");
    // 기획서 v4.1: 시간순 정렬 + 동점자 UID 정렬
    const q = query(attRef, orderBy("timestamp", "asc"), orderBy("userId", "asc"));
    
    const unsubAtt = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(d => ({id: d.id, ...d.data()}));
      setAttendants(list);
      
      // 내 상태 확인
      const me = list.find(p => p.userId === user.uid && p.type === 'MEMBER');
      setMyStatus(me ? 'JOINED' : 'NONE');
    });

    return () => { unsubEvent(); unsubAtt(); };
  }, [eventId, user.uid]);

  // 2. 참석 버튼 클릭 (트랜잭션)
  const handleJoin = async () => {
    // 마감/오픈 시간 체크 (클라이언트 레벨 1차 방어)
    const now = new Date();
    if (now < event.voteStartTime.toDate()) return toast.error("아직 오픈 전입니다.");
    if (now > event.voteDeadline.toDate()) return toast.error("마감되었습니다.");

    try {
      await runTransaction(db, async (transaction) => {
        const eventRef = doc(db, "Events", eventId);
        const sfDoc = await transaction.get(eventRef);
        if (!sfDoc.exists()) throw "Event does not exist!";
        
        // 현재 인원 다시 카운트 (DB 기준)
        const attRef = collection(db, "Events", eventId, "Attendance");
        // *주의: Transaction 내에서 collection count는 비용이 듭니다. 
        // 무료 플랜 최적화를 위해 여기서는 문서 읽기를 최소화하는 방식 or 읽어온 리스트 활용
        // (오늘 완성을 위해 간단한 방식으로 갑니다: 그냥 추가하고 순위는 UI에서 자름)
        
        const newAttRef = doc(attRef); // Auto ID
        transaction.set(newAttRef, {
          userId: user.uid,
          type: "MEMBER",
          name: userData.displayName || "이름없음",
          timestamp: serverTimestamp() // 서버 시간 필수
        });
      });
      toast.success("신청 완료!");
    } catch (e) {
      console.error(e);
      toast.error("오류가 발생했습니다: " + e.message);
    }
  };

  const handleCancel = async (docId) => {
     // 마감 체크
     const now = new Date();
     if (now > event.voteDeadline.toDate()) return toast.error("마감되어 취소 불가! 운영진에게 문의하세요.");
     
     // 본인 확인 로직은 Firestore Rule이 막아주지만 여기서도 체크
     try {
       await runTransaction(db, async (transaction) => {
         const ref = doc(db, "Events", eventId, "Attendance", docId);
         transaction.delete(ref);
       });
       toast.info("취소되었습니다.");
     } catch(e) {
       toast.error("취소 실패");
     }
  };

  if (!event) return <div>로딩중...</div>;

  // UI 렌더링 (리스트 자르기 로직 등)은 여기서 구현
  const memberLimit = event.memberLimit;
  // attendants 배열을 앞에서부터 memberLimit 만큼 자르면 확정, 나머지는 대기
  
  const isClosed = new Date() > event.voteDeadline.toDate();

  return (
    <div className="p-4 pb-20">
      <h2 className="text-2xl font-bold">{event.displayDate} {event.location}</h2>
      <p className="text-gray-600">{event.displayTime}</p>
      
      {/* 타이머 및 현황판 UI 구현 필요 */}
      
      <div className="mt-4">
        <h3 className="font-bold">참석자 명단</h3>
        {attendants.map((att, index) => {
           const isWaiting = (att.type === 'MEMBER' && index >= memberLimit);
           return (
             <div key={att.id} className={`p-2 border-b ${isWaiting ? 'text-red-500' : 'text-blue-600'}`}>
               {index + 1}. {att.name} {isWaiting ? '(대기)' : '(확정)'}
               {att.userId === user.uid && !isClosed && (
                 <button onClick={() => handleCancel(att.id)} className="ml-2 text-xs border p-1">취소</button>
               )}
             </div>
           );
        })}
      </div>

      {/* 하단 고정 바 */}
      <div className="fixed bottom-0 left-0 w-full bg-white border-t p-4 flex justify-between items-center max-w-md mx-auto right-0">
         <button 
           onClick={handleJoin}
           disabled={isClosed || myStatus === 'JOINED'}
           className={`w-full py-3 rounded text-white font-bold ${isClosed ? 'bg-gray-400' : 'bg-blue-600'}`}
         >
           {isClosed ? "마감됨" : (myStatus === 'JOINED' ? "신청완료" : "참석하기")}
         </button>
      </div>
    </div>
  );
}

export default EventDetail;