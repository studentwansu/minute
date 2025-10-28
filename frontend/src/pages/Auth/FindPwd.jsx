import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import keyImage from '../../assets/images/key.png';
import styles from '../../assets/styles/FindPwd.module.css';

function FindPwd() {
    const [userId, setUserId] = useState('');
    const [userEmail, setUserEmail] = useState('');
    const [certificationNumber, setCertificationNumber] = useState('');
    const [isCertifiedSent, setIsCertifiedSent] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const navigate = useNavigate();

    // 이메일 정규식 검사
    const isValidEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    // 인증번호 입력 + 이메일 유효성 검사 완료 시 버튼 활성화
    const isFormValid = certificationNumber.trim() !== '' && isValidEmail(userEmail);
    const isFormValidToSend = userId.trim() !== '' && userEmail.trim();

    const handleSendCode = async (e) => {
        e.preventDefault();
        if (!userId || !userEmail) {
            setErrorMessage("ID와 이메일을 입력해 주세요.");
            return;
        }
        if (!isValidEmail(userEmail)) {
            setErrorMessage("유효한 이메일 형식을 입력해 주세요.");
            return;
        }

        try {
            const response = await axios.post('http://localhost:8080/api/v1/auth/find-pw', {
                userId,
                userEmail
            });

            if (response.status === 200) {
                setErrorMessage("인증번호가 이메일로 전송되었습니다.");
                setIsCertifiedSent(true);
            }
        } catch (error) {
            setErrorMessage("사용자 정보가 일치하지 않습니다.");
        }
    };

    const handleVerifyCode = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post('http://localhost:8080/api/v1/auth/verify-code', {
                userEmail,
                certificationNumber
            });

            if (response.status === 200) {
                alert("인증되었습니다.");
                navigate('/findpwd2', { state: { userEmail } });
            }
        } catch (error) {
            setErrorMessage("인증번호가 일치하지 않습니다.");
        }
    };

    return (
        <div className={styles.pageWrapper}>
            <div className={styles.container}>
                <div className={styles.boxf}>
                    <div className={styles.keyimgf}>
                        <img className={styles.keyimg1f} src={keyImage} alt="key image" />
                    </div>

                    <h1 className={styles.titlef}>Forget Password?</h1>

                    <form className={styles.formf}>
                        <label className={styles.labelf}>id</label>
                        <input
                            type="text"
                            value={userId}
                            onChange={(e) => setUserId(e.target.value)}
                            className={styles.text_boxf}
                        />

                        <label className={styles.labelf}>email</label>
                        <input
                            type="text"
                            value={userEmail}
                            onChange={(e) => setUserEmail(e.target.value)}
                            className={styles.text_boxf}
                        />
                        <div className={styles.err}>
                                      {errorMessage}
                        </div>

                        {!isCertifiedSent ? (
                            <button
                                className={`${styles.submit_btnf} ${isFormValidToSend ? styles.active : styles.disabled}`}
                                onClick={handleSendCode}
                                disabled={!isFormValidToSend}
                                >
                                인증번호 발송
                            </button>

                        ) : (
                            <>
                                <label className={styles.labelf}>인증번호</label>
                                <input
                                    type="text"
                                    value={certificationNumber}
                                    onChange={(e) => setCertificationNumber(e.target.value)}
                                    className={styles.text_boxf}
                                />
                                <button
                                    type="submit"
                                    onClick={handleVerifyCode}
                                    className={`${styles.submit_btnf} ${isFormValid ? styles.active : styles.disabled}`}
                                    disabled={!isFormValid}
                                >
                                    Next
                                </button>
                            </>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
}

export default FindPwd;
