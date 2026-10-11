package com.example.ecommerce.service;

import com.example.ecommerce.dto.response.NotificationDto;
import com.example.ecommerce.entity.NotificationType;
import com.example.ecommerce.entity.User;

import java.util.List;

public interface NotificationService {
    void send(User user, NotificationType type, String message, Long orderId);
    List<NotificationDto> getForUser(String username);
    long unreadCount(String username);
    void markRead(String username, Long notificationId);
    void markAllRead(String username);
}
