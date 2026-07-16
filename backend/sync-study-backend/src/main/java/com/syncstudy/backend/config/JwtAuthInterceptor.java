package com.syncstudy.backend.config;

import com.syncstudy.backend.model.AuthenticatedUser;
import com.syncstudy.backend.repository.UserRepository;
import com.syncstudy.backend.service.JwtService;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class JwtAuthInterceptor implements HandlerInterceptor {

    public static final String AUTHENTICATED_USER_ATTRIBUTE = "authenticatedUser";

    private final JwtService jwtService;
    private final UserRepository userRepository;

    public JwtAuthInterceptor(
            JwtService jwtService,
            UserRepository userRepository
    ) {
        this.jwtService = jwtService;
        this.userRepository = userRepository;
    }

    @Override
    public boolean preHandle(
            HttpServletRequest request,
            HttpServletResponse response,
            Object handler
    ) {
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }

        String authorization = request.getHeader("Authorization");
        if (authorization == null || !authorization.startsWith("Bearer ")) {
            throw unauthorized();
        }

        String token = authorization.substring(7).trim();
        if (token.isEmpty()) {
            throw unauthorized();
        }

        try {
            AuthenticatedUser user = jwtService.parseToken(token);
            if (!userRepository.existsById(user.id())) {
                throw unauthorized();
            }
            request.setAttribute(AUTHENTICATED_USER_ATTRIBUTE, user);
            return true;
        } catch (JwtException | IllegalArgumentException exception) {
            throw unauthorized();
        }
    }

    private ResponseStatusException unauthorized() {
        return new ResponseStatusException(
                HttpStatus.UNAUTHORIZED,
                "登录状态已失效，请重新登录"
        );
    }
}
