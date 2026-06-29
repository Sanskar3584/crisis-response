package com.crisis.auth;

import com.crisis.user.Role;
import com.crisis.user.User;
import com.crisis.user.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.server.ResponseStatusException;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock UserRepository userRepository;
    @Mock PasswordEncoder passwordEncoder;
    @Mock JwtService jwtService;

    @InjectMocks AuthService authService;

    @Test
    void register_hashesPassword_andSavesUser() {
        // Arrange
        RegisterRequest request =
                new RegisterRequest("bob@hotel.com", "secret123", "Bob", Role.STAFF, "venue-1");
        when(userRepository.existsByEmail("bob@hotel.com")).thenReturn(false);
        when(passwordEncoder.encode("secret123")).thenReturn("HASHED");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));

        // Act
        User result = authService.register(request);

        // Assert
        assertThat(result.getPasswordHash()).isEqualTo("HASHED");   // password was hashed
        assertThat(result.getEmail()).isEqualTo("bob@hotel.com");
        verify(passwordEncoder).encode("secret123");                // encode was actually called
    }

    @Test
    void register_rejectsDuplicateEmail() {
        RegisterRequest request =
                new RegisterRequest("bob@hotel.com", "secret123", "Bob", Role.STAFF, "venue-1");
        when(userRepository.existsByEmail("bob@hotel.com")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(request))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Email already registered");
    }

    @Test
    void login_withWrongPassword_throwsUnauthorized() {
        User user = new User();
        user.setEmail("bob@hotel.com");
        user.setPasswordHash("HASHED");
        LoginRequest request = new LoginRequest("bob@hotel.com", "wrong");
        when(userRepository.findByEmail("bob@hotel.com")).thenReturn(user);
        when(passwordEncoder.matches("wrong", "HASHED")).thenReturn(false);

        assertThatThrownBy(() -> authService.login(request))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining("Invalid email or password");
    }
}