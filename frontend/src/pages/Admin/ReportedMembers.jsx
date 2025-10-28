import axios from 'axios';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import searchButtonIcon from '../../assets/images/search_icon.png';
import styles from "../../assets/styles/ReportedMembers.module.css";
import Pagination from '../../components/Pagination/Pagination';

const ReportedMembers = () => {
  const navigate = useNavigate();
  const [allReportedMembers, setAllReportedMembers] = useState([]);
  const [membersToDisplay, setMembersToDisplay] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // 실제 API로부터 유저 목록 불러오기
  useEffect(() => {
    axios.get("http://localhost:8080/api/v1/user/all")
      .then(res => {
        // 신고 누적 1 이상인 회원만 필터링
        const filteredUsers = res.data.body.userList.filter(user => (user.userReport || 0) >= 1);

        const users = filteredUsers.map(user => ({
          reportEntryId: user.userId,
          NO: user.userNo,
          ID: user.userId,
          닉네임: user.userNickName,
          'E-mail': user.userEmail,
          성별: user.userGender === 'MALE' ? '남성' : '여성',
          누적횟수: user.userReport || 0,
          회원상태: user.userStatus === 'Y' ? '정지' : '정상',
        }));

        setAllReportedMembers(users);

      })
      .catch(err => {
        console.error('신고 회원 목록 조회 실패:', err);
      });
  }, []);

  // 필터링 & 검색
  useEffect(() => {
    let filteredMembers = [...allReportedMembers];
    if (statusFilter !== 'all') {
      filteredMembers = filteredMembers.filter(m => m.회원상태 === statusFilter);
    }
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      filteredMembers = filteredMembers.filter(m =>
        m.ID.toLowerCase().includes(lowerSearchTerm) ||
        m.닉네임.toLowerCase().includes(lowerSearchTerm) ||
        m['E-mail'].toLowerCase().includes(lowerSearchTerm)
      );
    }
    setMembersToDisplay(filteredMembers);
    setCurrentPage(1);
  }, [allReportedMembers, statusFilter, searchTerm]);

  const totalPages = Math.ceil(membersToDisplay.length / itemsPerPage);
  const indexOfLastMember = currentPage * itemsPerPage;
  const indexOfFirstMember = indexOfLastMember - itemsPerPage;
  const currentDisplayedMembers = membersToDisplay.slice(indexOfFirstMember, indexOfLastMember);

  const handlePageChange = (pageNumber) => setCurrentPage(pageNumber);

  const handleRowClick = (memberId) => {
    navigate(`/admin/reportedmember-detail/${memberId}`);
  };

  const handleStatusChange = (e, userId, reportCount) => {
  e.stopPropagation();

  if (reportCount < 3) {
    alert("신고 누적 3회 미만 회원은 정지할 수 없습니다.");
    return;
  }

  // 토큰은 보통 상위 컴포넌트에서 받아오거나, 로컬스토리지에서 꺼내옵니다.
  const token = localStorage.getItem('token'); // 예시

  if (!token) {
    alert("로그인이 필요합니다.");
    return;
  }

  // 상태 변경 API 호출 - userId를 URL에 넣고, 데이터는 필요 없으면 빈 객체 {}
  axios.patch(`http://localhost:8080/api/v1/admin/status/${userId}`, {}, {
    headers: {
        Authorization: `Bearer ${token}`, 
      },withCredentials: true
  })
  .then(() => {
    alert("회원 상태 변경 완료.");
    // 변경 후 목록 다시 갱신
    return axios.get("http://localhost:8080/api/v1/user/all");
  })
  .then(res => {
    const filteredUsers = res.data.body.userList.filter(user => (user.userReport || 0) >= 1);

    const users = filteredUsers.map(user => ({
          reportEntryId: user.userId,
          NO: user.userNo,
          ID: user.userId,
          닉네임: user.userNickName,
          'E-mail': user.userEmail,
          성별: user.userGender === 'MALE' ? '남성' : '여성',
          누적횟수: user.userReport || 0,
          회원상태: user.userStatus === 'Y' ? '정지' : '정상',
        }));

        setAllReportedMembers(users);

  })
  .catch(err => {
    console.error('회원 상태 변경 실패:', err);
    alert("회원 상태 변경 중 오류가 발생했습니다.");
  });
};


  return (
    <div className={styles.container}>
      <main className={styles.reportedContent}>
        <h2 className={styles.title1}>신고 회원 관리</h2>
        <div className={styles.filterBar}>
          <input
            type="date"
            className={styles.filterElement}
            value={dateRange.start}
            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
          />
          <span className={styles.dateSeparator}>~</span>
          <input
            type="date"
            className={styles.filterElement}
            value={dateRange.end}
            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
          />
          <select
            className={`${styles.filterElement} ${styles.filterSelect}`}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">회원상태 (전체)</option>
            <option value="정상">정상</option>
            <option value="정지">정지</option>
          </select>
          <input
            type="text"
            placeholder="ID, 닉네임, E-mail 검색"
            className={`${styles.filterElement} ${styles.filterSearchInput}`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button type="button" className={styles.filterSearchButton}>
            <img src={searchButtonIcon} alt="검색" className={styles.searchIcon} />
          </button>
        </div>
        <table>
          <thead>
            <tr>
              <th>NO</th>
              <th>ID</th>
              <th>닉네임</th>
              <th>E-mail</th>
              <th>성별</th>
              <th>누적횟수</th>
              <th>회원상태</th>
            </tr>
          </thead>
          <tbody>
            {currentDisplayedMembers.length > 0 ? (
              currentDisplayedMembers.map((member) => (
                <tr
                  key={member.reportEntryId}
                  onClick={() => handleRowClick(member.ID)}
                  className={styles.clickableRow}
                >
                  <td>{member.NO}</td>
                  <td>{member.ID}</td>
                  <td>{member.닉네임}</td>
                  <td>{member['E-mail']}</td>
                  <td>{member.성별}</td>
                  <td>{member.누적횟수}</td>
                  <td>
                    <button
                      className={`${styles.status} ${member.회원상태 === "정지" ? styles.stop : styles.active}`}
                      onClick={(e) => handleStatusChange(e, member.ID, member.누적횟수)}
                      title={member.누적횟수 < 3 ? "신고 누적 3회 미만 회원은 정지 불가" : `클릭하여 상태 변경: ${member.회원상태}`}
                    >
                      {member.회원상태}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7">표시할 신고 회원이 없습니다.</td>
              </tr>
            )}
          </tbody>
        </table>
        <div className={styles.pagination}>
          {totalPages > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          )}
        </div>
      </main>
    </div>
  );
};

export default ReportedMembers;
