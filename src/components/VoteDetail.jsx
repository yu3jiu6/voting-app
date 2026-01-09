import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot, setDoc, deleteDoc, collection, query, orderBy } from 'firebase/firestore';
import { FaCheck, FaUserFriends, FaPlus, FaTimes, FaShareAlt, FaMapMarkerAlt, FaClock } from 'react-icons/fa';

const SKILL_LEVELS = ['왕초심', '초심', 'D조', 'C조', 'B조', 'A조'];

// 카톡 스타일 옵션 디자인
const OPTION_STYLES = {
  default: "border-gray-200 bg-white hover:bg-gray-50",
  selected: "border-[#FEE500] bg-[#fffde0] ring-1 ring-[#FEE500]", 
};

function VoteDetail({ user, eventId }) {
  // --- 상태 관리 ---
  const [event, setEvent] = useState(null);       
  const [attendance, setAttendance] = useState([]); 
  const [loading, setLoading] = useState(true);

  // 게스트 모달 상태
  const [isGuestModalOpen, setIsGuestModalOpen] = useState(false);
  const [guestName, setGuestName] = useState('');
  const [guestGender, setGuestGender] = useState('M');
  const [guestSkill, setGuestSkill] = useState('왕초심');
  const [isSmallGroup, setIsSmallGroup] = useState(false);

  // 1. 실시간 데이터 구독
  useEffect(() => {
    // 이벤트 정보 구독
    const eventRef = doc(db, "events", eventId);
    const unsubscribeEvent = onSnapshot(eventRef, (docSnap) => {
      if (docSnap.exists()) setEvent(docSnap.data());
      setLoading(false);
    });

    // 참석자 명단 구독
    const attRef = collection(db, "Events", eventId, "Attendance");
    const q = query(attRef, orderBy("timestamp", "asc"));
    const unsubscribeAtt = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAttendance(list);
    });

    return () => {
      unsubscribeEvent();
      unsubscribeAtt();
    };
  }, [eventId]);

  // 로딩 처리
  if (loading) return <div className="p-10 text-center">로딩중... 🏸</div>;
  if (!event) return <div className="p-10 text-center">투표 방을 찾을 수 없습니다.</div>;

  // --- 데이터 가공 ---
  // 내 투표 상태 찾기
  const myRecord = attendance.find(p => p.userId === user?.uid && p.type === 'MEMBER');
  const mySelection = myRecord ? myRecord.status : null; // 'ATTEND' | 'ABSENT' | null

  // 참석자/불참자 분류
  const attendList = attendance.filter(p => p.status === 'ATTEND');
  const absentList = attendance.filter(p => p.status === 'ABSENT');

  // --- 핸들러 ---
  // (1) 투표 하기
  const handleVote = async (option) => {
    if (!user) return alert("로그인이 필요합니다.");
    
    // 이미 같은 걸 눌렀으면 취소
    if (mySelection === option) {
      if (window.confirm("투표를 취소하시겠습니까?")) {
        await deleteDoc(doc(db, "Events", eventId, "Attendance", user.uid));
      }
      return;
    }

    // 투표 저장 (Upsert)
    try {
      await setDoc(doc(db, "Events", eventId, "Attendance", user.uid), {
        type: 'MEMBER',
        userId: user.uid,
        name: user.displayName || "이름없음",
        status: option,
        timestamp: myRecord ? myRecord.timestamp : Date.now(),
      }, { merge: true });
    } catch (e) {
      console.error(e);
      alert("투표 실패");
    }
  };

  // (2) 게스트 추가
  const handleGuestSubmit = async () => {
    if (!guestName.trim()) return alert("이름을 입력해주세요.");
    const guestId = `guest_${user.uid}_${Date.now()}`;

    try {
      await setDoc(doc(db, "Events", eventId, "Attendance", guestId), {
        type: 'GUEST',
        userId: user.uid,
        name: guestName,
        status: 'ATTEND', // 게스트는 기본 참석
        timestamp: Date.now(),
        gender: guestGender,
        skill: guestSkill,
        isSmallGroup: isSmallGroup
      });
      setIsGuestModalOpen(false);
      setGuestName(''); setGuestGender('M'); setIsSmallGroup(false);
    } catch (e) {
      alert("게스트 등록 실패");
    }
  };

  // (3) 게스트 삭제
  const handleDeleteGuest = async (gId) => {
    if (window.confirm("정말 삭제하시겠습니까?")) {
      await deleteDoc(doc(db, "Events", eventId, "Attendance", gId));
    }
  };

  // (4) 링크 복사
  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    alert("🔗 링크가 복사되었습니다!");
  };

  // --- 렌더링 헬퍼 함수 (명단 표시용) ---
  const renderVoterNames = (list) => {
    if (list.length === 0) return <span className="text-gray-300 text-xs">아직 투표자가 없습니다</span>;
    
    return (
      <div className="flex flex-wrap gap-1 mt-1">
        {list.map((p) => (
          <span key={p.id} className="text-xs text-gray-600 bg-gray-100 px-1.5 py-0.5 rounded flex items-center gap-1">
            {p.name}
            {/* 게스트인 경우 상세정보 표시 */}
            {p.type === 'GUEST' && (
              <span className="text-[10px] text-gray-400">
                ({p.gender === 'M' ? '남' : '여'}/{p.skill})
              </span>
            )}
            {/* 소모임 표시 */}
            {p.isSmallGroup && <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>}
            {/* 내 게스트면 삭제 버튼 */}
            {p.type === 'GUEST' && p.userId === user?.uid && (
              <button onClick={(e) => { e.stopPropagation(); handleDeleteGuest(p.id); }} className="text-red-300 hover:text-red-500">
                <FaTimes size={10} />
              </button>
            )}
          </span>
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen shadow-lg text-[#191919] pb-32">
      
      {/* 1. 상단 타이틀 */}
      <div className="p-6 pb-4">
        <h1 className="text-2xl font-bold mb-2">{event.title}</h1>
        <div className="flex items-center text-gray-500 text-sm gap-3">
            <span className="flex items-center gap-1"><FaClock /> 마감 1일 전</span>
            <span className="flex items-center gap-1"><FaUserFriends /> {attendance.length}명 참여</span>
        </div>
      </div>

      {/* 2. 상태바 */}
      <div className="bg-gray-100 px-6 py-3 text-sm text-gray-600 flex justify-between items-center">
        <span>📢 투표 후 변경 가능합니다.</span>
        <span className="text-[#FEE500] font-bold bg-gray-800 px-2 py-0.5 rounded text-xs">진행중</span>
      </div>

      <div className="p-6 space-y-4">
        
        {/* 3. [참석] 투표 박스 */}
        <div 
          onClick={() => handleVote('ATTEND')}
          className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer ${mySelection === 'ATTEND' ? OPTION_STYLES.selected : OPTION_STYLES.default}`}
        >
          <div className="flex justify-between items-start mb-2">
            <div className="font-bold text-lg flex items-center gap-2">
              참석
              {mySelection === 'ATTEND' && <FaCheck className="text-[#d9c000]" />}
            </div>
            <span className="font-bold text-lg">{attendList.length}명</span>
          </div>
          {/* 명단 리스트 */}
          {renderVoterNames(attendList)}
        </div>

        {/* 4. [불참] 투표 박스 */}
        <div 
          onClick={() => handleVote('ABSENT')}
          className={`relative p-4 rounded-xl border-2 transition-all cursor-pointer ${mySelection === 'ABSENT' ? OPTION_STYLES.selected : OPTION_STYLES.default}`}
        >
          <div className="flex justify-between items-start mb-2">
            <div className="font-bold text-lg flex items-center gap-2">
              불참
              {mySelection === 'ABSENT' && <FaCheck className="text-[#d9c000]" />}
            </div>
            <span className="font-bold text-lg">{absentList.length}명</span>
          </div>
          {/* 명단 리스트 */}
          {renderVoterNames(absentList)}
        </div>

        <hr className="border-gray-100 my-6" />

        {/* 5. [요청 기능] 공유 버튼 (게스트 추가 위로 이동됨) */}
        <button 
          onClick={handleShare}
          className="w-full py-3 mb-3 border border-gray-300 rounded-lg font-medium text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-2 transition-colors"
        >
          <FaShareAlt /> 친구에게 투표 링크 공유하기
        </button>

        {/* 6. 게스트 추가 버튼 */}
        <button 
          onClick={() => setIsGuestModalOpen(true)}
          className="w-full py-3 bg-gray-100 rounded-lg font-medium text-gray-500 flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors"
        >
          <FaPlus /> 게스트 추가하기
        </button>

      </div>

      {/* --- 게스트 추가 모달 (기능 유지) --- */}
      {isGuestModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 px-4">
            <div className="bg-white w-full max-w-sm rounded-lg p-6 shadow-xl">
                <h3 className="text-lg font-bold mb-5">게스트 추가</h3>
                
                <div className="mb-4">
                    <label className="block text-sm font-bold text-gray-700 mb-1">이름</label>
                    <input type="text" value={guestName} onChange={(e) => setGuestName(e.target.value)} className="w-full border border-gray-300 rounded p-3" placeholder="이름 입력" autoFocus />
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-bold text-gray-700 mb-1">성별</label>
                    <div className="flex gap-2">
                        {['M', 'F'].map(g => (
                            <button key={g} onClick={() => setGuestGender(g)} className={`flex-1 py-3 rounded border ${guestGender === g ? 'bg-gray-800 text-white font-bold' : 'bg-white text-gray-600'}`}>
                                {g === 'M' ? '남자' : '여자'}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="mb-4">
                    <label className="block text-sm font-bold text-gray-700 mb-1">급수</label>
                    <div className="grid grid-cols-3 gap-2">
                        {SKILL_LEVELS.map(skill => (
                            <button key={skill} onClick={() => setGuestSkill(skill)} className={`py-2 text-xs rounded border ${guestSkill === skill ? 'bg-[#FEE500] border-[#FEE500] font-bold text-black' : 'bg-white text-gray-600'}`}>
                                {skill}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="mb-6">
                    <label className="flex items-center gap-2 cursor-pointer select-none p-1">
                        <div className={`w-5 h-5 rounded border flex items-center justify-center ${isSmallGroup ? 'bg-green-500 border-green-500' : 'border-gray-300 bg-white'}`}>
                            {isSmallGroup && <FaCheck size={12} color="white" />}
                        </div>
                        <input type="checkbox" checked={isSmallGroup} onChange={(e) => setIsSmallGroup(e.target.checked)} className="hidden" />
                        <span className="text-sm text-gray-700">소모임</span>
                    </label>
                </div>

                <div className="flex gap-2">
                    <button onClick={() => setIsGuestModalOpen(false)} className="flex-1 py-3 bg-gray-200 rounded text-gray-700 font-bold">취소</button>
                    <button onClick={handleGuestSubmit} className="flex-1 py-3 bg-[#FEE500] rounded text-[#191919] font-bold">등록</button>
                </div>
            </div>
        </div>
      )}

    </div>
  );
}

export default VoteDetail;