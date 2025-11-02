//package com.minute.security.handler;
//
//import com.minute.user.entity.User;
//import io.jsonwebtoken.*;
//import jakarta.annotation.PostConstruct;
//import jakarta.xml.bind.DatatypeConverter;
//import org.springframework.beans.factory.annotation.Value;
//import org.springframework.stereotype.Component;
//
//import javax.crypto.SecretKey;
//import javax.crypto.spec.SecretKeySpec;
//import java.nio.charset.StandardCharsets;
//import java.security.Key;
//import java.time.Instant;
//import java.time.temporal.ChronoUnit;
//import java.util.Date;
//import java.util.HashMap;
//import java.util.Map;
//
//@Component
//public class JwtProvider {
//
//    @Value("${jwt.key}")
//    private String secretKey;
//
//    @Value("${jwt.time}")
//    private long tokenValidity;
//
//    private static Key key;
//
//    @PostConstruct
//    public void init() {
//        byte[] secretBytes = DatatypeConverter.parseBase64Binary(secretKey);
//        key = new SecretKeySpec(secretBytes, SignatureAlgorithm.HS256.getJcaName());
//    }
//
//
//    public String generateToken(User user) {
//        long now = System.currentTimeMillis();
//        Date expireDate = new Date(now + tokenValidity);
//
//        return Jwts.builder()
//                .setHeader(createHeader())
//                .setClaims(createClaims(user))
//                .setSubject(user.getUserId())
//                .setIssuedAt(new Date(now))
//                .setExpiration(expireDate)
//                .signWith(key, SignatureAlgorithm.HS256)
//
//
//                .compact();
//    }
//
//    public boolean isValidToken(String token) {
//        try {
//            getClaims(token); // 파싱 시도
//            return true;
//        } catch (JwtException | IllegalArgumentException e) {
//            e.printStackTrace();
//            return false;
//        }
//    }
//
////    public Claims getClaims(String token) {
////        return Jwts.parserBuilder()
////                .setSigningKey(key)
////                .build()
////                .parseClaimsJws(token)
////                .getBody();
////    }
//
//    //완수 디버깅 추가
//    // JwtProvider.java의 getClaims 메서드 (또는 유사한 검증 로직)
//    public Claims getClaims(String token) {
//        try {
//            System.out.println("[JwtProvider] getClaims - 토큰 검증 및 클레임 추출 시도: " + token);
//            System.out.println("[JwtProvider] getClaims - 검증에 사용될 key: " + (key != null ? key.getAlgorithm() + " key initialized" : "KEY IS NULL"));
//
//            Claims claims = Jwts.parserBuilder()
//                    .setSigningKey(key) // 이 'key'가 init()에서 설정된 key와 동일한지, null이 아닌지 중요
//                    .build()
//                    .parseClaimsJws(token)
//                    .getBody();
//            System.out.println("[JwtProvider] getClaims - 클레임 추출 성공: " + claims.toString());
//            return claims;
//        } catch (SignatureException e) {
//            System.err.println("!!!!!!!! [JwtProvider] getClaims - SignatureException 발생: 서명이 유효하지 않음 !!!!!!!!");
//            System.err.println("           (원인: secretKey 불일치 또는 토큰 변조 가능성)");
//            System.err.println("           " + e.getMessage());
//            // e.printStackTrace(); // 필요하면 전체 스택 트레이스 출력
//            throw e; // 예외를 다시 던져서 JwtAuthenticationFilter에서 상세 처리하도록 함
//        } catch (ExpiredJwtException e) {
//            System.err.println("[JwtProvider] getClaims - ExpiredJwtException 발생: 토큰 만료 - " + e.getMessage());
//            throw e;
//        } catch (MalformedJwtException e) {
//            System.err.println("[JwtProvider] getClaims - MalformedJwtException 발생: 토큰 형식 오류 - " + e.getMessage());
//            throw e;
//        } catch (JwtException e) { // 기타 모든 JWT 관련 예외 (UnsupportedJwtException, IllegalArgumentException 등 포함)
//            System.err.println("[JwtProvider] getClaims - JwtException 발생 (일반): " + e.getClass().getName() + " - " + e.getMessage());
//            throw e;
//        }
//    }
//
//    private static Map<String, Object> createHeader() {
//        Map<String, Object> header = new HashMap<>();
//        header.put("type", "JWT");
//        header.put("alg", "HS256");
//        header.put("created", System.currentTimeMillis());
//        return header;
//    }
//
//    private static Map<String, Object> createClaims(User user) {
//        Map<String, Object> claims = new HashMap<>();
//        claims.put("userId",user.getUserId());
//        claims.put("role", user.getRole().name());
//
//        return claims;
//    }
//}

