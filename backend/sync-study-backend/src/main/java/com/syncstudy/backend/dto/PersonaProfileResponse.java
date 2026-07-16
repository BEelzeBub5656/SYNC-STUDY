package com.syncstudy.backend.dto;

import java.util.List;

public record PersonaProfileResponse(
        List<List<String>> answers
) {
}
