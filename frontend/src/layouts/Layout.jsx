// src/Layout.jsx (또는 해당 파일 경로)

import { Outlet, useLocation } from "react-router-dom";
import Footer from "../components/Footer/Footer"; // 경로에 맞게 수정
import Header from "../components/Header/Header"; // 일반 사용자 헤더, 경로에 맞게 수정
import AdminHeader from "../components/Header/adminHeader"; // 방금 수정한 관리자 헤더, 경로에 맞게 수정
import styles from "./Layout.module.css"; // 경로에 맞게 수정

function Layout() {
    const location = useLocation();
    // 현재 경로가 '/admin'으로 시작하는지 확인합니다.
    // 라우팅 구조에 따라 이 조건은 달라질 수 있습니다.
    const isAdminPage = location.pathname.startsWith('/admin');

    return (
        <>
            <div className={styles.layoutStyle}>
                {/* isAdminPage 값에 따라 적절한 헤더를 렌더링합니다. */}
                {isAdminPage ? <AdminHeader /> : <Header />}
                
                <main style={{ flex: 1 }}>
                    <Outlet /> {/* 이 Outlet을 통해 AdminLayout.jsx 또는 다른 페이지 컴포넌트가 렌더링됩니다. */}
                </main>
                <Footer />
            </div>
        </>
    );
}

export default Layout;