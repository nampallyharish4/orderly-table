package com.kaveri.pos.controller;

import com.kaveri.pos.entity.Order;
import com.kaveri.pos.entity.RestaurantTable;
import com.kaveri.pos.repository.OrderRepository;
import com.kaveri.pos.repository.TableRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.TransactionStatus;
import org.springframework.transaction.annotation.EnableTransactionManagement;
import org.springframework.transaction.support.SimpleTransactionStatus;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.Optional;

import static org.hamcrest.Matchers.containsString;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(OrderController.class)
@Import(OrderCheckoutControllerTest.TestTransactionConfig.class)
class OrderCheckoutControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private OrderRepository orderRepository;

    @MockBean
    private TableRepository tableRepository;

    @Test
    void checkout_shouldCreateAndCollectCashInSingleRequest() throws Exception {
        when(orderRepository.findByVisibleId("order-1001")).thenReturn(Optional.empty());
        when(orderRepository.findByOrderNumber("ORD-1001")).thenReturn(Optional.empty());
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> {
            Order saved = invocation.getArgument(0);
            saved.setDbId(1001);
            return saved;
        });

        RestaurantTable table = new RestaurantTable();
        table.setVisibleId("table-1");
        table.setStatus("occupied");
        table.setCurrentOrderIds(new ArrayList<>());
        when(tableRepository.findByVisibleId("table-1")).thenReturn(Optional.of(table));
        when(tableRepository.save(any(RestaurantTable.class))).thenAnswer(invocation -> invocation.getArgument(0));

        mockMvc.perform(post("/api/orders/checkout")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(checkoutRequest("order-1001", "ORD-1001", "table-1")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("order-1001"))
                .andExpect(jsonPath("$.orderNumber").value("ORD-1001"))
                .andExpect(jsonPath("$.status").value("collected"))
                .andExpect(jsonPath("$.paymentMethod").value("cash"))
                .andExpect(jsonPath("$.paymentStatus").value("completed"));

        verify(orderRepository, times(1)).save(any(Order.class));
        verify(tableRepository, times(1)).save(any(RestaurantTable.class));
    }

    @Test
    void checkout_shouldBeIdempotent_whenOrderAlreadyExists() throws Exception {
        Order existingOrder = buildExistingOrder("order-1002", "ORD-1002");
        when(orderRepository.findByVisibleId("order-1002")).thenReturn(Optional.of(existingOrder));

        mockMvc.perform(post("/api/orders/checkout")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(checkoutRequest("order-1002", "ORD-1002", "table-2")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value("order-1002"))
                .andExpect(jsonPath("$.orderNumber").value("ORD-1002"))
                .andExpect(jsonPath("$.status").value("collected"));

        verify(orderRepository, never()).save(any(Order.class));
        verifyNoInteractions(tableRepository);
    }

    @Test
    void checkout_shouldReturnError_whenTableSyncFails() throws Exception {
        when(orderRepository.findByVisibleId("order-1003")).thenReturn(Optional.empty());
        when(orderRepository.findByOrderNumber("ORD-1003")).thenReturn(Optional.empty());
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));
        when(tableRepository.findByVisibleId("table-missing")).thenReturn(Optional.empty());

        mockMvc.perform(post("/api/orders/checkout")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(checkoutRequest("order-1003", "ORD-1003", "table-missing")))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.error").value("Failed to complete order checkout"))
                .andExpect(jsonPath("$.details", containsString("Table not found")));

        verify(orderRepository, times(1)).save(any(Order.class));
    }

    private static Order buildExistingOrder(String id, String orderNumber) {
        Order order = new Order();
        OffsetDateTime now = OffsetDateTime.now();
        order.setVisibleId(id);
        order.setOrderNumber(orderNumber);
        order.setOrderType("dine-in");
        order.setStatus("collected");
        order.setPaymentMethod("cash");
        order.setPaymentStatus("completed");
        order.setSubtotal(300.0);
        order.setTaxAmount(15.0);
        order.setServiceCharge(0.0);
        order.setDiscountAmount(0.0);
        order.setTotalAmount(315.0);
        order.setCashAmount(315.0);
        order.setCreatedBy("tester");
        order.setCreatedAt(now);
        order.setUpdatedAt(now);
        order.setPaidAt(now);
        order.setServedAt(now);
        return order;
    }

    private static String checkoutRequest(String id, String orderNumber, String tableId) {
        return """
                {
                  "id": "%s",
                  "orderNumber": "%s",
                  "orderType": "dine-in",
                  "tableId": "%s",
                  "tableNumber": "T1",
                  "customerName": "Walk In",
                  "items": [
                    {
                      "id": "oi-1",
                      "menuItemId": "m-1",
                      "menuItemName": "Paneer Tikka",
                      "quantity": 1,
                      "unitPrice": 300,
                      "totalPrice": 300,
                      "addOns": [],
                      "status": "pending",
                      "isVeg": true
                    }
                  ],
                  "subtotal": 300,
                  "taxAmount": 15,
                  "serviceCharge": 0,
                  "discountAmount": 0,
                  "totalAmount": 315,
                  "createdBy": "cashier"
                }
                """.formatted(id, orderNumber, tableId);
    }

    @TestConfiguration
    @EnableTransactionManagement
    static class TestTransactionConfig {
        @Bean
        PlatformTransactionManager transactionManager() {
            return new PlatformTransactionManager() {
                @Override
                public TransactionStatus getTransaction(TransactionDefinition definition) {
                    return new SimpleTransactionStatus();
                }

                @Override
                public void commit(TransactionStatus status) {
                    // No-op transaction for controller tests.
                }

                @Override
                public void rollback(TransactionStatus status) {
                    // No-op transaction for controller tests.
                }
            };
        }
    }
}
