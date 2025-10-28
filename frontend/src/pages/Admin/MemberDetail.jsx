import axios from "axios";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import styles from "../../assets/styles/MemberDetail.module.css";

const MemberDetail = () => {
  const { userId } = useParams();
  const [member, setMember] = useState(null);
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const token = localStorage.getItem("token");

  const [isNicknameChanged, setIsNicknameChanged] = useState(false);
  const [isEmailChanged, setIsEmailChanged] = useState(false);
  const [isPhoneChanged, setIsPhoneChanged] = useState(false);

  // 유저 정보 조회
useEffect(() => {
  axios.get(`http://localhost:8080/api/v1/user/${userId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    withCredentials: true
  })
  .then((res) => {
    console.log("회원 응답 데이터:", res.data); // 응답 구조 확인용 로그

    const data = res.data;

    if (!data) {
      console.error("회원 정보가 없습니다.");
      return;
    }

    setMember(data);
    setNickname(data.userNickName);
    setEmail(data.userEmail);
    setPhone(data.userPhone);
  })
  .catch((err) => {
    console.error("회원 정보 조회 실패:", err);
    setMember(null);
  });
}, [userId]);


  // 정보 수정 핸들러
  const handleUpdate = async (field, value) => {
    try {
      const response = await axios.patch('http://localhost:8080/api/v1/user/modify', {
        userId,
        [field]: value,
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        withCredentials: true,
      });

      if (response.data.code === "SU") {
        alert("정보 수정 완료!");
        setMember(prev => ({ ...prev, [field]: value }));

        if (field === "userNickName") setIsNicknameChanged(false);
        if (field === "userEmail") setIsEmailChanged(false);
        if (field === "userPhone") setIsPhoneChanged(false);
      } else {
        alert("수정 실패");
      }
    } catch (err) {
      alert("서버 오류");
    }
  };

  if (!member) {
    return <div className={styles.container}>존재하지 않는 회원입니다.</div>;
  }

  return (
   <div className={styles.container}>
  <main className={styles.memberDetail}>
    <h2>회원 관리 상세 - {member.userId}</h2>

    <div className={styles.formRow}>
      <label>이름</label>
      <input type="text" value={member.userName} disabled />
    </div>

    <div className={styles.formRow}>
      <label>아이디</label>
      <input type="text" value={member.userId} disabled />
    </div>

    
    <div className={styles.formRow}>
      <label>권한</label>
      <input type="text" value={member.role} disabled />
    </div>

    <div className={styles.formRow}>
      <label>닉네임</label>
      <input
        type="text"
        value={nickname}
        onChange={(e) => {
          setNickname(e.target.value);
          setIsNicknameChanged(e.target.value !== member.userNickName);
        }}
      />
      <button
        className={isNicknameChanged ? styles.active : ''}
        disabled={!isNicknameChanged}
        onClick={() => handleUpdate("userNickName", nickname)}
      >
        수정
      </button>
    </div>

    <div className={styles.formRow}>
      <label>성별</label>
      <div className={styles['gender-options']}>
        <label>
          <input type="radio" checked={member.userGender === "MALE"} readOnly /> 남성
        </label>
        <label>
          <input type="radio" checked={member.userGender === "FEMALE"} readOnly /> 여성
        </label>
      </div>
    </div>

    <div className={styles.formRow}>
      <label>전화번호</label>
      <input
        type="text"
        value={phone}
        onChange={(e) => {
          setPhone(e.target.value);
          setIsPhoneChanged(e.target.value !== member.userPhone);
        }}
      />
      <button
        className={isPhoneChanged ? styles.active : ''}
        disabled={!isPhoneChanged}
        onClick={() => handleUpdate("userPhone", phone)}
      >
        수정
      </button>
    </div>

    <div className={styles.formRow}>
      <label>이메일</label>
      <input
        type="text"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          setIsEmailChanged(e.target.value !== member.userEmail);
        }}
      />
      <button
        className={isEmailChanged ? styles.active : ''}
        disabled={!isEmailChanged}
        onClick={() => handleUpdate("userEmail", email)}
      >
        수정
      </button>
    </div>

    <div className={styles.formRow}>
      <label>가입일</label>
      <input
        type="text"
        value={new Date(member.createdAt).toLocaleDateString('ko-KR', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}
        disabled
      />
    </div>

    
    <div className={styles.formRow}>
      <button
        className={styles.promoteButton}
        onClick={async () => {
          const confirmPromote = window.confirm("해당 회원을 관리자 권한으로 승격하시겠습니까?");
          if (!confirmPromote) return;

          try {
            const res = await axios.patch(`http://localhost:8080/api/v1/admin/promote/${member.userId}`, {}, {
              headers: {
                Authorization: `Bearer ${token}`,
              },withCredentials: true,
            });
            alert("관리자 승격 완료!");
          } catch (err) {
            console.error("관리자 승격 실패:", err);
            alert("관리자 승격에 실패했습니다.");
          }
        }}
      >
        관리자 승격
      </button>

      <button
    className={styles.deleteButton}
    onClick={async () => {
      const confirmDelete = window.confirm("정말로 이 회원을 삭제하시겠습니까?");
      if (!confirmDelete) return;

      try {
        const response = await axios.delete(`http://localhost:8080/api/v1/admin/delete/${member.userId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          withCredentials: true,
        });

        if (response.data.code === "SU") {
          alert("회원이 삭제되었습니다.");
          window.location.href = "/admin/users";
        } else {
          alert("삭제 실패: " + response.data.message);
        }
      } catch (err) {
        console.error("회원 삭제 실패:", err);
        alert("서버 오류");
      }
    }}
  >
    회원 삭제
  </button>
  </div>

  </main>
</div>

  );
};

export default MemberDetail;
