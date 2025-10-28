import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "./HamburgerMenu.module.css";
import { MONTH_TO_REGION } from "../../pages/Recommend/monthToRegion";

function HamburgerMenu({ isOpen, setIsOpen }) {
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [showBoardMenu, setShowBoardMenu] = useState(false);
  const navigate = useNavigate();

  const token = localStorage.getItem("token");
  const isLoggedIn = Boolean(token);

  const handleMonthly = () => {
    const month = new Date().getMonth() + 1;
    const region = MONTH_TO_REGION[month] || 'seoul';
    navigate(`/area/${region}`);
    setIsOpen(false);
  };

  return (
    <div className={styles.hamburgerContainer}>
      <div className={styles.hamburgerIcon} onClick={() => setIsOpen(!isOpen)}>
        <div className={`${styles.bar} ${isOpen ? styles.open : ""}`}></div>
        <div className={`${styles.bar} ${isOpen ? styles.open : ""}`}></div>
        <div className={`${styles.bar} ${isOpen ? styles.open : ""}`}></div>
      </div>

      <nav className={`${styles.menu} ${isOpen ? styles.show : ""}`}>
        <div className={styles.menuItem}>
          <a onClick={() => setShowCategoryMenu(!showCategoryMenu)}>
            카테고리
          </a>
          {showCategoryMenu && (
            <div className={styles.submenu}>
              <Link to="/camping" onClick={() => setIsOpen(false)}>캠핑</Link>
              <Link to="/healing" onClick={() => setIsOpen(false)}>힐링</Link>
              <Link to="/mountain" onClick={() => setIsOpen(false)}>산</Link>
              <Link to="/themepark" onClick={() => setIsOpen(false)}>테마파크</Link>
            </div>
          )}
        </div>
        <div className={styles.menuItem}>
          <a onClick={() => setShowBoardMenu(!showBoardMenu)}>
            게시판
          </a>
          {showBoardMenu && (
            <div className={styles.submenu}>
              <Link to="/notice" onClick={() => setIsOpen(false)}>공지사항</Link>
              <Link to="/freeboard" onClick={() => setIsOpen(false)}>자유게시판</Link>
              <Link to="/qna" onClick={() => setIsOpen(false)}>Q&A게시판</Link>
            </div>
          )}
        </div>
        {isLoggedIn && (
          <div className={styles.menuItem}>
            <a onClick={handleMonthly}>월별추천</a>
          </div>
        )}
      </nav>
    </div>
  );
}

export default HamburgerMenu;
