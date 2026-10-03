package com.crisis.user;

import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
    public User createUser(@AuthenticationPrincipal String adminUserId,
                           @Valid @RequestBody CreateUserRequest request) {
        return userService.createByAdmin(adminUserId, request);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
    public List<User> getAllUsers(@AuthenticationPrincipal String userId) {
        return userService.getUsersForVenue(userId);
    }

    @GetMapping("/{id}")
    public ResponseEntity<User> getUserById(@PathVariable String id) {
        User user = userService.getUserById(id);
        if (user == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(user);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('MANAGER','ADMIN')")
    public void deleteUser(@AuthenticationPrincipal String adminUserId, @PathVariable String id) {
        userService.deleteUser(adminUserId, id);
    }
}
