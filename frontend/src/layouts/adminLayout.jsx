// AdminLayout.jsx

import { Outlet as PageContentOutlet } from 'react-router-dom'; // 페이지 내용을 위한 Outlet
import Sidebar from '../components/Sidebar/Sidebar'; // Sidebar 컴포넌트의 실제 경로로 수정해주세요!

function AdminLayout() {
  return (
    // 이 div가 부모(<Layout>의 <main>)의 높이를 100% 차지하고,
    // 내부 요소들(Sidebar, content area)을 가로로 배치합니다.
    <div style={{ display: 'flex', height: '100%' }}>
      <Sidebar /> {/* Sidebar 컴포넌트 */}
      
      {/* 실제 관리자 페이지의 내용(예: Notice.js, UserManagement.js 등)이 렌더링될 영역 */}
      <div style={{
        flex: 1,                   // Sidebar를 제외한 나머지 가로 공간을 모두 차지
        overflowY: 'auto',         // 내용이 이 영역보다 길어지면 세로 스크롤바 표시
        padding: '20px'            // 컨텐츠 영역 내부 여백 (선택 사항, 필요에 따라 조절)
        // backgroundColor: '#f0f2f5' // 예시: 컨텐츠 영역 배경색 (선택 사항)
      }}>
        <PageContentOutlet /> {/* 여기에 중첩된 라우트의 컴포넌트가 렌더링됩니다. */}
      </div>
    </div>
  );
}

export default AdminLayout;