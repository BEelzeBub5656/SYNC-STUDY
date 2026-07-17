package com.syncstudy.backend.config;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.servlet.HandlerInterceptor;

import java.net.InetAddress;
import java.net.UnknownHostException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

@Component
public class InternalAgentAuthInterceptor implements HandlerInterceptor {

    public static final String SERVICE_TOKEN_HEADER = "X-Agent-Service-Token";

    private final String configuredToken;

    public InternalAgentAuthInterceptor(
            @Value("${app.agent.internal-api-token:}") String configuredToken
    ) {
        this.configuredToken = configuredToken == null ? "" : configuredToken.trim();
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
        if (StringUtils.hasText(configuredToken)) {
            String suppliedToken = request.getHeader(SERVICE_TOKEN_HEADER);
            if (!constantTimeEquals(configuredToken, suppliedToken)) {
                throw new ResponseStatusException(
                        HttpStatus.UNAUTHORIZED,
                        "Agent 服务凭证无效"
                );
            }
            return true;
        }
        if (!isLoopback(request.getRemoteAddr())) {
            throw new ResponseStatusException(
                    HttpStatus.FORBIDDEN,
                    "未配置服务令牌时，内部接口仅允许本机访问"
            );
        }
        return true;
    }

    private boolean constantTimeEquals(String expected, String actual) {
        if (actual == null) {
            return false;
        }
        return MessageDigest.isEqual(
                expected.getBytes(StandardCharsets.UTF_8),
                actual.getBytes(StandardCharsets.UTF_8)
        );
    }

    private boolean isLoopback(String remoteAddress) {
        try {
            return InetAddress.getByName(remoteAddress).isLoopbackAddress();
        } catch (UnknownHostException exception) {
            return false;
        }
    }
}