package com.minute.security.handler;

import com.minute.user.entity.User;
import io.jsonwebtoken.*;
import jakarta.annotation.PostConstruct;
import jakarta.xml.bind.DatatypeConverter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.spec.SecretKeySpec;
import java.security.Key;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;

@Component
public class JwtProvider {

    @Value("${jwt.key}")
    private String secretKey;

    @Value("${jwt.time}")
    private long tokenValidity;

    // static 키워드 제거
    private Key key;

    @PostConstruct
    public void init() {
        byte[] secretBytes = DatatypeConverter.parseBase64Binary(secretKey);
        this.key = new SecretKeySpec(secretBytes, SignatureAlgorithm.HS256.getJcaName());
        System.out.println("[JwtProvider] Key initialized successfully.");
    }

    public String generateToken(User user) {
        long now = System.currentTimeMillis();
        Date expireDate = new Date(now + tokenValidity);

        return Jwts.builder()
                .setHeader(createHeader())
                .setClaims(createClaims(user))
                .setSubject(user.getUserId())
                .setIssuedAt(new Date(now))
                .setExpiration(expireDate)
                .signWith(key, SignatureAlgorithm.HS256)
                .compact();
    }

    //
    // ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
    // 이 메서드를 다시 추가해야 합니다!
    // ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
    public boolean isValidToken(String token) {
        try {
            getClaims(token); // 파싱을 시도해서 성공하면 유효한 토큰
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            // 파싱 중 예외가 발생하면 유효하지 않은 토큰
            // e.printStackTrace(); // 디버깅 시에만 활성화
            return false;
        }
    }


    // getClaims 메서드는 그대로 유지
    public Claims getClaims(String token) {
        try {
            System.out.println("[JwtProvider] getClaims - 토큰 검증 및 클레임 추출 시도: " + token);
            System.out.println("[JwtProvider] getClaims - 검증에 사용될 key: " + (key != null ? key.getAlgorithm() + " key initialized" : "KEY IS NULL"));

            return Jwts.parserBuilder()
                    .setSigningKey(key)
                    .build()
                    .parseClaimsJws(token)
                    .getBody();
        } catch (SignatureException e) {
            System.err.println("!!!!!!!! [JwtProvider] getClaims - SignatureException 발생: 서명이 유효하지 않음 !!!!!!!!");
            System.err.println("           (원인: secretKey 불일치 또는 토큰 변조 가능성)");
            System.err.println("           " + e.getMessage());
            throw e;
        } catch (JwtException e) {
            System.err.println("[JwtProvider] getClaims - JwtException 발생: " + e.getClass().getSimpleName() + " - " + e.getMessage());
            throw e;
        }
    }


    // static 키워드 제거
    private Map<String, Object> createHeader() {
        Map<String, Object> header = new HashMap<>();
        header.put("type", "JWT");
        header.put("alg", "HS256");
        header.put("created", System.currentTimeMillis());
        return header;
    }

    // static 키워드 제거
    private Map<String, Object> createClaims(User user) {
        Map<String, Object> claims = new HashMap<>();
        claims.put("userId", user.getUserId());
        claims.put("role", user.getRole().name());
        return claims;
    }
}