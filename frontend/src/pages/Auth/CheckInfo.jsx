import axios from 'axios';
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import img2 from '../../assets/images/edit_pencil.png';
import styles from '../../assets/styles/CheckInfo.module.css';

function CheckInfo() {
  const userId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");

  // 사용자 정보 상태
  const [userInfo, setUserInfo] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [imgError, setImgError] = useState(false);

  // 입력 필드 상태 (id, phone, email, nickname)
  const [id, setId] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [nickname, setNickname] = useState('');

  // 변경 여부 상태
  const [isIdChanged, setIsIdChanged] = useState(false);
  const [isPhoneChanged, setIsPhoneChanged] = useState(false);
  const [isEmailChanged, setIsEmailChanged] = useState(false);
  const [isNicknameChanged, setIsNicknameChanged] = useState(false);

  // 성별 선택 상태 (기본은 userInfo.userGender 기반)
  const [userGender, setUserGender] = useState(null);

  // 프로필 이미지 업로드 버튼 클릭 시 파일 선택 창 열기
  const handleEditProfileClick = () => {
    document.getElementById('profile-upload').click();
  };

  // 프로필 이미지 변경 핸들러
  const handleProfileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);
    formData.append("userId", userId);

    try {
      const response = await axios.post("http://localhost:8080/api/v1/user/profile", formData, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true
      });

      if (response.data.code === "SU") {
        // const fileName = response.data.fileName;
        const fileName = response.data.data;
        const imageUrl = `http://localhost:8080/upload/${fileName}?t=${Date.now()}`;
        setProfileImage(imageUrl);
        // setUserInfo(prev => ({ ...prev, profileImage: `/upload/${fileName}` }));
         // ✅ userInfo 갱신
          setUserInfo((prev) => ({
            ...prev,
            profileImage: `/upload/${fileName}`, // DB에 저장된 경로 (t=... 은 붙이지 않음)
          }));
          setImgError(false);
        alert("프로필 이미지가 업데이트되었습니다!");
      } else {
        alert("업로드 실패");
      }
    } catch (err) {
      alert("서버 오류");
    }
  };

  // 사용자 정보 조회 (컴포넌트 마운트 시 한 번만)
  useEffect(() => {
    if (!userId || !token) return;

    axios.get(`http://localhost:8080/api/v1/user/${userId}`, {
      headers: { Authorization: `Bearer ${token}` },
      withCredentials: true
    })
      .then(res => {
        const data = res.data;
        if (data.code === "SU") {
          setUserInfo({
            userName: data.userName,
            userGender: data.userGender || 'MALE',
            userPhone: data.userPhone,
            userNickName: data.userNickName,
            userEmail: data.userEmail,
            userId: data.userId,
            createdAt: data.createdAt,
            profileImage: data.profileImage,
          });

          setId(data.userId);
          setPhone(data.userPhone);
          setNickname(data.userNickName);
          setEmail(data.userEmail);
          setUserGender(data.userGender || 'MALE');
        } else {
          alert("사용자 정보를 불러오는데 실패했습니다.");
        }
      })
      .catch(() => alert("서버와 연결 실패"));
  }, [userId, token]);

  // 정보 수정 함수
  const handleUpdate = async (field, value) => {
    try {
      const response = await axios.patch('http://localhost:8080/api/v1/user/modify', {
        userId,
        [field]: value
      }, {
        headers: { Authorization: `Bearer ${token}` },
        withCredentials: true
      });

      if (response.data.code === "SU") {
        alert("정보 수정 완료!");
        setUserInfo(prev => ({
          ...prev,
          [field === "userPhone" ? "userPhone" : field === "userNickName" ? "userNickName" :
            field === "userEmail" ? "userEmail" : "userId"]: value
        }));
        if (field === "userPhone") setIsPhoneChanged(false);
        if (field === "userNickName") setIsNicknameChanged(false);
        if (field === "userEmail") setIsEmailChanged(false);
        if (field === "userId") setIsIdChanged(false);
      } else {
        alert("수정 실패");
      }
    } catch {
      alert("서버 오류");
    }
  };

  // 이미지 유효성 검사 함수
  const hasValidImage = (img) => {
    return img && typeof img === "string" && img.trim() !== "" && img.trim() !== "null" && img.trim() !== "undefined";
  };

  if (!userInfo) {
    return <div>로딩중...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.formWrapper}>
        <h1 className={styles.title}>정보 조회</h1>

        {/* 프로필 이미지 */}
        <div className={styles.form}>
          <label className={styles.label}>my photo</label>
          <div className={styles.imgWrapper}>
            <div className={styles.img}>
              {(!imgError && (hasValidImage(profileImage) || hasValidImage(userInfo.profileImage))) ? (
                <img
                  key={profileImage || `http://localhost:8080${userInfo.profileImage}?t=${Date.now()}`}
                  className={styles.img2}
                  src={hasValidImage(profileImage) ? profileImage : `http://localhost:8080${userInfo.profileImage}?t=${Date.now()}`}
                  alt="프로필"
                  onError={() => setImgError(true)}
                />
              ) : (
                <div className={styles.defaultProfile}>
                  프로필 사진<br />업로드 하기
                </div>
              )}
            </div>
            <div className={styles.profileEdit} onClick={handleEditProfileClick}>
              <img src={img2} alt="프로필 편집 아이콘" />
            </div>
            <input
              type="file"
              id="profile-upload"
              accept="image/*"
              onChange={handleProfileChange}
              style={{ display: "none" }}
            />
          </div>
        </div>

        {/* 이름 (읽기 전용) */}
        <div className={styles.form}>
          <label className={styles.label}>name</label>
          <input
            type="text"
            className={styles.textBox}
            defaultValue={userInfo.userName}
            disabled
          />
        </div>

        {/* id */}
        <div className={styles.form}>
          <label className={styles.label}>id</label>
          <div className={styles.form2}>
            <input
              type="text"
              className={styles.textBox}
              value={id}
              onChange={(e) => {
                setId(e.target.value);
                setIsIdChanged(e.target.value !== userInfo.userId);
              }}
            />
            <button
              className={`${styles.modibtn} ${isIdChanged ? styles.active : ''}`}
              disabled={!isIdChanged}
              onClick={() => handleUpdate("userId", id)}
            >
              수정
            </button>
          </div>
        </div>

        {/* 성별 라디오 */}
        <div className={styles.form}>
          <label className={styles.label}>gender</label>
          <div className={styles.genderGroup}>
            <label className={styles.genderOption}>
              <input
                type="radio"
                name="gender"
                value="MALE"
                checked={userGender === "MALE"}
                onChange={() => setUserGender("MALE")}
                className={styles.hiddenRadio}
              />
              <span
                className={`${styles.genderIndicator} ${userGender === "MALE" ? styles.selected : ""}`}
              />
              Male
            </label>

            <label className={styles.genderOption}>
              <input
                type="radio"
                name="gender"
                value="FEMALE"
                checked={userGender === "FEMALE"}
                onChange={() => setUserGender("FEMALE")}
                className={styles.hiddenRadio}
              />
              <span
                className={`${styles.genderIndicator} ${userGender === "FEMALE" ? styles.selected : ""}`}
              />
              Female
            </label>
          </div>
        </div>

        {/* 전화번호 */}
        <div className={styles.form}>
          <label className={styles.label}>phone</label>
          <div className={styles.form2}>
            <input
              type="text"
              className={styles.textBox}
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                setIsPhoneChanged(e.target.value !== userInfo.userPhone);
              }}
            />
            <button
              className={`${styles.modibtn} ${isPhoneChanged ? styles.active : ''}`}
              disabled={!isPhoneChanged}
              onClick={() => handleUpdate("userPhone", phone)}
            >
              수정
            </button>
          </div>
        </div>

        {/* 이메일 */}
        <div className={styles.form}>
          <label className={styles.label}>email</label>
          <div className={styles.form2}>
            <input
              type="text"
              className={styles.textBox}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setIsEmailChanged(e.target.value !== userInfo.userEmail);
              }}
            />
            <button
              className={`${styles.modibtn} ${isEmailChanged ? styles.active : ''}`}
              disabled={!isEmailChanged}
              onClick={() => handleUpdate("userEmail", email)}
            >
              수정
            </button>
          </div>
        </div>

        {/* 닉네임 */}
        <div className={styles.form}>
          <label className={styles.label}>nickname</label>
          <div className={styles.form2}>
            <input
              type="text"
              className={styles.textBox}
              value={nickname}
              onChange={(e) => {
                setNickname(e.target.value);
                setIsNicknameChanged(e.target.value !== userInfo.userNickName);
              }}
            />
            <button
              className={`${styles.modibtn} ${isNicknameChanged ? styles.active : ''}`}
              disabled={!isNicknameChanged}
              onClick={() => handleUpdate("userNickName", nickname)}
            >
              수정
            </button>
          </div>
        </div>

        {/* 가입일 (읽기 전용) */}
        <div className={styles.form}>
          <label className={styles.label}>sign-up date</label>
          <input
            type="text"
            className={styles.textBox}
            defaultValue={new Date(userInfo.createdAt).toLocaleDateString('ko-KR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
            disabled
          />
        </div>

        <Link to="/deleteaccount">
          <h1 className={styles.foottext}>회원탈퇴</h1>
        </Link>
        <div className={styles.footer}></div>
      </div>
    </div>
  );
}

export default CheckInfo;
