package com.crisis.user;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    public List<User> getUsersForVenue(String adminUserId) {
        User admin = userRepository.findById(adminUserId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unknown user"));
        return userRepository.findByVenueId(admin.getVenueId());
    }

    public User getUserById(String id) {
        return userRepository.findById(id).orElse(null);
    }

    public User createByAdmin(String adminUserId, CreateUserRequest request) {
        User admin = userRepository.findById(adminUserId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unknown user"));

        // Don't let anyone mint ADMINs through this path.
        if (request.role() == Role.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot create ADMIN users here");
        }

        if (userRepository.existsByEmail(request.email())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email already registered");
        }

        User user = new User();
        user.setEmail(request.email());
        user.setDisplayName(request.displayName());
        user.setRole(request.role());
        user.setVenueId(admin.getVenueId());          // forced to the creator's venue
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        return userRepository.save(user);
    }

    public void deleteUser(String adminUserId, String targetId) {
        User admin = userRepository.findById(adminUserId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unknown user"));
        User target = userRepository.findById(targetId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (!target.getVenueId().equals(admin.getVenueId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not your venue");
        }
        if (target.getId().equals(admin.getId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "You cannot remove yourself");
        }
        if (target.getRole() == Role.ADMIN) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Cannot remove an admin");
        }
        userRepository.deleteById(targetId);
    }
}
