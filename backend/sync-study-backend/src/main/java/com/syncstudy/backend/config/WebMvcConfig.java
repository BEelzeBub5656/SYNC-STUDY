package com.syncstudy.backend.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    private final JwtAuthInterceptor jwtAuthInterceptor;
    private final InternalAgentAuthInterceptor internalAgentAuthInterceptor;

    public WebMvcConfig(
            JwtAuthInterceptor jwtAuthInterceptor,
            InternalAgentAuthInterceptor internalAgentAuthInterceptor
    ) {
        this.jwtAuthInterceptor = jwtAuthInterceptor;
        this.internalAgentAuthInterceptor = internalAgentAuthInterceptor;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(internalAgentAuthInterceptor)
                .addPathPatterns("/api/internal/agent/**")
                .order(0);

        registry.addInterceptor(jwtAuthInterceptor)
                .addPathPatterns("/api/**")
                .excludePathPatterns(
                        "/api/auth/register",
                        "/api/auth/login",
                        "/api/hello",
                        "/api/internal/agent/**"
                )
                .order(1);
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOriginPatterns("*")
                .allowedMethods("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS")
                .allowedHeaders("*")
                .maxAge(3600);
    }
}
