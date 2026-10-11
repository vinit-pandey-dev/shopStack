package com.example.ecommerce.dto.response;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class NotificationDto {
    private Long id;
    private String type;
    private String message;
    private Long orderId;
    private boolean read;
    private LocalDateTime createdAt;
}
