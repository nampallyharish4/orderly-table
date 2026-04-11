package com.kaveri.pos.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class GroqService {

    @Value("${groq.api.key:}")
    private String apiKey;

    @Value("${groq.api.url:https://api.groq.com/openai/v1/chat/completions}")
    private String apiUrl;

    @Value("${groq.api.model:llama-3.1-8b-instant}")
    private String modelName;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public String getOrderRecommendations(String cartItems, String menuItems) {
        if (apiKey == null || apiKey.isEmpty()) {
            return "[]";
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);

            String prompt = "You are a smart restaurant POS assistant for an Indian restaurant. " +
                    "The customer currently has these items in their cart: " + cartItems + ". " +
                    "Here is the full menu: " + menuItems + ". " +
                    "Suggest 2-4 complementary items they should add to their order. " +
                    "Consider food pairing traditions (e.g., biryani with raita, curry with naan, meals with drinks). " +
                    "Return ONLY a JSON array of objects with: " +
                    "'name' (exact menu item name from the menu list), " +
                    "'reason' (short 5-8 word reason why it pairs well), " +
                    "'confidence' (integer 60-95 representing pairing strength percentage). " +
                    "Example: [{\"name\": \"Garlic Naan\", \"reason\": \"Perfect bread to scoop curry\", \"confidence\": 88}]. " +
                    "Only suggest items NOT already in the cart. " +
                    "Do NOT include any conversational text, ONLY the JSON array.";

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", modelName);
            requestBody.put("messages", List.of(Map.of("role", "user", "content", prompt)));
            requestBody.put("temperature", 0.3);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            String response = restTemplate.postForObject(apiUrl, entity, String.class);

            JsonNode root = objectMapper.readTree(response);
            String rawJsonResult = root.path("choices").path(0).path("message").path("content").asText().trim();

            if (rawJsonResult.startsWith("```json")) rawJsonResult = rawJsonResult.replace("```json", "");
            if (rawJsonResult.startsWith("```")) rawJsonResult = rawJsonResult.substring(3);
            if (rawJsonResult.endsWith("```")) rawJsonResult = rawJsonResult.substring(0, rawJsonResult.length() - 3);

            return rawJsonResult.trim();
        } catch (Exception e) {
            return "[]";
        }
    }

    private static final Logger logger = LoggerFactory.getLogger(GroqService.class);

    public String processVoiceTranscript(String text) {
        if (apiKey == null || apiKey.isEmpty()) {
            logger.warn("[GroqService] GROQ_API_KEY is not configured. Voice processing will return empty results.");
            return "[]";
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(apiKey);

            String prompt = "You are a Point of Sale (POS) backend assistant. " +
                    "Analyze this food order transcript: \"" + text + "\". " +
                    "Extract the items and quantities. " +
                    "Return ONLY a clean JSON array of objects with 'name' and 'quantity'. " +
                    "Example: [{\"name\": \"Burger\", \"quantity\": 2}, {\"name\": \"Pizza\", \"quantity\": 1}]. " +
                    "If no items are clear, return []. " +
                    "Do NOT include any conversational text, ONLY the JSON array.";

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", modelName);
            requestBody.put("messages", List.of(Map.of("role", "user", "content", prompt)));
            requestBody.put("temperature", 0.1);

            HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);
            logger.info("[GroqService] Sending voice transcript to Groq API (model: {})", modelName);
            String response = restTemplate.postForObject(apiUrl, entity, String.class);

            JsonNode root = objectMapper.readTree(response);
            String rawJsonResult = root.path("choices").path(0).path("message").path("content").asText().trim();
            
            // Basic clean up in case AI adds markdown wrappers
            if (rawJsonResult.startsWith("```json")) rawJsonResult = rawJsonResult.replace("```json", "");
            if (rawJsonResult.startsWith("```")) rawJsonResult = rawJsonResult.substring(3);
            if (rawJsonResult.endsWith("```")) rawJsonResult = rawJsonResult.substring(0, rawJsonResult.length() - 3);
            
            logger.info("[GroqService] Voice processing result: {}", rawJsonResult.trim());
            return rawJsonResult.trim();
        } catch (Exception e) {
            logger.error("[GroqService] Voice processing failed: {}", e.getMessage(), e);
            return "[]";
        }
    }
}
