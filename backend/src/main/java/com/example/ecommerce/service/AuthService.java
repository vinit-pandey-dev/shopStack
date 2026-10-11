package com.example.ecommerce.service;

import com.example.ecommerce.dto.request.LoginRequest;
import com.example.ecommerce.dto.request.RegisterRequest;
import com.example.ecommerce.dto.response.JwtResponse;

public interface AuthService {
    void register(RegisterRequest request);
    JwtResponse login(LoginRequest request);
}
