import axios from "axios";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from '../../assets/styles/FindID.module.css';

function FindID() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [foundId, setFoundId] = useState('');
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const isFormValid =
    email &&
    name &&
    phone;

  const handleFindId = async (e) => {
    e.preventDefault();
    setError('');

    if (!isFormValid) {
      setErrorMessage('정보를 모두 입력해주세요.');
      return;
    }

    try {
      const response = await axios.post('http://localhost:8080/api/v1/auth/find-id', {
        name,
        email,
        phone,
      });

      const userId = response.data.userId;
      if (userId) {
        //userId를 전달
        navigate("/successid", { state: { userId: response.data.userId } });
      } else {
        setError('일치하는 정보가 없습니다.');
      }
    } catch (err) {
      setError('일치하는 정보가 없습니다.');
    }
  };

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.container}>
        <div className={styles.wrapper}>
          <h1 className={styles.title}>아이디 찾기</h1>

          <form className={styles.form} onSubmit={handleFindId}>
            <label className={styles.label}>이름</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={styles.textBox} />

            <label className={styles.label}>이메일</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={styles.textBox} />

            <label className={styles.label}>전화번호</label>
            <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className={styles.textBox2} />

            {error && <p className={styles.err}>{error}</p>}
            <button
              type="submit"
              className={`${styles.submitBtn} ${isFormValid ? styles.active : styles.disabled}`}
              disabled={!isFormValid}
            >아이디 찾기</button>

            {foundId && <p className={styles.resultMsg}>찾은 아이디: <strong>{foundId}</strong></p>}
            

            <h4 className={styles.forgetmsg}>
              아이디가 없으신가요? <Link to="/signupform">
                <span className={styles.highlight}>회원가입</span>
              </Link>
            </h4>
          </form>
        </div>
      </div>
    </div>
  );
}

export default FindID;
