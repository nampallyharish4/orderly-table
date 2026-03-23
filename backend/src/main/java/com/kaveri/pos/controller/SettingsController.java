package com.kaveri.pos.controller;

import com.kaveri.pos.entity.AppSettings;
import com.kaveri.pos.repository.SettingsRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/settings")
public class SettingsController {

    @Autowired
    private SettingsRepository settingsRepository;

    @GetMapping
    public ResponseEntity<?> getSettings() {
        try {
            List<AppSettings> all = settingsRepository.findAll();
            if (all.isEmpty()) {
                AppSettings defaults = new AppSettings();
                defaults.setUpdatedAt(OffsetDateTime.now());
                return ResponseEntity.ok(settingsRepository.save(defaults));
            }
            return ResponseEntity.ok(all.get(0));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to fetch settings"));
        }
    }

    @PatchMapping
    public ResponseEntity<?> updateSettings(@RequestBody Map<String, Object> body) {
        try {
            List<AppSettings> all = settingsRepository.findAll();
            AppSettings settings;
            if (all.isEmpty()) {
                settings = new AppSettings();
            } else {
                settings = all.get(0);
            }

            if (body.containsKey("restaurantName")) settings.setRestaurantName(body.get("restaurantName").toString());
            if (body.containsKey("address")) settings.setAddress(body.get("address").toString());
            if (body.containsKey("phone")) settings.setPhone(body.get("phone").toString());
            if (body.containsKey("email")) settings.setEmail(body.get("email").toString());
            if (body.containsKey("enableNotifications")) settings.setEnableNotifications(Boolean.parseBoolean(body.get("enableNotifications").toString()));
            if (body.containsKey("enableSounds")) settings.setEnableSounds(Boolean.parseBoolean(body.get("enableSounds").toString()));
            if (body.containsKey("autoPrintBills")) settings.setAutoPrintBills(Boolean.parseBoolean(body.get("autoPrintBills").toString()));
            if (body.containsKey("enableUPI")) settings.setEnableUPI(Boolean.parseBoolean(body.get("enableUPI").toString()));
            if (body.containsKey("enableCash")) settings.setEnableCash(Boolean.parseBoolean(body.get("enableCash").toString()));
            settings.setUpdatedAt(OffsetDateTime.now());

            return ResponseEntity.ok(settingsRepository.save(settings));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to update settings"));
        }
    }
}
