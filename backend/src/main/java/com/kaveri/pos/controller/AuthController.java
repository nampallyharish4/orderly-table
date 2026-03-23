package com.kaveri.pos.controller;

import com.kaveri.pos.entity.User;
import com.kaveri.pos.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> body) {
        try {
            String email = body.get("email");
            String password = body.get("password");

            if (email == null || password == null) {
                return ResponseEntity.status(400).body(Map.of("error", "Email and password are required"));
            }

            Optional<User> optUser = userRepository.findByEmail(email.toLowerCase());
            if (optUser.isEmpty() || !optUser.get().getPassword().equals(password)) {
                return ResponseEntity.status(401).body(Map.of("error", "Invalid email or password"));
            }

            User user = optUser.get();
            if (!user.getIsActive()) {
                return ResponseEntity.status(401).body(Map.of("error", "Account is deactivated"));
            }

            return ResponseEntity.ok(user);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to login"));
        }
    }
}
