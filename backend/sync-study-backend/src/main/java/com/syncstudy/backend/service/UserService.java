package com.syncstudy.backend.service;

import com.syncstudy.backend.dto.LoginRequest;
import com.syncstudy.backend.dto.LoginResponse;
import com.syncstudy.backend.dto.CurrentUserResponse;
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
    private final JwtService jwtService;

    public UserService(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public RegisterResponse register(RegisterRequest request) {
        String username = request.getUsername().trim();
        String phone = request.getPhone() == null || request.getPhone().isBlank()
                ? null
                : request.getPhone().trim();

        if (userRepository.existsByUsername(username)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "用户名已存在"
            );
        }

        if (phone != null && userRepository.existsByPhone(phone)) {
            throw new ResponseStatusException(
                    HttpStatus.CONFLICT,
                    "手机号已注册"
            );
        }

        String passwordHash =
                passwordEncoder.encode(request.getPassword());

        Long userId = userRepository.insertUser(
                username,
                passwordHash,
                phone
        );

        String token = jwtService.createToken(userId, username);

        return new RegisterResponse(
                userId,
                username,
                phone,
                token,
                jwtService.getExpirationSeconds()
        );
    }

    public LoginResponse login(LoginRequest request) {
        UserAuthData user = userRepository
                .findAuthByUsername(request.getUsername().trim())
                .orElseThrow(this::invalidCredentialsException);

        boolean passwordMatches = passwordEncoder.matches(
                request.getPassword(),
                user.passwordHash()
        );

        if (!passwordMatches) {
            throw invalidCredentialsException();
        }

        String token = jwtService.createToken(user.id(), user.username());

        return new LoginResponse(
                user.id(),
                user.username(),
                token,
                jwtService.getExpirationSeconds()
        );
    }

    public CurrentUserResponse getCurrentUser(Long userId, String username) {
        if (!userRepository.existsById(userId)) {
            throw new ResponseStatusException(
                    HttpStatus.UNAUTHORIZED,
                    "登录用户不存在"
            );
        }
        return new CurrentUserResponse(userId, username);
    }

    private ResponseStatusException invalidCredentialsException() {
        return new ResponseStatusException(
                HttpStatus.UNAUTHORIZED,
                "用户名或密码错误"
        );
    }
}
