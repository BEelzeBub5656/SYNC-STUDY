package com.syncstudy.backend.service;

import com.syncstudy.backend.dto.LoginRequest;
import com.syncstudy.backend.dto.LoginResponse;
import com.syncstudy.backend.dto.RegisterRequest;
import com.syncstudy.backend.dto.RegisterResponse;
import com.syncstudy.backend.model.UserAuthData;
import com.syncstudy.backend.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public RegisterResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "用户名已存在"
            );
        }

        if (userRepository.existsByPhone(request.getPhone())) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "手机号已注册"
            );
        }

        String passwordHash =
                passwordEncoder.encode(request.getPassword());

        Long userId = userRepository.insertUser(
                request.getUsername(),
                passwordHash,
                request.getPhone()
        );

        return new RegisterResponse(
                userId,
                request.getUsername(),
                request.getPhone()
        );
    }

    public LoginResponse login(LoginRequest request) {
        UserAuthData user = userRepository
                .findAuthByUsername(request.getUsername())
                .orElseThrow(this::invalidCredentialsException);

        boolean passwordMatches = passwordEncoder.matches(
                request.getPassword(),
                user.passwordHash()
        );

        if (!passwordMatches) {
            throw invalidCredentialsException();
        }

        return new LoginResponse(
                user.id(),
                user.username()
        );
    }

    private ResponseStatusException invalidCredentialsException() {
        return new ResponseStatusException(
                HttpStatus.UNAUTHORIZED,
                "用户名或密码错误"
        );
    }
}