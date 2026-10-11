package com.example.ecommerce.service.impl;

import com.example.ecommerce.dto.response.NotificationDto;
import com.example.ecommerce.entity.Notification;
import com.example.ecommerce.entity.NotificationType;
import com.example.ecommerce.entity.User;
import com.example.ecommerce.exception.BadRequestException;
import com.example.ecommerce.exception.ResourceNotFoundException;
import com.example.ecommerce.repository.NotificationRepository;
import com.example.ecommerce.repository.UserRepository;
import com.example.ecommerce.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;

    /** Joins the caller's transaction, so a rolled-back order never leaves a stray notification. */
    @Override
    public void send(User user, NotificationType type, String message, Long orderId) {
        notificationRepository.save(Notification.builder()
                .user(user)
                .type(type)
                .message(message)
                .orderId(orderId)
                .build());
    }

    @Override
    public List<NotificationDto> getForUser(String username) {
        User user = getUser(username);
        return notificationRepository.findTop30ByUserIdOrderByCreatedAtDesc(user.getId())
                .stream().map(this::toDto).toList();
    }

    @Override
    public long unreadCount(String username) {
        return notificationRepository.countByUserIdAndSeenFalse(getUser(username).getId());
    }

    @Override
    @Transactional
    public void markRead(String username, Long notificationId) {
        User user = getUser(username);
        Notification n = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found: " + notificationId));
        if (!n.getUser().getId().equals(user.getId())) {
            throw new BadRequestException("This notification does not belong to you");
        }
        n.setSeen(true);
        notificationRepository.save(n);
    }

    @Override
    @Transactional
    public void markAllRead(String username) {
        List<Notification> unread = notificationRepository.findByUserIdAndSeenFalse(getUser(username).getId());
        unread.forEach(n -> n.setSeen(true));
        notificationRepository.saveAll(unread);
    }

    private User getUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + username));
    }

    private NotificationDto toDto(Notification n) {
        return new NotificationDto(n.getId(), n.getType().name(), n.getMessage(),
                n.getOrderId(), n.isSeen(), n.getCreatedAt());
    }
}
