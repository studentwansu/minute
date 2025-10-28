package com.minute.checklist.service;

import com.minute.checklist.dto.request.ChecklistRequestDTO;
import com.minute.checklist.dto.response.ChecklistResponseDTO;
import com.minute.checklist.entity.Checklist;
import com.minute.plan.entity.Plan;
import com.minute.plan.repository.PlanRepository;
import com.minute.user.entity.User;
import com.minute.checklist.repository.ChecklistRepository;
import com.minute.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ChecklistService {
    private final ChecklistRepository checklistRepository;
    private final PlanRepository planRepository;
    private final UserRepository userRepository;

    // 한 달치 dot 데이터
    @Transactional(readOnly = true)
    public List<LocalDate> getChecklistDatesInMonth(String userId, YearMonth ym) {
        LocalDate start = ym.atDay(1);
        LocalDate end   = ym.atEndOfMonth();
        return checklistRepository.findTravelDatesInMonth(userId, start, end);
    }

    // 날짜별 DTO 매핑
    @Transactional(readOnly = true)
    public List<ChecklistResponseDTO> getChecklistsByUserAndDate(String userId, LocalDate date) {
        return checklistRepository.findAllByUser_UserIdAndTravelDate(userId, date)
                .stream()
                .map(ChecklistResponseDTO::fromEntity)
                .collect(Collectors.toList());
    }

    // 캘린더 용
    public List<ChecklistResponseDTO> getChecklistsForCalendar(String userId, LocalDate date) {
        return getChecklistsByUserAndDate(userId, date);
    }

    /** 체크리스트 항목 생성 */
    @Transactional
    public ChecklistResponseDTO create(String userId, ChecklistRequestDTO dto) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자: " + userId));

        // 빌더 준비
        Checklist.ChecklistBuilder builder = Checklist.builder()
                .user(user)
                .travelDate(dto.getTravelDate())
                .itemContent(dto.getItemContent())
                .isChecked(dto.getIsChecked());

        // planId가 있으면 연관관계 설정
        if (dto.getPlanId() != null) {
            Plan plan = planRepository.findById(dto.getPlanId())
                    .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 Plan: " + dto.getPlanId()));
            builder.plan(plan);
        }

        Checklist saved = checklistRepository.save(builder.build());
        return ChecklistResponseDTO.fromEntity(saved);
    }

    /** 체크리스트 수정 */
    @Transactional
    public ChecklistResponseDTO update(String userId, Integer checklistId, ChecklistRequestDTO dto) {
        Checklist checklist = checklistRepository.findById(checklistId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 Checklist: " + checklistId));
        // 소유자 확인
        if (!checklist.getUser().getUserId().equals(userId)) {
            throw new SecurityException("수정 권한이 없습니다.");
        }

        checklist.updateFrom(dto);

        return ChecklistResponseDTO.fromEntity(checklist);
    }

    /** 체크리스트 항목 삭제 */
    @Transactional
    public void delete(String userId, Integer checklistId) {
        Checklist entity = checklistRepository.findById(checklistId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 체크리스트: " + checklistId));

        if (!entity.getUser().getUserId().equals(userId)) {
            throw new SecurityException("삭제 권한이 없습니다.");
        }

        checklistRepository.delete(entity);
    }
}
