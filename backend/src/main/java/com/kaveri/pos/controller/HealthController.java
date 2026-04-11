package com.kaveri.pos.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/health")
public class HealthController {

    private static final Logger logger = LoggerFactory.getLogger(HealthController.class);

    @Autowired(required = false)
    private JdbcTemplate jdbcTemplate;

    @Value("${groq.api.key:}")
    private String groqApiKey;

    /**
     * Returns health status of all critical services
     */
    @GetMapping
    public ResponseEntity<?> getHealth() {
        try {
            Map<String, Object> health = new LinkedHashMap<>();
            health.put("status", "healthy");
            health.put("timestamp", System.currentTimeMillis());

            // Database health
            Map<String, Object> dbHealth = checkDatabaseHealth();
            health.put("database", dbHealth);

            // AI health
            Map<String, Object> aiHealth = checkAIHealth();
            health.put("ai", aiHealth);

            // Overall status
            boolean dbHealthy = "healthy".equals(dbHealth.get("status"));
            boolean aiHealthy = "healthy".equals(aiHealth.get("status"));
            String overallStatus = (dbHealthy && aiHealthy) ? "healthy" : (dbHealthy ? "degraded" : "unhealthy");
            health.put("status", overallStatus);

            int statusCode = "healthy".equals(overallStatus) ? 200 : ("degraded".equals(overallStatus) ? 200 : 503);
            return ResponseEntity.status(statusCode).body(health);
        } catch (Exception e) {
            logger.error("[HealthController] Health check error", e);
            Map<String, Object> error = new LinkedHashMap<>();
            error.put("status", "unhealthy");
            error.put("error", e.getMessage());
            error.put("timestamp", System.currentTimeMillis());
            return ResponseEntity.status(503).body(error);
        }
    }

    /**
     * Checks database connectivity and basic query performance
     */
    private Map<String, Object> checkDatabaseHealth() {
        Map<String, Object> dbHealth = new LinkedHashMap<>();
        long startTime = System.currentTimeMillis();

        try {
            if (jdbcTemplate == null) {
                dbHealth.put("status", "unhealthy");
                dbHealth.put("message", "JdbcTemplate not configured");
                dbHealth.put("responseTime", 0);
                logger.warn("[HealthController] JdbcTemplate not available");
                return dbHealth;
            }

            // Test query to check connection and query execution
            jdbcTemplate.queryForObject("SELECT 1", Integer.class);

            long responseTime = System.currentTimeMillis() - startTime;
            dbHealth.put("status", "healthy");
            dbHealth.put("message", "Database connection OK");
            dbHealth.put("responseTime", responseTime);

            logger.debug("[HealthController] Database health OK ({}ms)", responseTime);
        } catch (Exception e) {
            long responseTime = System.currentTimeMillis() - startTime;
            dbHealth.put("status", "unhealthy");
            dbHealth.put("message", "Database connection failed: " + e.getMessage());
            dbHealth.put("responseTime", responseTime);

            logger.error("[HealthController] Database health check failed", e);
        }

        return dbHealth;
    }

    /**
     * Checks AI service configuration (Groq API key)
     */
    private Map<String, Object> checkAIHealth() {
        Map<String, Object> aiHealth = new LinkedHashMap<>();

        try {
            if (groqApiKey == null || groqApiKey.trim().isEmpty()) {
                aiHealth.put("status", "warning");
                aiHealth.put("message", "Groq API key not configured");
                aiHealth.put("configured", false);
                logger.warn("[HealthController] AI service (Groq) not configured");
            } else {
                // API key is configured
                aiHealth.put("status", "healthy");
                aiHealth.put("message", "Groq API key configured");
                aiHealth.put("configured", true);
                logger.debug("[HealthController] AI service configured");
            }
        } catch (Exception e) {
            aiHealth.put("status", "warning");
            aiHealth.put("message", "AI service check error: " + e.getMessage());
            aiHealth.put("configured", false);
            logger.error("[HealthController] AI health check error", e);
        }

        return aiHealth;
    }
}
