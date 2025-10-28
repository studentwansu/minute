import styles from './pagination.module.css'; // CSS Modules 임포트

const Pagination = ({ currentPage, totalPages, onPageChange, pageNeighbours = 1 }) => {
  const LEFT_PAGE = 'LEFT';
  const RIGHT_PAGE = 'RIGHT';

  // 주어진 범위 내의 숫자 배열을 생성하는 헬퍼 함수
  const range = (from, to, step = 1) => {
    let i = from;
    const rangeArr = [];
    while (i <= to) {
      rangeArr.push(i);
      i += step;
    }
    return rangeArr;
  };

  // 표시할 페이지 번호 목록을 계산하는 함수
  const fetchPageNumbers = () => {
    const totalNumbers = pageNeighbours * 2 + 3; // 양쪽 이웃 + 현재페이지 + 첫페이지 + 마지막페이지
    const totalBlocks = totalNumbers + 2; // 위 항목들 + 양쪽 '...'

    if (totalPages <= totalBlocks) {
      return range(1, totalPages);
    }

    const startPage = Math.max(2, currentPage - pageNeighbours);
    const endPage = Math.min(totalPages - 1, currentPage + pageNeighbours);
    let pages = range(startPage, endPage);

    const hasLeftSpill = startPage > 2;
    const hasRightSpill = totalPages - endPage > 1;
    const spillOffset = totalNumbers - (pages.length + 1);

    switch (true) {
      case hasLeftSpill && !hasRightSpill: {
        const extraPages = range(startPage - spillOffset, startPage - 1);
        pages = [LEFT_PAGE, ...extraPages, ...pages];
        break;
      }
      case !hasLeftSpill && hasRightSpill: {
        const extraPages = range(endPage + 1, endPage + spillOffset);
        pages = [...pages, ...extraPages, RIGHT_PAGE];
        break;
      }
      case hasLeftSpill && hasRightSpill:
      default: {
        pages = [LEFT_PAGE, ...pages, RIGHT_PAGE];
        break;
      }
    }
    return [1, ...pages, totalPages];
  };

  const pageNumbers = fetchPageNumbers();

  // 페이지가 없거나 1개면 페이지네이션을 표시하지 않음
  if (!totalPages || totalPages === 1) {
    return null;
  }

  return (
    // <nav> 태그로 감싸서 시맨틱한 의미 부여 (선택 사항)
    <nav aria-label="Page navigation">
      <ul className={styles.paginationContainer}> {/* CSS Module 클래스 적용 */}
        <li
          className={`${styles.pageItem} ${currentPage === 1 ? styles.disabled : ''}`}
        >
          <a
            className={styles.pageLink}
            href="#!" // 실제 라우팅을 사용한다면 해당 경로로 변경
            aria-label="Previous"
            onClick={(e) => {
              e.preventDefault(); // 기본 동작 방지
              onPageChange(Math.max(1, currentPage - 1));
            }}
          >
            <span aria-hidden="true">&laquo;</span>
            <span className={styles.srOnly}>Previous</span>
          </a>
        </li>

        {pageNumbers.map((page, index) => {
          if (page === LEFT_PAGE) {
            return (
              <li key={index} className={`${styles.pageItem} ${styles.disabled}`}>
                <span className={`${styles.pageLink} ${styles.dots}`}>...</span>
              </li>
            );
          }

          if (page === RIGHT_PAGE) {
            return (
              <li key={index} className={`${styles.pageItem} ${styles.disabled}`}>
                <span className={`${styles.pageLink} ${styles.dots}`}>...</span>
              </li>
            );
          }

          return (
            <li
              key={index}
              className={`${styles.pageItem} ${currentPage === page ? styles.active : ''}`}
            >
              <a
                className={styles.pageLink}
                href="#!"
                onClick={(e) => {
                  e.preventDefault();
                  onPageChange(page);
                }}
              >
                {page}
              </a>
            </li>
          );
        })}

        <li
          className={`${styles.pageItem} ${currentPage === totalPages ? styles.disabled : ''}`}
        >
          <a
            className={styles.pageLink}
            href="#!"
            aria-label="Next"
            onClick={(e) => {
              e.preventDefault();
              onPageChange(Math.min(totalPages, currentPage + 1));
            }}
          >
            <span aria-hidden="true">&raquo;</span>
            <span className={styles.srOnly}>Next</span>
          </a>
        </li>
      </ul>
    </nav>
  );
};

export default Pagination;