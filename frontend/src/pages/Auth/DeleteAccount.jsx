import axios from 'axios';
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import img from '../../assets/images/ex1.jpg';
import styles from '../../assets/styles/DeleteAccount.module.css';

function DeleteAccount() {

  const navigate = useNavigate();
  const [userGender] = useState('MALE');
  const [userInfo, setUserInfo] = useState(null);
  const userId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");

  //사용자 정보 조회
  useEffect(() => {
    axios.get(`http://localhost:8080/api/v1/user/${userId}`, {
      headers: {
        Authorization: `Bearer ${token}`, 
      },withCredentials: true
    })
    .then(res => {
      const data = res.data;
      if (data.code === "SU") { 
        setUserInfo({
          userName: data.userName,
          userId: data.userId,
          userGender: data.userGender || 'MALE',
          userPhone: data.userPhone,
          userEmail: data.userEmail,
          userNickName: data.userNickName,
          createdAt: data.createdAt,
          profileImage: data.profileImage,
        });

      } else {
        alert("사용자 정보를 불러오는데 실패했습니다.");
      }
    })
    .catch(() => alert("서버와 연결 실패"));
  }, [userId, token]);

  if (!userInfo) {
    return <div>로딩중...</div>;
  }


    return(
    <div className={styles.container}>
      <div className={styles.header}>

      </div>
      <div className={styles.wrapperD}>
        <h1 className={styles.titleD}>회원 탈퇴</h1>

        <div className={styles.wrapper2}>
            <div className={styles.wrapper3}>
                <div className={styles.img}><img className={styles.img2} src={img}/></div>
                <h1 className={styles.idtext} >{userInfo.userId} 님</h1>
            </div>  

            <h1 className={styles.content}>
                {userInfo.userName}<br/>
                {userInfo.userPhone}<br/>
                {userInfo.userEmail}
            </h1>
        </div>
        
        
        <button className={styles.submitBtnD} onClick={() => navigate("/checkdelete")}>회원 탈퇴</button>
        
      </div>
    </div>
    );
} 

export default DeleteAccount;