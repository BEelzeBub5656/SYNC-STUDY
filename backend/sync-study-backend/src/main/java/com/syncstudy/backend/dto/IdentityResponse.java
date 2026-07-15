package com.syncstudy.backend.dto;

import com.syncstudy.backend.enums.IdentityType;

public class IdentityResponse {

    private IdentityType identity;

    public IdentityResponse(IdentityType identity) {
        this.identity = identity;
    }

    public IdentityType getIdentity() {
        return identity;
    }

    public void setIdentity(IdentityType identity) {
        this.identity = identity;
    }
}