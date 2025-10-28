// src/api/apiClient.js 파일
import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api',
});

apiClient.interceptors.request.use(
  (config) => {
    // LoginPage.jsx 에서 localStorage.setItem('token', ...) 으로 저장했으므로,
    // 여기서 사용하는 키도 'token' 이어야 합니다.
    const tokenKey = 'token'; // 👈 ★★★ 이 부분을 'token'으로 수정합니다! ★★★

    console.log(`[apiClient.js] Request Interceptor: 현재 설정된 토큰 저장 키(tokenKey)는 '${tokenKey}' 입니다.`);
    const token = localStorage.getItem(tokenKey);
    console.log(`[apiClient.js] Request Interceptor: localStorage에서 '${tokenKey}' 키로 가져온 토큰 값:`, token);

    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
      console.log(`[apiClient.js] ✅ 토큰 발견! Authorization 헤더에 Bearer 토큰을 추가했습니다. (토큰 앞 20자: ${token.substring(0,20)}..., 길이: ${token.length})`);
    } else {
      console.warn(`[apiClient.js] ⚠️ 경고: localStorage에서 '${tokenKey}' 키에 해당하는 토큰을 찾지 못했습니다.`);
      console.warn(`[apiClient.js] 💡 확인해주세요: 1. 로그인 시 '${tokenKey}' 키로 토큰이 정확히 저장되었는지, 2. 위 tokenKey 변수 철자가 정확한지 확인해주세요.`);
    }
    return config;
  },
  (error) => {
    console.error('[apiClient.js] 요청 인터셉터에서 오류 발생:', error);
    return Promise.reject(error);
  }
);

// ... (응답 인터셉터는 이전과 동일하게 유지)
apiClient.interceptors.response.use(
  (response) => {
    console.log('[apiClient.js] 응답 인터셉터: 정상 응답 (상태 코드 ' + response.status + ')을 받았습니다.');
    return response;
  },
  (error) => {
    if (error.response) {
      const status = error.response.status;
      const data = error.response.data;
      console.error(`[apiClient.js] API 응답 오류 발생: 상태 코드 ${status}`, data);

      if (status === 401) {
        const serverMessage = data?.message || '서버에서 인증 실패 응답을 받았습니다.';
        alert(`인증 오류 (401): ${serverMessage}\n\n브라우저 개발자 도구의 콘솔(Console) 창에서 [apiClient.js]로 시작하는 로그를 확인하여, 토큰이 정상적으로 로드되고 헤더에 추가되었는지 점검해주세요.`);
      }
    } else if (error.request) {
      console.error('[apiClient.js] API 요청 실패 (서버로부터 응답 없음):', error.request);
      alert('서버로부터 응답을 받지 못했습니다. 네트워크 연결을 확인해주세요.');
    } else {
      console.error('[apiClient.js] API 요청 설정 중 오류 발생:', error.message);
      alert('API 요청을 보내는 중 오류가 발생했습니다.');
    }
    return Promise.reject(error);
  }
);

export default apiClient;