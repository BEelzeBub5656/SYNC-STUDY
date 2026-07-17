package com.syncstudy.backend.config;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;
import org.springframework.web.server.ResponseStatusException;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class InternalAgentAuthInterceptorTests {

    @Test
    void configuredTokenIsRequiredEvenForLoopback() {
        InternalAgentAuthInterceptor interceptor =
                new InternalAgentAuthInterceptor("secret-token");
        MockHttpServletRequest request = requestFrom("127.0.0.1");
        request.addHeader(
                InternalAgentAuthInterceptor.SERVICE_TOKEN_HEADER,
                "secret-token"
        );

        assertTrue(interceptor.preHandle(
                request,
                new MockHttpServletResponse(),
                new Object()
        ));

        MockHttpServletRequest invalid = requestFrom("127.0.0.1");
        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> interceptor.preHandle(
                        invalid,
                        new MockHttpServletResponse(),
                        new Object()
                )
        );
        assertEquals(401, exception.getStatusCode().value());
    }

    @Test
    void blankTokenConfigurationOnlyAllowsLoopback() {
        InternalAgentAuthInterceptor interceptor =
                new InternalAgentAuthInterceptor("  ");

        assertTrue(interceptor.preHandle(
                requestFrom("::1"),
                new MockHttpServletResponse(),
                new Object()
        ));
        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> interceptor.preHandle(
                        requestFrom("192.168.1.8"),
                        new MockHttpServletResponse(),
                        new Object()
                )
        );
        assertEquals(403, exception.getStatusCode().value());
    }

    private MockHttpServletRequest requestFrom(String remoteAddress) {
        MockHttpServletRequest request = new MockHttpServletRequest();
        request.setRemoteAddr(remoteAddress);
        request.setMethod("GET");
        return request;
    }
}
