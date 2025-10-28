package com.minute.video.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Getter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Schema(name = "SearchHistoryRequestDTO", description = " 검색 기록 저장 요청 DTO")
public class SearchHistoryRequestDTO {
    @Schema(description = "사용자 고유 ID", example = "user123")
    private String userId;
    @Schema(description = "검색 키워드", example = "여행")
    private String keyword;
    @Schema(description = "검색한 날짜 및 시간", example = "2025-05-21T14:30:00")
    private LocalDateTime searchedAt;
}
