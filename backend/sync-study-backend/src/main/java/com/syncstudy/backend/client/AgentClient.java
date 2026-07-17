package com.syncstudy.backend.client;

import com.syncstudy.backend.config.AgentProperties;
import com.syncstudy.backend.dto.AgentChatRequest;
import com.syncstudy.backend.dto.AgentChatResponse;
import com.syncstudy.backend.dto.AgentMoodAdviceRequest;
import com.syncstudy.backend.dto.AgentMoodAdviceResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.client.ResourceAccessException;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;
import org.springframework.web.server.ResponseStatusException;

import static org.springframework.http.HttpStatus.BAD_GATEWAY;
import static org.springframework.http.HttpStatus.SERVICE_UNAVAILABLE;

@Component
public class AgentClient {

    static final String SERVICE_TOKEN_HEADER = "X-Agent-Service-Token";

    private static final Logger LOGGER = LoggerFactory.getLogger(AgentClient.class);

    private final RestClient restClient;
    private final String serviceToken;

    public AgentClient(
            RestClient agentRestClient,
            AgentProperties properties
    ) {
        this.restClient = agentRestClient;
        this.serviceToken = properties.serviceToken();
    }

    public AgentChatResponse chat(AgentChatRequest request) {
        try {
            AgentChatResponse response = restClient
                    .post()
                    .uri("/api/agent/chat")
                    .contentType(MediaType.APPLICATION_JSON)
                    .headers(this::addServiceToken)
                    .body(request)
                    .retrieve()
                    .body(AgentChatResponse.class);

            if (response == null
                    || !StringUtils.hasText(response.status())
                    || !StringUtils.hasText(response.threadId())
                    || !StringUtils.hasText(response.message())) {
                LOGGER.warn("Agent service returned an empty chat response");
                throw new ResponseStatusException(
                        BAD_GATEWAY,
                        "AI助手返回了无效内容，请稍后重试"
                );
            }
            return response;
        } catch (ResourceAccessException exception) {
            LOGGER.warn("Unable to connect to agent service", exception);
            throw new ResponseStatusException(
                    SERVICE_UNAVAILABLE,
                    "AI助手暂时无法连接，请稍后重试",
                    exception
            );
        } catch (RestClientResponseException exception) {
            LOGGER.warn(
                    "Agent service request failed with status {}",
                    exception.getStatusCode(),
                    exception
            );
            throw new ResponseStatusException(
                    BAD_GATEWAY,
                    "AI助手处理请求失败，请稍后重试",
                    exception
            );
        } catch (RestClientException exception) {
            LOGGER.warn("Unable to decode agent service response", exception);
            throw new ResponseStatusException(
                    BAD_GATEWAY,
                    "AI助手返回了无效内容，请稍后重试",
                    exception
            );
        }
    }

    public AgentMoodAdviceResponse moodAdvice(AgentMoodAdviceRequest request) {
        try {
            AgentMoodAdviceResponse response = restClient
                    .post()
                    .uri("/api/agent/mood-advice")
                    .contentType(MediaType.APPLICATION_JSON)
                    .headers(this::addServiceToken)
                    .body(request)
                    .retrieve()
                    .body(AgentMoodAdviceResponse.class);
            if (response == null
                    || !StringUtils.hasText(response.moodId())
                    || !StringUtils.hasText(response.advice())) {
                LOGGER.warn("Agent service returned an empty mood advice response");
                throw new ResponseStatusException(
                        BAD_GATEWAY,
                        "AI助手返回了无效的心情建议"
                );
            }
            return response;
        } catch (ResourceAccessException exception) {
            LOGGER.warn("Unable to connect to agent service for mood advice", exception);
            throw new ResponseStatusException(
                    SERVICE_UNAVAILABLE,
                    "AI助手暂时无法连接，请稍后重试",
                    exception
            );
        } catch (RestClientResponseException exception) {
            LOGGER.warn(
                    "Agent mood advice request failed with status {}",
                    exception.getStatusCode(),
                    exception
            );
            throw new ResponseStatusException(
                    BAD_GATEWAY,
                    "AI助手生成心情建议失败，请稍后重试",
                    exception
            );
        } catch (RestClientException exception) {
            LOGGER.warn("Unable to decode agent mood advice response", exception);
            throw new ResponseStatusException(
                    BAD_GATEWAY,
                    "AI助手返回了无效的心情建议",
                    exception
            );
        }
    }

    private void addServiceToken(HttpHeaders headers) {
        if (StringUtils.hasText(serviceToken)) {
            headers.set(SERVICE_TOKEN_HEADER, serviceToken.trim());
        }
    }
}
