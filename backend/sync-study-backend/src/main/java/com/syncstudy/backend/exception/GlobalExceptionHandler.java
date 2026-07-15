package com.syncstudy.backend.exception;

import com.syncstudy.backend.common.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.converter.HttpMessageNotReadableException;

@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * 处理 @Valid 参数校验失败。
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>>
    handleValidationException(
            MethodArgumentNotValidException exception
    ) {
        String message = exception
                .getBindingResult()
                .getFieldErrors()
                .stream()
                .findFirst()
                .map(error -> error.getDefaultMessage())
                .orElse("请求参数不正确");

        ApiResponse<Void> response =
                ApiResponse.error(1001, message);

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(response);
    }

    /**
     * 处理 Service 主动抛出的 HTTP 异常。
     */
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<ApiResponse<Void>>
    handleResponseStatusException(
            ResponseStatusException exception
    ) {
        ApiResponse<Void> response =
                ApiResponse.error(
                        1002,
                        exception.getReason()
                );

        return ResponseEntity
                .status(exception.getStatusCode())
                .body(response);
    }

    /**
     * 处理 JSON 格式错误、字段类型错误和非法枚举值。
     */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiResponse<Void>>
    handleHttpMessageNotReadableException(
            HttpMessageNotReadableException exception
    ) {
        ApiResponse<Void> response =
                ApiResponse.error(
                        1001,
                        "请求体格式错误，或包含不允许的字段值"
                );

        return ResponseEntity
                .status(HttpStatus.BAD_REQUEST)
                .body(response);
    }


    /**
     * 处理没有被预料到的异常。
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>>
    handleUnexpectedException(
            Exception exception
    ) {
        exception.printStackTrace();

        ApiResponse<Void> response =
                ApiResponse.error(
                        2000,
                        "服务器内部错误"
                );

        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(response);
    }
}