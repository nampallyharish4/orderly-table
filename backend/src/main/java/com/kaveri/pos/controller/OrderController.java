package com.kaveri.pos.controller;

import com.kaveri.pos.entity.Order;
import com.kaveri.pos.entity.RestaurantTable;
import com.kaveri.pos.repository.OrderRepository;
import com.kaveri.pos.repository.TableRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.interceptor.TransactionAspectSupport;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.*;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private TableRepository tableRepository;

    @GetMapping
    public ResponseEntity<List<Order>> getAllOrders(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String since) {
        try {
            List<Order> orders;
            if (since != null && !since.isEmpty()) {
                OffsetDateTime lastUpdated = OffsetDateTime.parse(since);
                orders = orderRepository.findByUpdatedAtAfterOrderByUpdatedAtDesc(lastUpdated);
            } else if (status != null && !status.isEmpty()) {
                List<String> statuses = Arrays.asList(status.split(","));
                orders = orderRepository.findByStatusInOrderByCreatedAtDesc(statuses);
            } else {
                orders = orderRepository.findAllByOrderByCreatedAtDesc();
            }
            
            for (Order order : orders) {
                if (order.getPaymentMethod() != null) {
                    Map<String, Object> payment = new LinkedHashMap<>();
                    payment.put("id", "pay-" + order.getDbId());
                    payment.put("orderId", order.getVisibleId());
                    payment.put("method", order.getPaymentMethod());
                    payment.put("amount", order.getTotalAmount());
                    payment.put("cashAmount", order.getCashAmount());
                    payment.put("upiAmount", order.getUpiAmount());
                    payment.put("status", order.getPaymentStatus() != null ? order.getPaymentStatus() : "completed");
                    payment.put("paidAt", order.getPaidAt());
                    order.setPayment(payment);
                }
            }
            return ResponseEntity.ok(orders);
        } catch (Exception e) {
            e.printStackTrace();
            return ResponseEntity.status(500).build();
        }
    }

    @PostMapping
    @Transactional
    @SuppressWarnings("unchecked")
    public ResponseEntity<?> createOrder(@RequestBody Map<String, Object> body) {
        try {
            String tableVisibleId = getString(body, "tableId");
            boolean expressCheckout = body.containsKey("expressCheckout") && Boolean.TRUE.equals(body.get("expressCheckout"));

            Optional<Order> existingOrder = findExistingOrder(body);
            if (existingOrder.isPresent()) {
                return ResponseEntity.ok(existingOrder.get());
            }

            Order order = buildOrder(body, expressCheckout);
            Order saved = orderRepository.save(order);
            synchronizeTableForOrder(saved, tableVisibleId);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            Map<String, String> err = new HashMap<>();
            err.put("error", "Failed to create order");
            err.put("details", e.getMessage());
            return ResponseEntity.status(500).body(err);
        }
    }

    @PostMapping("/checkout")
    @Transactional
    public ResponseEntity<?> createAndCollectCash(@RequestBody Map<String, Object> body) {
        try {
            String tableVisibleId = getString(body, "tableId");

            Optional<Order> existingOrder = findExistingOrder(body);
            if (existingOrder.isPresent()) {
                return ResponseEntity.ok(existingOrder.get());
            }

            Order order = buildOrder(body, true);
            Order saved = orderRepository.save(order);
            synchronizeTableForOrder(saved, tableVisibleId);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            TransactionAspectSupport.currentTransactionStatus().setRollbackOnly();
            return ResponseEntity.status(500).body(Map.of(
                    "error", "Failed to complete order checkout",
                    "details", e.getMessage()
            ));
        }
    }

    @PatchMapping("/{id}")
    @SuppressWarnings("unchecked")
    public ResponseEntity<?> updateOrder(@PathVariable String id, @RequestBody Map<String, Object> body) {
        try {
            Optional<Order> optOrder = orderRepository.findByVisibleId(id);
            if (optOrder.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of("error", "Order not found"));
            }
            Order order = optOrder.get();

            if (body.containsKey("status")) setOrderStatuses(order, body.get("status").toString());
            if (body.containsKey("items")) order.setItems((List<Map<String, Object>>) body.get("items"));
            if (body.containsKey("paymentMethod") && body.get("paymentMethod") != null)
                order.setPaymentMethod(body.get("paymentMethod").toString());
            if (body.containsKey("paymentStatus") && body.get("paymentStatus") != null)
                order.setPaymentStatus(body.get("paymentStatus").toString());
            if (body.containsKey("cashAmount")) order.setCashAmount(toDouble(body.get("cashAmount")));
            if (body.containsKey("upiAmount")) order.setUpiAmount(toDouble(body.get("upiAmount")));
            if (body.containsKey("paidAt") && body.get("paidAt") != null)
                order.setPaidAt(OffsetDateTime.parse(body.get("paidAt").toString()));
            if (body.containsKey("servedAt") && body.get("servedAt") != null)
                order.setServedAt(OffsetDateTime.parse(body.get("servedAt").toString()));
            if (body.containsKey("subtotal")) order.setSubtotal(toDouble(body.get("subtotal")));
            if (body.containsKey("taxAmount")) order.setTaxAmount(toDouble(body.get("taxAmount")));
            if (body.containsKey("serviceCharge")) order.setServiceCharge(toDouble(body.get("serviceCharge")));
            if (body.containsKey("discountAmount")) order.setDiscountAmount(toDouble(body.get("discountAmount")));
            if (body.containsKey("totalAmount")) order.setTotalAmount(toDouble(body.get("totalAmount")));
            order.setUpdatedAt(OffsetDateTime.now());

            Order saved = orderRepository.save(order);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to update order"));
        }
    }

    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<?> deleteOrder(@PathVariable String id) {
        try {
            orderRepository.deleteByVisibleId(id);
            return ResponseEntity.ok(Map.of("success", true));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to delete order"));
        }
    }

    private String getString(Map<String, Object> body, String key) {
        return body.get(key) != null ? body.get(key).toString() : null;
    }

    private Optional<Order> findExistingOrder(Map<String, Object> body) {
        String visibleId = getString(body, "id");
        if (visibleId != null && !visibleId.isBlank()) {
            Optional<Order> existingById = orderRepository.findByVisibleId(visibleId);
            if (existingById.isPresent()) {
                return existingById;
            }
        }

        String orderNumber = getString(body, "orderNumber");
        if (orderNumber != null && !orderNumber.isBlank()) {
            return orderRepository.findByOrderNumber(orderNumber);
        }

        return Optional.empty();
    }

    @SuppressWarnings("unchecked")
    private Order buildOrder(Map<String, Object> body, boolean collectCashNow) {
        String visibleId = body.containsKey("id") && body.get("id") != null
                ? body.get("id").toString()
                : "order-" + System.currentTimeMillis();

        Integer tableDbId = null;
        if (body.get("tableId") != null) {
            String tableIdStr = body.get("tableId").toString();
            if (tableIdStr.startsWith("table-")) {
                try {
                    tableDbId = Integer.parseInt(tableIdStr.replace("table-", ""));
                } catch (NumberFormatException ignored) {
                }
            } else {
                try {
                    tableDbId = Integer.parseInt(tableIdStr);
                } catch (NumberFormatException ignored) {
                }
            }
        }

        Order order = new Order();
        order.setVisibleId(visibleId);
        order.setOrderNumber(getString(body, "orderNumber"));
        order.setOrderType(getString(body, "orderType"));
        order.setTableDbId(tableDbId);
        order.setTableId(getString(body, "tableId"));
        order.setTableNumber(getString(body, "tableNumber"));
        order.setCustomerName(getString(body, "customerName"));
        order.setCustomerPhone(getString(body, "customerPhone"));
        order.setItems(body.get("items") != null ? (List<Map<String, Object>>) body.get("items") : new ArrayList<>());
        order.setSubtotal(toDouble(body.get("subtotal")));
        order.setTaxAmount(toDouble(body.get("taxAmount")));
        order.setServiceCharge(toDouble(body.get("serviceCharge")));
        order.setDiscountAmount(toDouble(body.get("discountAmount")));
        order.setTotalAmount(toDouble(body.get("totalAmount")));
        order.setNotes(getString(body, "notes"));
        order.setCreatedBy(body.get("createdBy") != null ? body.get("createdBy").toString() : "system");

        OffsetDateTime now = OffsetDateTime.now();
        order.setCreatedAt(now);
        order.setUpdatedAt(now);

        if (collectCashNow) {
            setOrderStatuses(order, "collected");
            order.setPaymentMethod("cash");
            order.setPaymentStatus("completed");
            order.setCashAmount(order.getTotalAmount());
            order.setPaidAt(now);
            order.setServedAt(now);
        } else {
            setOrderStatuses(order, body.get("status") != null ? body.get("status").toString() : "new");
        }

        return order;
    }

    private void synchronizeTableForOrder(Order order, String tableVisibleId) {
        if (tableVisibleId == null || tableVisibleId.isBlank()) {
            return;
        }

        RestaurantTable table = tableRepository.findByVisibleId(tableVisibleId)
                .orElseThrow(() -> new IllegalArgumentException("Table not found for id: " + tableVisibleId));

        List<String> currentOrderIds = new ArrayList<>(
                table.getCurrentOrderIds() != null ? table.getCurrentOrderIds() : List.of()
        );

        if ("collected".equals(order.getStatus())) {
            currentOrderIds.remove(order.getVisibleId());
            table.setStatus(currentOrderIds.isEmpty() ? "available" : "occupied");
        } else {
            if (!currentOrderIds.contains(order.getVisibleId())) {
                currentOrderIds.add(order.getVisibleId());
            }
            table.setStatus("occupied");
        }

        table.setCurrentOrderIds(currentOrderIds);
        tableRepository.save(table);
    }

    private Double toDouble(Object val) {
        if (val == null) return 0.0;
        try { return Double.parseDouble(val.toString()); } catch (Exception e) { return 0.0; }
    }

    private void setOrderStatuses(Order order, String status) {
        order.setStatus(status);
        order.setOrderStatus(status);
    }
}
