package com.kaveri.pos.controller;

import com.kaveri.pos.entity.Order;
import com.kaveri.pos.repository.OrderRepository;
import com.kaveri.pos.service.GroqService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/ai")
public class AIController {

    @Autowired
    private GroqService groqService;

    @Autowired
    private OrderRepository orderRepository;

    @PostMapping("/voice-process")
    public ResponseEntity<?> voiceProcess(@RequestBody Map<String, String> body) {
        String transcript = body.get("text");
        if (transcript == null || transcript.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Empty voice transcript text."));
        }

        try {
            String aiResult = groqService.processVoiceTranscript(transcript);
            return ResponseEntity.ok(aiResult);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error: " + e.getMessage());
        }
    }

    /**
     * Analyzes past order history to find items frequently ordered together
     * with the current cart items. Returns data-driven pairing suggestions
     * with real co-occurrence percentages.
     */
    @PostMapping("/recommendations")
    public ResponseEntity<?> getRecommendations(@RequestBody Map<String, Object> body) {
        @SuppressWarnings("unchecked")
        List<String> cartItemNames = (List<String>) body.get("cartItemNames");

        if (cartItemNames == null || cartItemNames.isEmpty()) {
            return ResponseEntity.ok(List.of());
        }

        try {
            // Get all completed/served orders for analysis
            List<Order> allOrders = orderRepository.findAllByOrderByCreatedAtDesc();

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

            return ResponseEntity.ok(suggestions);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to analyze order history: " + e.getMessage()));
        }
    }
}
