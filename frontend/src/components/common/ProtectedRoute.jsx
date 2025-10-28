// 예시 경로: src/components/common/ProtectedRoute.jsx
import { Navigate, useLocation } from 'react-router-dom';

// 로그인 상태를 확인하는 함수
const checkAuth = () => {
    const token = localStorage.getItem('token'); // LoginPage.jsx에서 'token' 키로 저장했으므로 여기서도 동일하게 확인
    return !!token; // 토큰이 존재하면 true, 없으면 false 반환
};

const ProtectedRoute = ({ children }) => {
    const location = useLocation(); // 현재 경로 정보를 가져옵니다.

    if (!checkAuth()) {
        // 사용자가 로그인하지 않았다면 로그인 페이지로 리다이렉트합니다.
        // state={{ from: location }} 옵션은 로그인 후 원래 가려던 페이지로 돌아오게 할 때 사용됩니다.
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // 로그인한 사용자라면 요청한 페이지(children)를 렌더링합니다.
    return children;
}; //제발 실행 잘되라~~

export default ProtectedRoute;