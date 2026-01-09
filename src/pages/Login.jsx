const handleKakaoLogin = () => {
    // 1. 카카오 SDK가 초기화되었는지 안전하게 확인
    if (!window.Kakao || !window.Kakao.isInitialized()) {
      console.error('Kakao SDK가 아직 로드되지 않았습니다.');
      return;
    }

    // 2. 최신 버전(v2) 로그인 방식
    window.Kakao.Auth.login({
      success: function (authObj) {
        // 토큰 받기 성공! 이제 사용자 정보(닉네임 등)를 가져옵니다.
        window.Kakao.API.request({
          url: '/v2/user/me',
          success: function (res) {
            console.log('카카오 데이터:', res);

            // 닉네임, 프로필 이미지 안전하게 꺼내기
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
            
            // 로그인 처리 함수 실행
            onLogin(kakaoUser);
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
