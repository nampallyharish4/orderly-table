package com.kaveri.pos.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import io.hypersistence.utils.hibernate.type.json.JsonBinaryType;
import jakarta.persistence.*;
import org.hibernate.annotations.Type;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "tables")
public class RestaurantTable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    @JsonIgnore
    private Integer dbId;

    @Column(name = "visible_id", nullable = false, unique = true)
    private String visibleId;

    @Column(name = "table_number", nullable = false, unique = true)
    private String tableNumber;

    @Column(name = "capacity", nullable = false)
    private Integer capacity;

    @Column(name = "floor", nullable = false)
    private String floor;

    @Column(name = "status", nullable = false)
    private String status = "available";

    @Type(JsonBinaryType.class)
    @Column(name = "current_order_ids", columnDefinition = "jsonb", nullable = false)
    private List<String> currentOrderIds = new ArrayList<>();

    @JsonProperty("id")
    public String getId() { return visibleId; }

    public Integer getDbId() { return dbId; }
    public void setDbId(Integer dbId) { this.dbId = dbId; }
    public String getVisibleId() { return visibleId; }
    public void setVisibleId(String visibleId) { this.visibleId = visibleId; }
    public String getTableNumber() { return tableNumber; }
    public void setTableNumber(String tableNumber) { this.tableNumber = tableNumber; }
    public Integer getCapacity() { return capacity; }
    public void setCapacity(Integer capacity) { this.capacity = capacity; }
    public String getFloor() { return floor; }
    public void setFloor(String floor) { this.floor = floor; }
    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
    public List<String> getCurrentOrderIds() { return currentOrderIds; }
    public void setCurrentOrderIds(List<String> currentOrderIds) { this.currentOrderIds = currentOrderIds; }
}
