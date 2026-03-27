package com.kaveri.pos.controller;

import com.kaveri.pos.entity.Order;
import com.kaveri.pos.repository.OrderRepository;
import com.kaveri.pos.service.GroqService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/ai")
public class AIController {

    private static final Logger logger = LoggerFactory.getLogger(AIController.class);

    @Autowired
    private GroqService groqService;

    @Autowired
    private OrderRepository orderRepository;

    @PostMapping("/voice-process")
    public ResponseEntity<?> voiceProcess(@RequestBody Map<String, String> body) {
        String transcript = body.get("text");
        if (transcript == null || transcript.isEmpty()) {
            logger.warn("[AIController] Empty voice transcript received");
            return ResponseEntity.ok("[]");
        }

        try {
            logger.info("[AIController] Processing voice: {}", transcript);
            String aiResult = groqService.processVoiceTranscript(transcript);
            logger.info("[AIController] Voice result: {}", aiResult);
            return ResponseEntity.ok(aiResult);
        } catch (Exception e) {
            logger.error("[AIController] Voice processing error", e);
            return ResponseEntity.ok("[]");
        }
    }

    /**
     * Analyzes past order history to find items frequently ordered together
     * with the current cart items. Returns data-driven pairing suggestions
     * with real co-occurrence percentages.
     * 
     * Fallback: If not enough historical data, returns popular items or
     * items from complementary categories.
     */
    @PostMapping("/recommendations")
    public ResponseEntity<?> getRecommendations(@RequestBody Map<String, Object> body) {
        @SuppressWarnings("unchecked")
        List<String> cartItemNames = (List<String>) body.get("cartItemNames");

        if (cartItemNames == null || cartItemNames.isEmpty()) {
            logger.info("[AIController] Recommendations requested with empty cart");
            return ResponseEntity.ok(List.of());
        }

        try {
            logger.info("[AIController] Fetching recommendations for: {}", cartItemNames);
            
            // Get all completed/served orders for analysis
            List<Order> allOrders = orderRepository.findAllByOrderByCreatedAtDesc();
            logger.info("[AIController] Analyzing {} orders for recommendations", allOrders.size());

            // Build co-occurrence map: for each cart item, find what other items
            // appear in the same orders and count frequency
            Set<String> cartSet = cartItemNames.stream()
                    .map(String::toLowerCase)
                    .collect(Collectors.toSet());

            // Map: suggestedItemName -> { coCount, totalOrdersWithCartItem }
            Map<String, int[]> coOccurrenceMap = new HashMap<>();
            int ordersContainingCartItems = 0;

            for (Order order : allOrders) {
                List<Map<String, Object>> items = order.getItems();
                if (items == null || items.isEmpty()) continue;

                // Get item names in this order
                Set<String> orderItemNames = items.stream()
                        .map(item -> {
                            Object name = item.get("menuItemName");
                            return name != null ? name.toString().toLowerCase() : "";
                        })
                        .filter(name -> !name.isEmpty())
                        .collect(Collectors.toSet());

                // Check if this order contains any of our cart items
                boolean hasCartItem = orderItemNames.stream().anyMatch(cartSet::contains);
                if (!hasCartItem) continue;

                ordersContainingCartItems++;

                // Count co-occurrences of non-cart items
                for (String orderItemName : orderItemNames) {
                    if (cartSet.contains(orderItemName)) continue; // skip cart items themselves

                    // Find the original cased name from the order
                    String originalName = items.stream()
                            .map(item -> item.get("menuItemName"))
                            .filter(Objects::nonNull)
                            .map(Object::toString)
                            .filter(n -> n.toLowerCase().equals(orderItemName))
                            .findFirst()
                            .orElse(orderItemName);

                    coOccurrenceMap.computeIfAbsent(originalName, k -> new int[]{0, 0});
                    coOccurrenceMap.get(originalName)[0]++; // co-occurrence count
                }
            }

            logger.info("[AIController] Found {} orders containing cart items", ordersContainingCartItems);
            logger.info("[AIController] Co-occurrence map size: {}", coOccurrenceMap.size());

            // Calculate pair rates and sort by frequency
            final int totalWithCart = ordersContainingCartItems;

            List<Map<String, Object>> suggestions = coOccurrenceMap.entrySet().stream()
                    .filter(e -> e.getValue()[0] >= 2) // minimum 2 co-occurrences
                    .map(e -> {
                        Map<String, Object> suggestion = new LinkedHashMap<>();
                        suggestion.put("name", e.getKey());
                        suggestion.put("coOrderCount", e.getValue()[0]);
                        suggestion.put("totalOrders", totalWithCart);
                        int pairRate = totalWithCart > 0
                                ? Math.round((float) e.getValue()[0] / totalWithCart * 100)
                                : 0;
                        suggestion.put("pairRate", pairRate);
                        return suggestion;
                    })
                    .sorted((a, b) -> Integer.compare(
                            (int) b.get("coOrderCount"),
                            (int) a.get("coOrderCount")
                    ))
                    .limit(4)
                    .collect(Collectors.toList());

            logger.info("[AIController] Returning {} recommendations from history", suggestions.size());
            
            // If no historical recommendations available, suggest popular items as fallback
            if (suggestions.isEmpty()) {
                logger.info("[AIController] No historical data - using fallback recommendations");
                // Create a simple fallback: suggest items that appear frequently in all orders
                suggestions = allOrders.stream()
                        .flatMap(order -> {
                            List<Map<String, Object>> items = order.getItems();
                            return items != null ? items.stream() : java.util.stream.Stream.empty();
                        })
                        .map(item -> {
                            Object name = item.get("menuItemName");
                            return name != null ? name.toString() : null;
                        })
                        .filter(Objects::nonNull)
                        .filter(name -> !cartSet.contains(name.toString().toLowerCase()))
                        .collect(Collectors.groupingBy(
                                Object::toString,
                                Collectors.counting()
                        ))
                        .entrySet().stream()
                        .filter(e -> e.getValue() >= 1)
                        .sorted((a, b) -> Long.compare(b.getValue(), a.getValue()))
                        .limit(4)
                        .map(e -> {
                            Map<String, Object> suggestion = new LinkedHashMap<>();
                            suggestion.put("name", e.getKey());
                            suggestion.put("coOrderCount", Math.toIntExact(e.getValue()));
                            suggestion.put("totalOrders", allOrders.size());
                            suggestion.put("pairRate", allOrders.size() > 0 
                                ? Math.round((float) e.getValue() / allOrders.size() * 100)
                                : 0);
                            return suggestion;
                        })
                        .collect(Collectors.toList());
                        
                logger.info("[AIController] Fallback returning {} recommendations", suggestions.size());
            }
            
            return ResponseEntity.ok(suggestions);
        } catch (Exception e) {
            logger.error("[AIController] Error analyzing order history", e);
            return ResponseEntity.ok(List.of());
        }
    }
}
