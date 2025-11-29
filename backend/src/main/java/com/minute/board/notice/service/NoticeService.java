package com.minute.board.notice.service;

import com.minute.board.common.dto.response.PageResponseDTO;
import com.minute.board.notice.dto.request.NoticeCreateRequestDTO;
import com.minute.board.notice.dto.request.NoticeImportanceUpdateRequestDTO;
import com.minute.board.notice.dto.request.NoticeUpdateRequestDTO;
import com.minute.board.notice.dto.response.NoticeDetailResponseDTO;
import com.minute.board.notice.dto.response.NoticeListResponseDTO;
import com.minute.board.notice.entity.Notice;
import com.minute.board.notice.repository.NoticeRepository;
import com.minute.user.entity.User;
import com.minute.user.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class NoticeService {

    private final NoticeRepository noticeRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public PageResponseDTO<NoticeListResponseDTO> getNoticeList(
            Pageable pageable,
            String searchKeyword,
            Boolean isImportant,
            LocalDateTime dateFrom,
            LocalDateTime dateTo
    ) {
        log.info("NoticeService.getNoticeList called with:");
        log.info("  searchKeyword: {}", searchKeyword);
        log.info("  isImportant: {}", isImportant);
        log.info("  dateFrom: {}", dateFrom);
        log.info("  dateTo: {}", dateTo);
        log.info("  pageable: {}", pageable);

        Specification<Notice> spec = Specification.where(null);

        if (StringUtils.hasText(searchKeyword)) {
            spec = spec.and(NoticeSpecification.searchByCombinedFields(searchKeyword));
        }

        if (isImportant != null) {
            spec = spec.and(NoticeSpecification.isImportant(isImportant));
        }

        if (dateFrom != null || dateTo != null) {
            spec = spec.and(NoticeSpecification.createdAtBetween(dateFrom, dateTo));
        }

        Page<Notice> noticePage = noticeRepository.findAll(spec, pageable);

        List<NoticeListResponseDTO> dtoList = noticePage.getContent().stream()
                .map(notice -> NoticeListResponseDTO.builder()
                        .noticeId(notice.getNoticeId())
                        .noticeTitle(notice.getNoticeTitle())
                        .authorId(notice.getUser().getUserId())
                        .authorNickname(notice.getUser().getUserNickName())
                        .noticeCreatedAt(notice.getNoticeCreatedAt())
                        .noticeViewCount(notice.getNoticeViewCount())
                        .noticeIsImportant(notice.isNoticeIsImportant())
                        .build())
                .collect(Collectors.toList());

        return PageResponseDTO.<NoticeListResponseDTO>builder()
                .content(dtoList)
                .currentPage(noticePage.getNumber() + 1)
                .totalPages(noticePage.getTotalPages())
                .totalElements(noticePage.getTotalElements())
                .size(noticePage.getSize())
                .first(noticePage.isFirst())
                .last(noticePage.isLast())
                .empty(noticePage.isEmpty())
                .build();
    }

    @Transactional
    public NoticeDetailResponseDTO getNoticeDetail(Integer noticeId) {
        Notice notice = noticeRepository.findById(noticeId)
                .orElseThrow(() -> new EntityNotFoundException("해당 ID의 공지사항을 찾을 수 없습니다: " + noticeId));

        notice.setNoticeViewCount(notice.getNoticeViewCount() + 1);

        return NoticeDetailResponseDTO.builder()
                .noticeId(notice.getNoticeId())
                .noticeTitle(notice.getNoticeTitle())
                .noticeContent(notice.getNoticeContent())
                .authorId(notice.getUser().getUserId())
                .authorNickname(notice.getUser().getUserNickName())
                .noticeCreatedAt(notice.getNoticeCreatedAt())
                .noticeViewCount(notice.getNoticeViewCount())
                .noticeIsImportant(notice.isNoticeIsImportant())
                .build();
    }

    @Transactional
    public NoticeDetailResponseDTO createNotice(NoticeCreateRequestDTO requestDto, String authenticatedUserId) {
        User author = userRepository.findUserByUserId(authenticatedUserId)
                .orElseThrow(() -> new EntityNotFoundException("작성자 정보를 찾을 수 없습니다: " + authenticatedUserId));

        Notice newNotice = Notice.builder()
                .noticeTitle(requestDto.getNoticeTitle())
                .noticeContent(requestDto.getNoticeContent())
                .noticeIsImportant(requestDto.isNoticeIsImportant())
                .user(author)
                .noticeViewCount(0)
                .build();

        Notice savedNotice = noticeRepository.save(newNotice);

        return NoticeDetailResponseDTO.builder()
                .noticeId(savedNotice.getNoticeId())
                .noticeTitle(savedNotice.getNoticeTitle())
                .noticeContent(savedNotice.getNoticeContent())
                .authorId(savedNotice.getUser().getUserId())
                .authorNickname(savedNotice.getUser().getUserNickName())
                .noticeCreatedAt(savedNotice.getNoticeCreatedAt())
                .noticeViewCount(savedNotice.getNoticeViewCount())
                .noticeIsImportant(savedNotice.isNoticeIsImportant())
                .build();
    }

    @Transactional
    public NoticeDetailResponseDTO updateNotice(Integer noticeId, NoticeUpdateRequestDTO requestDto, String authenticatedUserId) {
        Notice noticeToUpdate = noticeRepository.findById(noticeId)
                .orElseThrow(() -> new EntityNotFoundException("수정할 공지사항을 찾을 수 없습니다 (ID: " + noticeId + ")"));

        boolean updated = false;
        if (requestDto.getNoticeTitle() != null && !requestDto.getNoticeTitle().equals(noticeToUpdate.getNoticeTitle())) {
            noticeToUpdate.setNoticeTitle(requestDto.getNoticeTitle());
            updated = true;
        }
        if (requestDto.getNoticeContent() != null && !requestDto.getNoticeContent().equals(noticeToUpdate.getNoticeContent())) {
            noticeToUpdate.setNoticeContent(requestDto.getNoticeContent());
            updated = true;
        }
        if (requestDto.getNoticeIsImportant() != null && requestDto.getNoticeIsImportant() != noticeToUpdate.isNoticeIsImportant()) {
            noticeToUpdate.setNoticeIsImportant(requestDto.getNoticeIsImportant());
            updated = true;
        }

        return NoticeDetailResponseDTO.builder()
                .noticeId(noticeToUpdate.getNoticeId())
                .noticeTitle(noticeToUpdate.getNoticeTitle())
                .noticeContent(noticeToUpdate.getNoticeContent())
                .authorId(noticeToUpdate.getUser().getUserId())
                .authorNickname(noticeToUpdate.getUser().getUserNickName())
                .noticeCreatedAt(noticeToUpdate.getNoticeCreatedAt())
                .noticeViewCount(noticeToUpdate.getNoticeViewCount())
                .noticeIsImportant(noticeToUpdate.isNoticeIsImportant())
                .build();
    }

    @Transactional
    public void deleteNotice(Integer noticeId, String authenticatedUserId) {
        Notice noticeToDelete = noticeRepository.findById(noticeId)
                .orElseThrow(() -> new EntityNotFoundException("삭제할 공지사항을 찾을 수 없습니다 (ID: " + noticeId + ")"));

        noticeRepository.delete(noticeToDelete);
    }

    @Transactional
    public NoticeDetailResponseDTO updateNoticeImportance(Integer noticeId, NoticeImportanceUpdateRequestDTO requestDto, String authenticatedUserId) {
        Notice noticeToUpdate = noticeRepository.findById(noticeId)
                .orElseThrow(() -> new EntityNotFoundException("중요도를 변경할 공지사항을 찾을 수 없습니다 (ID: " + noticeId + ")"));

        noticeToUpdate.setNoticeIsImportant(requestDto.getNoticeIsImportant());

        return NoticeDetailResponseDTO.builder()
                .noticeId(noticeToUpdate.getNoticeId())
                .noticeTitle(noticeToUpdate.getNoticeTitle())
                .noticeContent(noticeToUpdate.getNoticeContent())
                .authorId(noticeToUpdate.getUser().getUserId())
                .authorNickname(noticeToUpdate.getUser().getUserNickName())
                .noticeCreatedAt(noticeToUpdate.getNoticeCreatedAt())
                .noticeViewCount(noticeToUpdate.getNoticeViewCount())
                .noticeIsImportant(noticeToUpdate.isNoticeIsImportant())
                .build();
    }
}