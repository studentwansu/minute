import styles from './pagination.module.css';

const Pagination = ({ currentPage, totalPages, onPageChange, pageNeighbours = 1 }) => {
  const LEFT_PAGE = 'LEFT';
  const RIGHT_PAGE = 'RIGHT';

  const range = (from, to, step = 1) => {
    let i = from;
    const rangeArr = [];
    while (i <= to) {
      rangeArr.push(i);
      i += step;
    }
    return rangeArr;
  };

  const fetchPageNumbers = () => {
    const totalNumbers = pageNeighbours * 2 + 3; 
    const totalBlocks = totalNumbers + 2; 

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

  if (!totalPages || totalPages === 1) {
    return null;
  }

  return (
    <nav aria-label="Page navigation">
      <ul className={styles.paginationContainer}> 
        <li
          className={`${styles.pageItem} ${currentPage === 1 ? styles.disabled : ''}`}
        >
          <a
            className={styles.pageLink}
            href="#!"
            aria-label="Previous"
            onClick={(e) => {
              e.preventDefault(); 
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