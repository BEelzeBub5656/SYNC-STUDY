package com.syncstudy.backend.service;

import com.syncstudy.backend.enums.IdentityType;
import com.syncstudy.backend.repository.IdentityRepository;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class IdentityService {

    private static final Long DEMO_USER_ID = 1L;

    private final IdentityRepository identityRepository;

    public IdentityService(
            IdentityRepository identityRepository
    ) {
        this.identityRepository = identityRepository;
    }

    public IdentityType saveIdentity(
            IdentityType identity
    ) {
        int affectedRows = identityRepository.updateIdentity(
                DEMO_USER_ID,
                identity
        );

        if (affectedRows == 0) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND,
                    "测试用户不存在"
            );
        }

        return identity;
    }

    public IdentityType getIdentity() {
        return identityRepository
                .findIdentityByUserId(DEMO_USER_ID)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.NOT_FOUND,
                                "测试用户不存在"
                        )
                );
    }
}