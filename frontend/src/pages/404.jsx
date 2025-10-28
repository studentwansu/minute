import { Link } from 'react-router-dom';
import backgroundImage from '../assets/images/404.png'; // 1. 배경 이미지 import (경로 확인!)
import styles from './404.module.css'; // 또는 NotFound.module.css

// ... (로고 이미지 import는 선택 사항)

function NotFound() {
    return (
        // 2. 최상위 div에 인라인 스타일로 배경 이미지 적용
        <div
            className={styles.notFoundPage}
            style={{
                backgroundImage: `url(${backgroundImage})`
            }}
        >
            <div className={styles.contentOverlay}> {/* 3. 내용 가독성을 위한 오버레이 추가 (선택 사항) */}
                <div className={styles.container}>
                    {/* ... (로고 부분은 선택 사항) ... */}
                    <div className={styles.errorCode}>404</div>
                    <h1 className={styles.title}>페이지를 찾을 수 없습니다.</h1>
                    <p className={styles.message}>
                        요청하신 페이지의 사라졌거나, 잘못된 경로를 입력하셨습니다.
                        <br />
                        입력하신 주소가 정확한지 다시 한번 확인해주세요.
                    </p>
                    <Link to="/" className={styles.homeButton}>
                        홈페이지로 돌아가기
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default NotFound;