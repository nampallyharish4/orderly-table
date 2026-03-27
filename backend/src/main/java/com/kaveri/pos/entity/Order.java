package com.kaveri.pos.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import jakarta.persistence.*;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "orders", indexes = {
    @Index(name = "idx_orders_status", columnList = "status"),
    @Index(name = "idx_orders_created_at", columnList = "created_at"),
    @Index(name = "idx_orders_visible_id", columnList = "visible_id")
})
public class Order {


    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    @JsonIgnore
    private Integer dbId;

    @Column(name = "visible_id", nullable = false, unique = true)
    private String visibleId;

    @Column(name = "order_number", nullable = false, unique = true)
    private String orderNumber;

    @Column(name = "order_type", nullable = false)
    private String orderType;

    @Column(name = "table_id")
    @JsonIgnore
    private Integer tableDbId;

    @Column(name = "table_number")
    private String tableNumber;

    @Column(name = "customer_name")
    private String customerName;

    @Column(name = "customer_phone")
    private String customerPhone;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "items", columnDefinition = "jsonb", nullable = false)
    private List<java.util.Map<String, Object>> items = new ArrayList<>();

    @Column(name = "subtotal", nullable = false)
    private Double subtotal = 0.0;

    @Column(name = "tax_amount", nullable = false)
    private Double taxAmount = 0.0;

    @Column(name = "service_charge", nullable = false)
    private Double serviceCharge = 0.0;

    @Column(name = "discount_amount", nullable = false)
    private Double discountAmount = 0.0;

    @Column(name = "total_amount", nullable = false)
    private Double totalAmount = 0.0;

    @Column(name = "status", nullable = false)
    private String status = "new";

    @Column(name = "order_status")
    private String orderStatus = "new";

    @Column(name = "payment_method")
    private String paymentMethod;

    @Column(name = "payment_status")
    private String paymentStatus;

    @Column(name = "payment_transaction_id")
    private String paymentTransactionId;

    @Column(name = "cash_amount")
    private Double cashAmount;

    @Column(name = "upi_amount")
    private Double upiAmount;

    @Column(name = "paid_at")
    private OffsetDateTime paidAt;

    @Column(name = "pickup_time")
    private OffsetDateTime pickupTime;

    @Column(name = "notes")
    private String notes;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @Column(name = "served_at")
    private OffsetDateTime servedAt;

    @Column(name = "created_by", nullable = false)
    private String createdBy;

    @Transient
    private Object payment;

    @Transient
    private String tableId;

    @JsonProperty("id")
    public String getId() { return visibleId; }

    public Integer getDbId() { return dbId; }
    public void setDbId(Integer dbId) { this.dbId = dbId; }
    public String getVisibleId() { return visibleId; }
    public void setVisibleId(String visibleId) { this.visibleId = visibleId; }
    public String getOrderNumber() { return orderNumber; }
    public void setOrderNumber(String orderNumber) { this.orderNumber = orderNumber; }
    public String getOrderType() { return orderType; }
    public void setOrderType(String orderType) { this.orderType = orderType; }
    public Integer getTableDbId() { return tableDbId; }
    public void setTableDbId(Integer tableDbId) { this.tableDbId = tableDbId; }
    public String getTableNumber() { return tableNumber; }
    public void setTableNumber(String tableNumber) { this.tableNumber = tableNumber; }
    public String getCustomerName() { return customerName; }
    public void setCustomerName(String customerName) { this.customerName = customerName; }
    public String getCustomerPhone() { return customerPhone; }
    public void setCustomerPhone(String customerPhone) { this.customerPhone = customerPhone; }
    public List<java.util.Map<String, Object>> getItems() { return items; }
    public void setItems(List<java.util.Map<String, Object>> items) { this.items = items; }
    public Double getSubtotal() { return subtotal; }
    public void setSubtotal(Double subtotal) { this.subtotal = subtotal; }
    public Double getTaxAmount() { return taxAmount; }
    public void setTaxAmount(Double taxAmount) { this.taxAmount = taxAmount; }
    public Double getServiceCharge() { return serviceCharge; }
    public void setServiceCharge(Double serviceCharge) { this.serviceCharge = serviceCharge; }
    public Double getDiscountAmount() { return discountAmount; }
    public void setDiscountAmount(Double discountAmount) { this.discountAmount = discountAmount; }
    public Double getTotalAmount() { return totalAmount; }
    public void setTotalAmount(Double totalAmount) { this.totalAmount = totalAmount; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public String getOrderStatus() { return orderStatus; }
    public void setOrderStatus(String orderStatus) { this.orderStatus = orderStatus; }
    public String getPaymentMethod() { return paymentMethod; }
    public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }
    public String getPaymentStatus() { return paymentStatus; }
    public void setPaymentStatus(String paymentStatus) { this.paymentStatus = paymentStatus; }
    public String getPaymentTransactionId() { return paymentTransactionId; }
    public void setPaymentTransactionId(String paymentTransactionId) { this.paymentTransactionId = paymentTransactionId; }
    public Double getCashAmount() { return cashAmount; }
    public void setCashAmount(Double cashAmount) { this.cashAmount = cashAmount; }
    public Double getUpiAmount() { return upiAmount; }
    public void setUpiAmount(Double upiAmount) { this.upiAmount = upiAmount; }
    public OffsetDateTime getPaidAt() { return paidAt; }
    public void setPaidAt(OffsetDateTime paidAt) { this.paidAt = paidAt; }
    public OffsetDateTime getPickupTime() { return pickupTime; }
    public void setPickupTime(OffsetDateTime pickupTime) { this.pickupTime = pickupTime; }
    public String getNotes() { return notes; }
    public void setNotes(String notes) { this.notes = notes; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }
    public OffsetDateTime getServedAt() { return servedAt; }
    public void setServedAt(OffsetDateTime servedAt) { this.servedAt = servedAt; }
    public String getCreatedBy() { return createdBy; }
    public void setCreatedBy(String createdBy) { this.createdBy = createdBy; }
    public Object getPayment() { return payment; }
    public void setPayment(Object payment) { this.payment = payment; }
    public String getTableId() { return tableId; }
    public void setTableId(String tableId) { this.tableId = tableId; }
}
