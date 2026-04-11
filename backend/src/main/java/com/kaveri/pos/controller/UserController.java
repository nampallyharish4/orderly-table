package com.kaveri.pos.controller;

import com.kaveri.pos.entity.User;
import com.kaveri.pos.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @GetMapping
    public ResponseEntity<List<User>> getAllUsers() {
        try {
            return ResponseEntity.ok(userRepository.findAll());
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }

    @PostMapping
    public ResponseEntity<?> createUser(@RequestBody Map<String, Object> body) {
        try {
            User user = new User();
            user.setVisibleId("user-" + System.currentTimeMillis());
            user.setName(getString(body, "name"));
            user.setEmail(getString(body, "email").toLowerCase());
            // Hash the password with BCrypt before storing
            user.setPassword(passwordEncoder.encode(getString(body, "password")));
            user.setPhone(getString(body, "phone"));
            user.setRole(getString(body, "role"));
            user.setIsActive(true);
            user.setCreatedAt(OffsetDateTime.now());

            User saved = userRepository.save(user);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            String msg = e.getMessage() != null && e.getMessage().contains("duplicate key")
                    ? "Email already exists"
                    : "Failed to create user";
            return ResponseEntity.status(e.getMessage() != null && e.getMessage().contains("duplicate key") ? 400 : 500)
                    .body(Map.of("error", msg));
        }
    }

    @PatchMapping("/{id}")
    public ResponseEntity<?> updateUser(@PathVariable String id, @RequestBody Map<String, Object> body) {
        try {
            Optional<User> optUser = userRepository.findByVisibleId(id);
            if (optUser.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of("error", "User not found"));
            }
            User user = optUser.get();

            if (body.containsKey("name")) user.setName(getString(body, "name"));
            if (body.containsKey("email")) user.setEmail(getString(body, "email").toLowerCase());
            // Hash new password with BCrypt if password is being changed
            if (body.containsKey("password")) {
                String newPassword = getString(body, "password");
                if (newPassword != null && !newPassword.isEmpty()) {
                    user.setPassword(passwordEncoder.encode(newPassword));
                }
            }
            if (body.containsKey("phone")) user.setPhone(getString(body, "phone"));
            if (body.containsKey("role")) user.setRole(getString(body, "role"));
            if (body.containsKey("isActive")) user.setIsActive(Boolean.parseBoolean(body.get("isActive").toString()));

            User saved = userRepository.save(user);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to update user"));
        }
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<?> deleteUser(@PathVariable String id) {
        try {
            userRepository.deleteByVisibleId(id);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to delete user"));
        }
    }

    private String getString(Map<String, Object> body, String key) {
        return body.get(key) != null ? body.get(key).toString() : null;
    }
}
