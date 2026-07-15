package com.syncstudy.backend.dto;

import com.syncstudy.backend.enums.IdentityType;
import jakarta.validation.constraints.NotNull;

public class IdentityRequest {

    @NotNull(message = "身份类型不能为空")
    private IdentityType identity;

    public IdentityType getIdentity() {
        return identity;
    }

    public void setIdentity(IdentityType identity) {
        this.identity = identity;
    }
}