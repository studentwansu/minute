import axios from 'axios';
import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import img from '../../assets/images/key.png';
import styles from '../../assets/styles/FindPwd.module.css';

function FindPwd2() {
  const [password, setPassword] = useState('');
  const [passwordCheck, setPasswordCheck] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const navigate = useNavigate();
  const location = useLocation();
  const userEmail = location.state?.userEmail;

  // 이메일이 없으면 비정상 접근
  useEffect(() => {
    if (!userEmail) {
      alert('잘못된 접근입니다. 이메일 인증을 먼저 완료해주세요.');
      navigate('/find-password');
    }
  }, [userEmail, navigate]);

  const passwordRegex = /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]).{8,20}$/;
  const isPasswordValid = passwordRegex.test(password);

  const isFormValid =
    password &&
    passwordCheck &&
    password === passwordCheck &&
    isPasswordValid;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!isFormValid) {
      setErrorMessage('비밀번호를 다시 확인해주세요.');
      return;
    }

    try {
      const response = await axios.patch('http://localhost:8080/api/v1/auth/reset-password', {
        userEmail,
        newPassword: password,
      });

      alert('비밀번호가 성공적으로 변경되었습니다.');
      navigate('/successpwd');
    } catch (err) {
      console.error(err);
      setErrorMessage('비밀번호 변경에 실패했습니다.');
    }
  };

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.container}>
        <div className={styles.boxf}>
          <div className={styles.keyimgf}>
            <img className={styles.keyimg1f} src={img} alt="key" />
          </div>

          <h1 className={styles.titlef}>New Password</h1>

          <form className={styles.formf} onSubmit={handleSubmit}>
            <label className={styles.labelf}>비밀번호</label>
            <input
              type="password"
              className={styles.text_boxf}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {password && !isPasswordValid && (
              <p className={styles.err}>영문, 숫자, 특수문자 포함 8~20자 입력해주세요.</p>
            )}

            <label className={styles.labelf}>비밀번호 확인</label>
            <input
              type="password"
              className={styles.text_boxf}
              value={passwordCheck}
              onChange={(e) => setPasswordCheck(e.target.value)}
            />
            {passwordCheck && password !== passwordCheck && (
              <p className={styles.err}>비밀번호가 일치하지 않습니다.</p>
            )}

            {errorMessage && <p className={styles.err}>{errorMessage}</p>}

            
            <button
              type="submit"
              className={`${styles.submit_btnf} ${isFormValid ? styles.active : styles.disabled}`}
              disabled={!isFormValid}
            >
              Reset Password
            </button>
           
          </form>
        </div>
      </div>
    </div>
  );
}

export default FindPwd2;
