import React from 'react';
import { useNavigate } from 'react-router-dom';
import { RiKakaoTalkFill } from 'react-icons/ri'; // 아이콘 없으면 이 줄 지우셔도 됩니다.

const Login = ({ onLogin }) => {
  const navigate = useNavigate();

  const handleKakaoLogin = () => {
    // 1. 카카오 SDK가 로드되었는지 확인
    if (!window.Kakao || !window.Kakao.isInitialized()) {
      console.error('Kakao SDK가 아직 로드되지 않았습니다.');
      return;
    }

    // 2. 카카오 로그인 (v2 최신 문법)
    window.Kakao.Auth.login({
      success: function (authObj) {
        // 토큰 받기 성공 -> 사용자 정보 요청
        window.Kakao.API.request({
          url: '/v2/user/me',
          success: function (res) {
            console.log('카카오 데이터:', res);

            const nickname =
              res.kakao_account?.profile?.nickname ||
              res.properties?.nickname ||
              "이름 없음";

            const profileImage =
              res.kakao_account?.profile?.thumbnail_image_url ||
              res.properties?.thumbnail_image ||
              "";

            const kakaoUser = {
              uid: `kakao:${res.id}`,
              displayName: nickname,
              photoURL: profileImage,
            };
            
            // 로그인 성공 처리
            if (onLogin) {
                onLogin(kakaoUser);
            }
            // 메인 페이지로 이동
            navigate('/');
          },
          fail: function (error) {
            console.error('사용자 정보 요청 실패:', error);
            alert('사용자 정보를 불러오지 못했습니다.');
          },
        });
      },
      fail: function (err) {
        console.error('로그인 실패:', err);
        alert('로그인에 실패했습니다.');
      },
    });
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg text-center">
        <h1 className="text-2xl font-bold mb-6">로그인</h1>
        <p className="text-gray-600 mb-6">서비스를 이용하려면 로그인이 필요합니다.</p>
        
        <button
          onClick={handleKakaoLogin}
          className="bg-[#FEE500] text-[#191919] px-6 py-3 rounded-md font-bold flex items-center justify-center gap-2 hover:bg-[#FDD835] transition w-full"
        >
          {/* 아이콘이 설치되어 있다면 */}
          <RiKakaoTalkFill size={24} />
          카카오로 시작하기
        </button>
      </div>
    </div>
  );
};

export default Login;
