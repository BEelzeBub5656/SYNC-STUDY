package com.syncstudy.backend.service;

import com.syncstudy.backend.client.AgentClient;
import com.syncstudy.backend.dto.AgentChatRequest;
import com.syncstudy.backend.dto.AgentChatResponse;
import com.syncstudy.backend.dto.AiChatRequest;
import com.syncstudy.backend.dto.AiChatResponse;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AiChatServiceTests {

    @Test
    void forwardsUserAndNormalizedConversationToAgent() {
        AgentClient agentClient = mock(AgentClient.class);
        when(agentClient.chat(org.mockito.ArgumentMatchers.any()))
                .thenReturn(new AgentChatResponse(
                        "completed",
                        "thread-88",
                        "可以先复习高频错题。"
                ));
        AiChatService service = new AiChatService(agentClient);

        AiChatResponse response = service.chat(
                88L,
                new AiChatRequest("  帮我安排复习  ", "  thread-88  ")
        );

        ArgumentCaptor<AgentChatRequest> requestCaptor =
                ArgumentCaptor.forClass(AgentChatRequest.class);
        verify(agentClient).chat(requestCaptor.capture());
        assertEquals(88L, requestCaptor.getValue().userId());
        assertEquals("帮我安排复习", requestCaptor.getValue().message());
        assertEquals("thread-88", requestCaptor.getValue().threadId());
        assertEquals("completed", response.status());
        assertEquals("可以先复习高频错题。", response.message());
    }

    @Test
    void treatsBlankThreadIdAsANewConversation() {
        AgentClient agentClient = mock(AgentClient.class);
        when(agentClient.chat(org.mockito.ArgumentMatchers.any()))
                .thenReturn(new AgentChatResponse(
                        "completed",
                        "new-thread",
                        "你好"
                ));
        AiChatService service = new AiChatService(agentClient);

        service.chat(9L, new AiChatRequest("你好", "   "));

        ArgumentCaptor<AgentChatRequest> requestCaptor =
                ArgumentCaptor.forClass(AgentChatRequest.class);
        verify(agentClient).chat(requestCaptor.capture());
        assertNull(requestCaptor.getValue().threadId());
    }
}
