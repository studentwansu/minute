import { NavLink } from 'react-router-dom'; // NavLink import
import styles from './Sidebar.module.css';
// 예시 아이콘 (실제로는 react-icons 등에서 가져오거나 SVG 사용)
// import { FaUserFriends, FaBell, FaQuestionCircle, FaBullhorn, FaClipboardList, FaEdit } from 'react-icons/fa';
import { default as BoardIcon, default as FreeboardIcon } from '../../assets/images/board.png';
import MembersIcon from '../../assets/images/member.png';
import MyPageIcon from '../../assets/images/mypage.png';
import NoticeIcon from '../../assets/images/notice.png';
import ReportIcon from '../../assets/images/report.png';
import UsersIcon from '../../assets/images/team.png';

const Sidebar = () => {
    const menus = [
        { name: "마이페이지", path: "/admin", icon: MyPageIcon },
        { name: "회원관리", path: "/admin/users", icon: UsersIcon },
        { name: "신고회원 관리", path: "/admin/reportedmembers", icon: MembersIcon },
        { name: "문의 관리", path: "/admin/managerQna", icon: FreeboardIcon },
        { name: "공지사항 관리", path: "/admin/managerNotice", icon: NoticeIcon},
        { name: "신고글 관리", path: "/admin/reportedposts", icon: ReportIcon },
        { name: "자유게시판", path: "/admin/managerFreeboard", icon: BoardIcon},
    ];

    return (
        <aside className={styles.sidebar}>
            <div className={styles.logoArea}>
                {/* 로고가 있다면 여기에 추가 */}
                {/* <img src="/path/to/logo.png" alt="Admin Logo" className={styles.logo} /> */}
                <span className={styles.logoText}>MINUTE</span> {/* 예시 로고 텍스트 */}
            </div>
            <ul className={styles.menuList}>
                {menus.map((menu) => (
                    <li key={menu.name} className={styles.menuItem} >
                        <NavLink
                            to={menu.path}
                              end={menu.path === '/admin'}  // 정확히 /admin 일 때만 active
                            // NavLink는 active일 때 자동으로 active 클래스를 부여하지만,
                            // CSS Modules에서는 styles.active를 직접 지정해야 할 수 있습니다.
                            // className={({ isActive }) => isActive ? `${styles.menuLink} ${styles.active}` : styles.menuLink}
                            // 또는 CSS에서 a.active 로 스타일링 가능
                            className={({ isActive }) => `${styles.menuLink} ${isActive ? styles.activeMenuItem : ''}`}
                        >
 
                              <img src={menu.icon} alt={menu.name} className={styles.menuIcon} />
                            <span className={styles.menuText}>{menu.name}</span>
                        </NavLink>
                    </li>
                ))}
            </ul>
        </aside>
    );
};

export default Sidebar;