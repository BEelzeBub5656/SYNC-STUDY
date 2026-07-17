package com.syncstudy.backend.client;

import com.syncstudy.backend.config.AgentProperties;
import com.syncstudy.backend.dto.AgentChatRequest;
import com.syncstudy.backend.dto.AgentChatResponse;
import com.syncstudy.backend.dto.AgentMoodAdviceRequest;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.test.web.client.MockRestServiceServer;
import org.springframework.web.client.RestClient;
import org.springframework.web.server.ResponseStatusException;

import java.net.URI;
import java.time.Duration;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.springframework.http.HttpStatus.BAD_GATEWAY;
import static org.springframework.test.web.client.ExpectedCount.once;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.content;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.header;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.method;
import static org.springframework.test.web.client.match.MockRestRequestMatchers.requestTo;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withServerError;
import static org.springframework.test.web.client.response.MockRestResponseCreators.withSuccess;

class AgentClientTests {

    @Test
    void sendsMoodContextToTheDedicatedAgentEndpoint() {
        RestClient.Builder builder = RestClient.builder();
        MockRestServiceServer server = MockRestServiceServer
                .bindTo(builder)
                .build();
        AgentClient client = createClient(builder, "internal-secret");

        server.expect(once(), requestTo("http://agent.test/api/agent/mood-advice"))
                .andExpect(method(HttpMethod.POST))
                .andExpect(header(
                        AgentClient.SERVICE_TOKEN_HEADER,
                        "internal-secret"
                ))
                .andExpect(content().json("""
                        {
                          "userId": 42,
                          "moodId": "calm",
                          "description": "今天状态稳定"
                        }
                        """))
                .andRespond(withSuccess("""
                        {
                          "moodId": "calm",
                          "description": "今天状态稳定",
                          "advice": "适合完成一轮稳步复习。"
                        }
                        """, MediaType.APPLICATION_JSON));

        var response = client.moodAdvice(new AgentMoodAdviceRequest(
                42L,
                "calm",
                "今天状态稳定"
        ));

        assertEquals("适合完成一轮稳步复习。", response.advice());
        server.verify();
    }

    @Test
    void sendsAuthenticatedUserContextAndServiceTokenToAgent() {
        RestClient.Builder builder = RestClient.builder();
        MockRestServiceServer server = MockRestServiceServer
                .bindTo(builder)
                .build();
        AgentClient client = createClient(builder, "internal-secret");

        server.expect(once(), requestTo("http://agent.test/api/agent/chat"))
                .andExpect(method(HttpMethod.POST))
                .andExpect(header(
                        AgentClient.SERVICE_TOKEN_HEADER,
                        "internal-secret"
                ))
                .andExpect(content().contentType(MediaType.APPLICATION_JSON))
                .andExpect(content().json("""
                        {
                          "userId": 42,
                          "message": "怎样安排今天的复习？",
                          "threadId": "thread-1"
                        }
                        """))
                .andRespond(withSuccess("""
                        {
                          "status": "completed",
                          "threadId": "thread-1",
                          "message": "先完成一轮错题复盘。"
                        }
                        """, MediaType.APPLICATION_JSON));

        AgentChatResponse response = client.chat(new AgentChatRequest(
                42L,
                "怎样安排今天的复习？",
                "thread-1"
        ));

        assertEquals("completed", response.status());
        assertEquals("thread-1", response.threadId());
        assertEquals("先完成一轮错题复盘。", response.message());
        server.verify();
    }

    @Test
    void convertsAgentFailureIntoFriendlyGatewayError() {
        RestClient.Builder builder = RestClient.builder();
        MockRestServiceServer server = MockRestServiceServer
                .bindTo(builder)
                .build();
        AgentClient client = createClient(builder, "");

        server.expect(requestTo("http://agent.test/api/agent/chat"))
                .andRespond(withServerError());

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> client.chat(new AgentChatRequest(7L, "你好", null))
        );

        assertEquals(BAD_GATEWAY, exception.getStatusCode());
        assertEquals("AI助手处理请求失败，请稍后重试", exception.getReason());
        server.verify();
    }

    @Test
    void rejectsAnEmptyAgentReply() {
        RestClient.Builder builder = RestClient.builder();
        MockRestServiceServer server = MockRestServiceServer
                .bindTo(builder)
                .build();
        AgentClient client = createClient(builder, null);

        server.expect(requestTo("http://agent.test/api/agent/chat"))
                .andRespond(withSuccess("""
                        {
                          "status": "completed",
                          "threadId": "thread-2",
                          "message": "  "
                        }
                        """, MediaType.APPLICATION_JSON));

        ResponseStatusException exception = assertThrows(
                ResponseStatusException.class,
                () -> client.chat(new AgentChatRequest(7L, "你好", null))
        );

        assertEquals(BAD_GATEWAY, exception.getStatusCode());
        server.verify();
    }

    private AgentClient createClient(
            RestClient.Builder builder,
            String serviceToken
    ) {
        AgentProperties properties = new AgentProperties(
                URI.create("http://agent.test"),
                serviceToken,
                Duration.ofSeconds(1),
                Duration.ofSeconds(5)
        );
        return new AgentClient(
                builder.baseUrl(properties.baseUrl().toString()).build(),
                properties
        );
    }
}
