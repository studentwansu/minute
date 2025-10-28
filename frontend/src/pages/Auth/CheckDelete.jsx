
import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../../assets/styles/CheckDelete.module.css";

function CheckDelete() {
    const [agreeChecked, setAgreeChecked] = useState(false);
    const navigate = useNavigate();

    const handleDelete = async () => {
        if (!agreeChecked) {
            alert("회원 탈퇴에 동의해야 합니다.");
            return;
        }

        const confirmDelete = window.confirm("정말로 탈퇴하시겠습니까?");
        if (!confirmDelete) return;

        try {
            const token = localStorage.getItem("token");

            await axios.delete("http://localhost:8080/api/v1/user/delete", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                withCredentials: true,
            });

            alert("회원 탈퇴가 완료되었습니다.");
            localStorage.clear(); 
            navigate("/login"); 
        } catch (err) {
            console.error(err);
            alert("회원 탈퇴에 실패했습니다. 다시 시도해주세요.");
        }
    };

    return (
        <div className={styles.pageWrapper}>
            <div className={styles.container}>
                <div className={styles.header}></div>
                <div className={styles.box}>
                    <h1 className={styles["main-text"]}>정말 탈퇴하시겠습니까?</h1>

                    <div className={styles.box1}>
                        <span className={styles.redtext}>
                            회원탈퇴 시 개인정보 및 MIN:UTE 에서 만들어진 모든 데이터는 삭제됩니다.
                            (단, 아래 항목은 표기된 법률에 따라 특정 기간 동안 보관됩니다.)
                        </span>
                        <h4>
                            1. 이용자 식별 정보: 최대 1년간 보관<br />
                            2. 서비스 이용 기록: 최대 3년간 보관<br />
                            3. 민원 및 분쟁 처리 기록: 최대 3년간 보관<br />
                            4. 상담 및 고객 지원 기록: 최대 1년간 보관<br />
                            5. 부정 이용 방지 기록: 최대 1년간 보관
                        </h4>
                    </div>

                    <h1 className={styles["body-text"]}>▪ 유의사항</h1>
                    <div className={styles.box2}>
                        <h4>
                            ▪ 탈퇴 시 모든 서비스 이용이 중단됩니다.<br />
                            ▪ 북마크 등의 데이터는 삭제되며 복구되지 않습니다.
                        </h4>
                    </div>

                    <h1 className={styles["body-text"]}>▪ 탈퇴사유</h1>
                    <input
                        type="text"
                        className={styles.text_box}
                        placeholder="예시) 아이디 변경/ 재가입 목적"
                    />

                    <div>
                        <input
                            type="checkbox"
                            id="agree"
                            checked={agreeChecked}
                            onChange={(e) => setAgreeChecked(e.target.checked)}
                        />
                        <label htmlFor="agree">해당 내용을 모두 확인했으며, 회원탈퇴에 동의합니다.</label>
                    </div>

                    <button className={styles.da_btn} onClick={handleDelete}>
                        회원 탈퇴
                    </button>
                </div>
            </div>
        </div>
    );
}

export default CheckDelete;

