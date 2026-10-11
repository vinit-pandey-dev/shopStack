package com.example.ecommerce.controller;

import com.example.ecommerce.dto.response.MessageResponse;
import com.example.ecommerce.dto.response.NotificationDto;
import com.example.ecommerce.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ResponseEntity<List<NotificationDto>> getAll(Authentication auth) {
        return ResponseEntity.ok(notificationService.getForUser(auth.getName()));
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> unreadCount(Authentication auth) {
        return ResponseEntity.ok(Map.of("count", notificationService.unreadCount(auth.getName())));
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<MessageResponse> markRead(Authentication auth, @PathVariable Long id) {
        notificationService.markRead(auth.getName(), id);
        return ResponseEntity.ok(new MessageResponse("Marked as read"));
    }

    @PutMapping("/read-all")
    public ResponseEntity<MessageResponse> markAllRead(Authentication auth) {
        notificationService.markAllRead(auth.getName());
        return ResponseEntity.ok(new MessageResponse("All notifications marked as read"));
    }
}
