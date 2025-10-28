import axios from "axios";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import styles from "../../assets/styles/SignUpForm2.module.css";

function SignUpForm2() {
  const navigate = useNavigate();
  const location = useLocation();
  const { userId, userPw } = location.state || {};

  const [errors, setErrors] = useState({
  email: '',
  nickname: '',
  phone: '',
  general: ''
});

  const [agreeAll, setAgreeAll] = useState(false);
  const [agree1, setAgree1] = useState(false); // 필수 1
  const [agree2, setAgree2] = useState(false); // 필수 2
  const [agree3, setAgree3] = useState(false); // 선택


  const [userName, setUserName] = useState('');
  const [userNickName, setUserNickName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [userGender, setUserGender] = useState('MALE');

  const [isCertifiedSent, setIsCertifiedSent] = useState(false);
  const [certificationNumber, setCertificationNumber] = useState('');
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailSendMessage, setEmailSendMessage] = useState('');
  const [emailVerifyMessage, setEmailVerifyMessage] = useState('');


  const isFormValid =
    userGender &&
    userEmail &&
    userName &&
    userNickName &&
    userPhone &&
    agree1 &&
    agree2 &&
    emailVerified;

  const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
  };

  // 이메일 중복 검사 및 인증번호 전송
  const handleSendCode = async (e) => {
    e.preventDefault();
    setEmailSendMessage('');
    if (!isValidEmail(userEmail)) {
      setEmailSendMessage('유효한 이메일 형식을 입력하세요.');
      return;
    }

    try {
      // 1. 이메일 중복 검사
      const checkResponse = await axios.post('http://localhost:8080/api/v1/auth/check-email', {
        email: userEmail,
      });

      if (checkResponse.data.exists) {
        setEmailSendMessage('이미 사용 중인 이메일입니다.');
        return;
      }
  
      await axios.post('http://localhost:8080/api/v1/auth/find-pw', {
        userId: userId || 'temp',
        userEmail,
      });
      setIsCertifiedSent(true);
      setEmailSendMessage('인증번호가 이메일로 전송되었습니다.');
    } catch (error) {
      if (error.response?.status === 409) { 
        setEmailSendMessage('이미 사용 중인 이메일입니다.');
      } else {


        setEmailSendMessage('이메일 전송에 실패했습니다.');
      }
    }
  };


  //인증번호 확인
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    setEmailVerifyMessage('');
    try {
      const response = await axios.post('http://localhost:8080/api/v1/auth/verify-code-signup', {
        userEmail,
        certificationNumber
      });

      if (response.status === 200) {
        setEmailVerified(true);
        setEmailVerifyMessage('이메일 인증 완료!');
      }
    } catch (error) {
      setEmailVerifyMessage('인증번호가 일치하지 않습니다.');
    }
  };



  //약관동의 핸들러
  const handleAgreeAllChange = (e) => {
  const checked = e.target.checked;
  setAgreeAll(checked);
  setAgree1(checked);
  setAgree2(checked);
  setAgree3(checked);
  };

  useEffect(() => {
    setAgreeAll(agree1 && agree2 && agree3);
    }, [agree1, agree2, agree3]);


  //성별 선택
  const handleChange=(e)=>{
    setUserGender(e.target.value)
  }

  //로그인2
  const handleFinalSignUp = async (e) => {
    e.preventDefault();
    setErrors('');

    if (!isFormValid) {
      setErrors.all = '정보를 모두 입력해주세요.';
      return;
    }
    
  try {
      const requestBody = {
        userId,
        userPw,
        userName,
        userNickName,
        userEmail,
        userPhone,
        userGender
      };

      await axios.post('http://localhost:8080/api/v1/auth/sign-up', requestBody,  {withCredentials: true
});
      alert("회원가입 성공");
      navigate("/signupcomplete"); // 회원가입 후 이동할 경로
    } catch (error) {
      const code = error.response?.data?.code;
      const newErrors = { email: '', nickname: '', phone: '', general: '',validate:'' };

      if (code === 'DE') {
        newErrors.email = '이미 사용 중인 이메일입니다.';
      } else if (code === 'DN') {
        newErrors.nickname = '이미 사용 중인 닉네임입니다.';
      } else if (code === "VF") {
        newErrors.validate("입력값이 올바르지 않습니다.");
      } else if (code === 'DP') {
        newErrors.phone = '이미 사용 중인 전화번호입니다.';
      } else {
        newErrors.general = '오류가 발생했습니다. 다시 시도해주세요.';
      }

      setErrors(newErrors);
    }
  };
  
  return (
    <div className={styles.container}>
      <div className={styles.header}></div>
      <div className={styles.formWrapper}>
        <h1 className={styles.title}>Sign Up</h1>

        <div className={styles.progressBar}>
                  <div className={styles.circle}></div>
                  <div className={styles.line}></div>
                  <div className={styles.circleActive}></div>
                  <div className={styles.line}></div>
                  <div className={styles.circle}></div>
                </div>

<form className={styles.form} onSubmit={handleFinalSignUp}>
        <div className={styles.form}>
          <label className={styles.label}>name</label>
           <input type="text" value={userName} 
           onChange={(e) => 
            setUserName(e.target.value)} 
            className={styles.textBox} required />
        </div>
        
        <div className={styles.form}>
          <label className={styles.label}>gender</label>
          <div className={styles.genderGroup}>
            <label className={styles.genderOption}>
              <input
                type="radio"
                name="gender"
                value="MALE"
                checked={userGender === "MALE"}
                onChange={handleChange}
                // onChange={() => setUserGender("male")}
                className={styles.hiddenRadio}
              />
              <span
                className={`${styles.genderIndicator} ${
                  userGender === "MALE" ? styles.selected : ""
                }`}
              />
              Male
            </label>

            <label className={styles.genderOption}>
              <input
                type="radio"
                name="gender"
                value="FEMALE"
                checked={userGender === "FEMALE"}
                // onChange={() => setUserGender("female")}
                onChange={handleChange}
                className={styles.hiddenRadio}
              />
              <span
                className={`${styles.genderIndicator} ${
                  userGender === "FEMALE" ? styles.selected : ""
                }`}
              />
              Female
            </label>
          </div>
        </div>

        <div className={styles.form}>
          <label className={styles.label}>phone</label>
          <input type="text" value={userPhone} onChange={(e) => 
            setUserPhone(e.target.value)} className={styles.textBox} required />
            {errors.phone && <p className={styles.err}>{errors.phone}</p>}
        </div>

        <div className={styles.form}>
          <label className={styles.label}>email</label>
          <div className={styles.emailbox}>
          <input
            type="text"
            value={userEmail}
            onChange={(e) => {
              setUserEmail(e.target.value);
              setEmailVerified(false); // 이메일 수정 시 인증 취소
            }}
            className={styles.textBox}
            required
          />
          <button
            onClick={handleSendCode}
            type="button"
            className={styles.authBtn}
            disabled={!userEmail}
          >
            인증번호 <br/>전송
          </button>
          </div>
          {emailSendMessage && <p className={styles.err}>{emailSendMessage}</p>}
        </div>

        {isCertifiedSent && (
          <div className={styles.form}>
            <label className={styles.label}>인증번호</label>
            <div className={styles.emailbox}>
            <input
              type="text"
              value={certificationNumber}
              onChange={(e) => setCertificationNumber(e.target.value)}
              className={styles.textBox}
            />
            <button
              onClick={handleVerifyCode}
              type="button"
              className={styles.authBtn}
            >
              인증 확인
            </button>
            </div>
            {emailVerifyMessage && (
              <p className={styles.err}>
                {emailVerifyMessage}
              </p>
            )}
          </div>
        )}


        <div className={styles.form}>
          <label className={styles.label}>nickname</label>
          <input type="text" value={userNickName} onChange={(e) => 
            setUserNickName(e.target.value)} className={styles.textBox} required />
            {errors.nickname && <p className={styles.err}>{errors.nickname}</p>}
        </div>

        <div className={styles.form}>
          <div className={styles.checkboxGroup}>
            <label>
              <input type="checkbox" checked={agreeAll} onChange={handleAgreeAllChange} />
              약관전체동의
            </label>
          </div>

          <div className={styles.agreebox}>
            <input type="checkbox" checked={agree1} onChange={(e) => setAgree1(e.target.checked)} />
            &nbsp;&nbsp;(필수) <span className={styles.arrow}>▼</span>
          </div>
          <div className={styles.agreebox}>
            <input type="checkbox" checked={agree2} onChange={(e) => setAgree2(e.target.checked)} />
            &nbsp;&nbsp;(필수) <span className={styles.arrow}>▼</span>
          </div>
          <div className={styles.agreebox}>
            <input type="checkbox" checked={agree3} onChange={(e) => setAgree3(e.target.checked)} />
            &nbsp;&nbsp;(선택) 마케팅 수신 동의 <span className={styles.arrow}>▼</span>
          </div>
        </div>

        <div className={styles.err}>
                          {errors.all},{errors.validate}
                        </div>
        <div className={styles.form}>
          <button
            type="submit"
            className={`${styles.submitBtn} ${isFormValid ? styles.active : styles.disabled}`}
            disabled={!isFormValid}>다음
            </button>
        </div>
      </form>
        
      </div>
    </div>
  );
}

export default SignUpForm2;
