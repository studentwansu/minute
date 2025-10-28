
import axios from 'axios';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import searchButtonIcon from '../../assets/images/search_icon.png';
import styles from "../../assets/styles/ManagerUsers.module.css";
import Pagination from '../../components/Pagination/Pagination';

const ManagerUsers = () => {
  const navigate = useNavigate();
  const [allUsers, setAllUsers] = useState([]);
  const [usersToDisplay, setUsersToDisplay] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // 사용자 데이터 로드
  useEffect(() => {
    axios.get("http://localhost:8080/api/v1/user/all")
      .then(res => {
      console.log('유저 응답 확인:', res.data);
      setAllUsers(res.data.body.userList); 
    })
      .catch((err) => {
        console.error("유저 리스트 조회 실패:", err);
      });
  }, []);

  // 필터링 및 검색
  useEffect(() => {
    let filteredUsers = [...allUsers];

    if (statusFilter !== 'all') {
      filteredUsers = filteredUsers.filter(user => 
  (user.userStatus === "Y" && statusFilter === "정지") ||
  (user.userStatus === "N" && statusFilter === "정상")
);

    }

    if (searchTerm) {
      filteredUsers = filteredUsers.filter(user =>
        user.userId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.userNickName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.userEmail?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setUsersToDisplay(filteredUsers);
    setCurrentPage(1);
  }, [allUsers, statusFilter, searchTerm]);

  // 페이지 관련 계산
  const totalPages = Math.ceil(usersToDisplay.length / itemsPerPage);
  const indexOfLastUser = currentPage * itemsPerPage;
  const indexOfFirstUser = indexOfLastUser - itemsPerPage;
  const currentDisplayedUsers = usersToDisplay.slice(indexOfFirstUser, indexOfLastUser);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleRowClick = (userId) => {
    navigate(`/admin/member-detail/${userId}`);
  };

  const handleStatusChange = (e, userId) => {
    e.stopPropagation();
    const updated = allUsers.map(user => {
      if (user.userId === userId) {
        return {
          ...user,
          userStatus: user.userStatus === "Y" ? "정상" : "정지"
        };
      }
      return user;
    });
    setAllUsers(updated);
  };

  return (
    <div className={styles.container}>
      <main className={styles.contentArea}>
        <h2 className={styles.title1}>전체 회원 관리</h2>

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
              <th>이름</th>
              <th>닉네임</th>
              <th>E-mail</th>
              <th>성별</th>
              <th>회원상태</th>
            </tr>
          </thead>
          <tbody>
            {currentDisplayedUsers.length > 0 ? (
              currentDisplayedUsers.map((user) => (
                <tr
                  key={user.userId}
                  onClick={() => handleRowClick(user.userId)}
                  className={styles.clickableRow}
                >
                  <td>{user.userNo}</td>
                  <td>{user.userId}</td>
                  <td>{user.userName}</td>
                  <td>{user.userNickName}</td>
                  <td>{user.userEmail}</td>
                  <td>{`${user.userGender == "MALE" ? "남성" : "여성"}`}</td>
                  <td>
                    <button
                      className={`${styles.status} ${user.userStatus === "Y" ? styles.stop : styles.active}`}
                      onClick={(e) => handleStatusChange(e, user.userId)}
                    >
                      {user.userStatus === "Y" ? "정지" : "정상"}
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6">회원 데이터가 없습니다.</td>
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

export default ManagerUsers;
