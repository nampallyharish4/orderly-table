package com.kaveri.pos.entity;

import jakarta.persistence.*;


import java.time.OffsetDateTime;

@Entity
@Table(name = "settings")
public class AppSettings {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    private Integer id;

    @Column(name = "restaurant_name", nullable = false)
    private String restaurantName = "Kaveri Family Restaurant";

    @Column(name = "address", nullable = false)
    private String address = "123 Main Street, City";

    @Column(name = "phone", nullable = false)
    private String phone = "+91 9876543210";

    @Column(name = "email", nullable = false)
    private String email = "contact@kaveri.com";

    @Column(name = "enable_notifications", nullable = false)
    private Boolean enableNotifications = true;

    @Column(name = "enable_sounds", nullable = false)
    private Boolean enableSounds = true;

    @Column(name = "auto_print_bills", nullable = false)
    private Boolean autoPrintBills = false;

    @Column(name = "enable_upi", nullable = false)
    private Boolean enableUPI = true;

    @Column(name = "enable_cash", nullable = false)
    private Boolean enableCash = true;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    public Integer getId() { return id; }
    public void setId(Integer id) { this.id = id; }
    public String getRestaurantName() { return restaurantName; }
    public void setRestaurantName(String restaurantName) { this.restaurantName = restaurantName; }
    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }
    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public Boolean getEnableNotifications() { return enableNotifications; }
    public void setEnableNotifications(Boolean enableNotifications) { this.enableNotifications = enableNotifications; }
    public Boolean getEnableSounds() { return enableSounds; }
    public void setEnableSounds(Boolean enableSounds) { this.enableSounds = enableSounds; }
    public Boolean getAutoPrintBills() { return autoPrintBills; }
    public void setAutoPrintBills(Boolean autoPrintBills) { this.autoPrintBills = autoPrintBills; }
    public Boolean getEnableUPI() { return enableUPI; }
    public void setEnableUPI(Boolean enableUPI) { this.enableUPI = enableUPI; }
    public Boolean getEnableCash() { return enableCash; }
    public void setEnableCash(Boolean enableCash) { this.enableCash = enableCash; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }
}
