import axios from 'axios';
import { useState } from 'react';
import { useNavigate } from "react-router-dom";
import styles from "../../assets/styles/SignUpForm.module.css";


function SignUpForm() {
  const navigate = useNavigate();

  const [userId, setUserId] = useState('');
  const [userPw, setUserPw] = useState('');
  const [pwCheck, setPwCheck] = useState('');

  const [errorMessage, setErrorMessage] = useState('');

  const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]).{8,20}$/;
  const isPasswordValid = passwordRegex.test(userPw);
 
  const isFormValid =
    userId &&
    userPw &&
    pwCheck &&
    userPw === pwCheck &&
    isPasswordValid;

  const handleSignUp = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!isFormValid) {
      setErrorMessage('정보를 모두 입력해주세요.');
      return;
    }

    try {
      const response = await axios.post('http://localhost:8080/api/v1/auth/sign-up/validate', {
        userId,
        userPw
      },{withCredentials: true});
    //signupform2로 이동
    navigate('/signupform2', {
      state:{ userId, userPw }
    });
    } catch (error) {
        const code = error.response?.data?.code;

        if (code === 'DI') {
          setErrorMessage('이미 사용 중인 아이디입니다.');
        } else if (code === 'IP') {
          setErrorMessage('비밀번호는 8~20자여야 합니다.');
        } else if (code === "VF") {
        setErrorMessage("입력값이 올바르지 않습니다.");
        } else {
          setErrorMessage('오류가 발생했습니다. 다시 시도해주세요.');
        }
      }
    };

  return (
    <div className={styles.pageWrapper}>
    <div className={styles.container}>

      <div className={styles.formWrapper}>
        <h1 className={styles.title}>Sign Up</h1>

        <div className={styles.progressBar}>
          <div className={styles.circleActive}></div>
          <div className={styles.line}></div>
          <div className={styles.circle}></div>
          <div className={styles.line}></div>
          <div className={styles.circle}></div>
        </div>

        <form className={styles.form} onSubmit={handleSignUp}>
          <div>
            <label className={styles.label}>id</label>
            <input type="text" value={userId} onChange={(e) => setUserId(e.target.value)} className={styles.textBox} />
          
          </div>
          <div>
            <label className={styles.label}>pw</label>
            <input type="password" value={userPw} onChange={(e) => setUserPw(e.target.value)} className={styles.textBox} />
            {userPw && !isPasswordValid && (
            <p className={styles.err}>비밀번호는 영문, 숫자, 특수문자를 포함해 8~20자로 입력해주세요.</p>
          )}
          </div>
          <div>
            <label className={styles.label}>pw check</label>
              <input type="password" value={pwCheck} onChange={(e) => setPwCheck(e.target.value)} className={styles.textBox} />
              {pwCheck && userPw !== pwCheck && (
                <p className={styles.err}>비밀번호가 일치하지 않습니다.</p>
              )}
            </div>
            <div className={styles.err}>
              {errorMessage}
            </div>
          <button
              type="submit"
              className={`${styles.submitBtn} ${isFormValid ? styles.active : styles.disabled}`}
              disabled={!isFormValid}
            >
              다음
            </button>
        </form>
      </div>
    </div>
    </div>
  );
}
export default SignUpForm;