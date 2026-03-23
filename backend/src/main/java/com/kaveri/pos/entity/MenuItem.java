package com.kaveri.pos.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import io.hypersistence.utils.hibernate.type.json.JsonBinaryType;
import jakarta.persistence.*;
import org.hibernate.annotations.Type;

import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "menu_items")
public class MenuItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    @JsonIgnore
    private Integer dbId;

    @Column(name = "visible_id", nullable = false, unique = true)
    private String visibleId;

    @Column(name = "category_id", nullable = false)
    @JsonIgnore
    private Integer categoryDbId;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "description")
    private String description;

    @Column(name = "price", nullable = false)
    private Double price;

    @Column(name = "image_url")
    private String imageUrl;

    @Column(name = "is_veg", nullable = false)
    private Boolean isVeg = false;

    @Column(name = "is_available", nullable = false)
    private Boolean isAvailable = true;

    @Type(JsonBinaryType.class)
    @Column(name = "add_ons", columnDefinition = "jsonb", nullable = false)
    private List<Object> addOns = new ArrayList<>();

    @Column(name = "preparation_time")
    private Integer preparationTime;

    @Column(name = "sort_order", nullable = false)
    private Integer sortOrder = 0;

    @Transient
    private String categoryId;

    @Transient
    private String category;

    @JsonProperty("id")
    public String getId() { return visibleId; }

    public Integer getDbId() { return dbId; }
    public void setDbId(Integer dbId) { this.dbId = dbId; }
    public String getVisibleId() { return visibleId; }
    public void setVisibleId(String visibleId) { this.visibleId = visibleId; }
    public Integer getCategoryDbId() { return categoryDbId; }
    public void setCategoryDbId(Integer categoryDbId) { this.categoryDbId = categoryDbId; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public Double getPrice() { return price; }
    public void setPrice(Double price) { this.price = price; }
    public String getImageUrl() { return imageUrl; }
    public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    public Boolean getIsVeg() { return isVeg; }
    public void setIsVeg(Boolean isVeg) { this.isVeg = isVeg; }
    public Boolean getIsAvailable() { return isAvailable; }
    public void setIsAvailable(Boolean isAvailable) { this.isAvailable = isAvailable; }
    public List<Object> getAddOns() { return addOns; }
    public void setAddOns(List<Object> addOns) { this.addOns = addOns; }
    public Integer getPreparationTime() { return preparationTime; }
    public void setPreparationTime(Integer preparationTime) { this.preparationTime = preparationTime; }
    public Integer getSortOrder() { return sortOrder; }
    public void setSortOrder(Integer sortOrder) { this.sortOrder = sortOrder; }
    public String getCategoryId() { return categoryId; }
    public void setCategoryId(String categoryId) { this.categoryId = categoryId; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
}
