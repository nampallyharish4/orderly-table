package com.kaveri.pos.controller;

import com.kaveri.pos.entity.User;
import com.kaveri.pos.repository.UserRepository;
import com.kaveri.pos.security.JwtService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtService jwtService;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        try {
            String email = body.get("email");
            String password = body.get("password");

            if (email == null || password == null) {
                return ResponseEntity.status(400).body(Map.of("error", "Email and password are required"));
            }

            Optional<User> optUser = userRepository.findByEmail(email.toLowerCase());
            if (optUser.isEmpty()) {
                return ResponseEntity.status(401).body(Map.of("error", "Invalid email or password"));
            }

            User user = optUser.get();

            // Support both BCrypt-hashed and legacy plain-text passwords.
            // If the stored password is not BCrypt-encoded, compare plain-text
            // and auto-upgrade to BCrypt on successful match.
            boolean passwordMatches;
            if (user.getPassword().startsWith("$2a$") || user.getPassword().startsWith("$2b$")) {
                passwordMatches = passwordEncoder.matches(password, user.getPassword());
            } else {
                // Legacy plain-text comparison + auto-upgrade
                passwordMatches = user.getPassword().equals(password);
                if (passwordMatches) {
                    // Auto-upgrade to BCrypt
                    user.setPassword(passwordEncoder.encode(password));
                    userRepository.save(user);
                }
            }

            if (!passwordMatches) {
                return ResponseEntity.status(401).body(Map.of("error", "Invalid email or password"));
            }

            if (!user.getIsActive()) {
                return ResponseEntity.status(401).body(Map.of("error", "Account is deactivated"));
            }

            // Generate JWT token
            String token = jwtService.generateToken(
                    user.getEmail(),
                    user.getRole(),
                    user.getName(),
                    user.getVisibleId()
            );

            // Build response with user info and token
            Map<String, Object> response = new HashMap<>();
            response.put("id", user.getVisibleId());
            response.put("name", user.getName());
            response.put("email", user.getEmail());
            response.put("role", user.getRole());
            response.put("phone", user.getPhone());
            response.put("avatarUrl", user.getAvatarUrl());
            response.put("isActive", user.getIsActive());
            response.put("createdAt", user.getCreatedAt());
            response.put("token", token);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to login"));
        }
    }
}
