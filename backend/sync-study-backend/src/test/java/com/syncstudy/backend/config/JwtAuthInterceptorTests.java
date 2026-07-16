package com.syncstudy.backend.config;

import com.syncstudy.backend.model.AuthenticatedUser;
import com.syncstudy.backend.repository.UserRepository;
import com.syncstudy.backend.service.JwtService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class JwtAuthInterceptorTests {

    @Test
    void rejectsAValidTokenWhenItsUserNoLongerExists() {
        JwtService jwtService = mock(JwtService.class);
        UserRepository userRepository = mock(UserRepository.class);
        HttpServletRequest request = mock(HttpServletRequest.class);
        HttpServletResponse response = mock(HttpServletResponse.class);

        when(request.getMethod()).thenReturn("GET");
        when(request.getHeader("Authorization")).thenReturn("Bearer valid-token");
        when(jwtService.parseToken("valid-token"))
                .thenReturn(new AuthenticatedUser(42L, "deleted-user"));
        when(userRepository.existsById(42L)).thenReturn(false);

        JwtAuthInterceptor interceptor =
                new JwtAuthInterceptor(jwtService, userRepository);

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> interceptor.preHandle(request, response, new Object())
        );

        assertEquals(HttpStatus.UNAUTHORIZED, exception.getStatusCode());
        verify(request, never()).setAttribute(
                JwtAuthInterceptor.AUTHENTICATED_USER_ATTRIBUTE,
                new AuthenticatedUser(42L, "deleted-user")
        );
    }
}
