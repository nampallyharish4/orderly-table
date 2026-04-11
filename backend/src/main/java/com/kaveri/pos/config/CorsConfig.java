package com.kaveri.pos.config;

// CORS is now handled by SecurityConfig's CorsConfigurationSource bean.
// This class is intentionally left empty to avoid conflicts with Spring Security's filter chain.
// See com.kaveri.pos.security.SecurityConfig for CORS configuration.

import org.springframework.context.annotation.Configuration;

@Configuration
public class CorsConfig {
    // No-op — CORS is configured in SecurityConfig to work correctly with Spring Security.
}
