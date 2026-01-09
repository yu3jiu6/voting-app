import React, { useEffect } from 'react';
import { FaComment } from 'react-icons/fa';

function Login({ onLogin }) {


 useEffect(() => {
    if (window.Kakao && !window.Kakao.isInitialized()) {
        window.Kakao.init('e615e80c24e48050c8251dbddbfadfe9'); 
    }
}, []);

  const handleKakaoLogin = () => {
    if (!window.Kakao || !window.Kakao.isInitialized()) {
      alert('카카오 로그인을 로딩 중입니다. 1초 뒤에 다시 시도해주세요!');
      return;
    }
    window.Kakao.Auth.login({
      success: function (authObj) {
        window.Kakao.API.request({
          url: '/v2/user/me',
          success: function (res) {
            console.log('카카오 데이터:', res); // 확인용 로그

            // 🚨 [핵심 수정] 닉네임 가져오는 모든 경로를 다 찔러봅니다.
            const nickname = 
              res.kakao_account?.profile?.nickname || 
              res.properties?.nickname || 
              "이름 없음"; // 익명 사용자 대신 '이름 없음'으로 변경 (이게 뜰 일은 거의 없을 겁니다)

            const profileImage = 
              res.kakao_account?.profile?.thumbnail_image_url || 
              res.properties?.thumbnail_image || 
              "";

            const kakaoUser = {
              uid: `kakao:${res.id}`,
              displayName: nickname,
              photoURL: profileImage,
            };
            onLogin(kakaoUser);
          },
          fail: function (error) {
            alert('사용자 정보를 불러오지 못했습니다.');
          },
        });
      },
      fail: function (err) {
        alert('로그인 실패! 팝업 차단을 확인해주세요.');
      },
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#FEE500]">
      <div className="bg-white p-10 rounded-xl shadow-lg text-center w-80">
        <h1 className="text-2xl font-bold mb-8 text-[#191919]">YBC 배드민턴🏸</h1>
        <button 
          onClick={handleKakaoLogin}
          className="w-full bg-[#FEE500] hover:bg-[#ebd300] py-3.5 rounded-lg font-bold text-[#191919] flex items-center justify-center gap-2"
        >
          <FaComment /> 카카오로 시작하기
        </button>
      </div>
    </div>
  );
}

export default Login;