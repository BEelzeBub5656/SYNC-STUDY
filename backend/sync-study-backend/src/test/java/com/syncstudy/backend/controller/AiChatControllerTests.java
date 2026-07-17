package com.syncstudy.backend.controller;

import com.syncstudy.backend.common.ApiResponse;
import com.syncstudy.backend.dto.AiChatRequest;
import com.syncstudy.backend.dto.AiChatResponse;
import com.syncstudy.backend.model.AuthenticatedUser;
import com.syncstudy.backend.service.AiChatService;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class AiChatControllerTests {

    @Test
    void usesAuthenticatedUserIdInsteadOfAcceptingItFromTheRequest() {
        AiChatService service = mock(AiChatService.class);
        AiChatRequest request = new AiChatRequest("你好", null);
        AiChatResponse expected = new AiChatResponse(
                "completed",
                "thread-19",
                "你好，有什么可以帮你？"
        );
        when(service.chat(19L, request)).thenReturn(expected);
        AiChatController controller = new AiChatController(service);

        ApiResponse<AiChatResponse> response = controller.chat(
                new AuthenticatedUser(19L, "student"),
                request
        );

        assertEquals(0, response.getCode());
        assertEquals(expected, response.getData());
        verify(service).chat(19L, request);
    }
}
