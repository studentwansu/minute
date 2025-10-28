import styles from '../../assets/styles/FailFindID.module.css';

function FailFindID() {
  return (
 
    <div className={styles.container}>
      <div className={styles.wrapper}>
        <h1 className={styles.title}>아이디 찾기</h1>

        <h1 className={styles.content}>아이디를 찾을 수 없습니다</h1>
          
        <h4 className={styles.forgetmsg}>아이디가 없으신가요? <span className='highlight'>회원가입</span></h4>

        <button className={styles.submitBtn}>아이디 찾기</button>
      </div>
    </div>
  );
}

export default FailFindID;
