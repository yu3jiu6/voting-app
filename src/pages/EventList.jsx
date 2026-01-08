import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import dayjs from 'dayjs';

function EventList() {
  const [events, setEvents] = useState([]);

  // 1. 이벤트 목록 실시간 구독
  useEffect(() => {
    const colRef = collection(db, 'Events');
    const q = query(colRef, orderBy('voteStartTime', 'desc'));

    const unsub = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setEvents(list);
    });

    return () => unsub();
  }, []);

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">📋 이벤트 목록</h2>

      {events.length === 0 && (
        <p className="text-gray-500">등록된 이벤트가 없습니다.</p>
      )}

      <div className="space-y-3">
        {events.map((event) => {
          const isClosed = new Date() > event.voteDeadline?.toDate();

          return (
            <Link
              to={`/event/${event.id}`}
              key={event.id}
              className="block border rounded-lg p-4 hover:bg-gray-50 transition"
            >
              <h3 className="font-bold text-lg">
                {event.displayDate} {event.location}
              </h3>
              <p className="text-sm text-gray-600">
                {event.displayTime}
              </p>

              <p className="text-xs mt-2">
                투표 시작: {dayjs(event.voteStartTime?.toDate()).format('MM/DD HH:mm')}
              </p>
              <p className="text-xs">
                마감: {dayjs(event.voteDeadline?.toDate()).format('MM/DD HH:mm')}
              </p>

              <span
                className={`inline-block mt-2 px-2 py-1 text-xs rounded ${
                  isClosed ? 'bg-gray-300 text-gray-700' : 'bg-blue-100 text-blue-700'
                }`}
              >
                {isClosed ? '마감' : '진행중'}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export default EventList;
