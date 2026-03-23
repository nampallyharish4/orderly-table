package com.kaveri.pos.controller;

import com.kaveri.pos.entity.MenuCategory;
import com.kaveri.pos.entity.MenuItem;
import com.kaveri.pos.repository.MenuCategoryRepository;
import com.kaveri.pos.repository.MenuItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
public class MenuController {

    @Autowired
    private MenuItemRepository menuItemRepository;

    @Autowired
    private MenuCategoryRepository menuCategoryRepository;

    @GetMapping("/api/categories")
    public ResponseEntity<List<MenuCategory>> getAllCategories() {
        try {
            return ResponseEntity.ok(menuCategoryRepository.findAll());
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }

    @GetMapping("/api/menu-items")
    public ResponseEntity<List<MenuItem>> getAllMenuItems() {
        try {
            List<MenuItem> items = menuItemRepository.findAll();
            List<MenuCategory> categories = menuCategoryRepository.findAll();
            Map<Integer, MenuCategory> categoryMap = new HashMap<>();
            for (MenuCategory cat : categories) {
                categoryMap.put(cat.getDbId(), cat);
            }
            for (MenuItem item : items) {
                MenuCategory cat = categoryMap.get(item.getCategoryDbId());
                if (cat != null) {
                    item.setCategoryId(cat.getVisibleId());
                    item.setCategory(cat.getName());
                }
            }
            return ResponseEntity.ok(items);
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }

    @PostMapping("/api/menu-items")
    public ResponseEntity<?> createMenuItem(@RequestBody Map<String, Object> body) {
        try {
            String categoryVisibleId = getString(body, "categoryId");
            Optional<MenuCategory> optCat = menuCategoryRepository.findByVisibleId(categoryVisibleId);
            if (optCat.isEmpty()) {
                return ResponseEntity.status(400).body(Map.of("error", "Invalid category"));
            }
            MenuCategory category = optCat.get();

            MenuItem item = new MenuItem();
            item.setVisibleId("item-" + System.currentTimeMillis());
            item.setCategoryDbId(category.getDbId());
            item.setName(getString(body, "name"));
            item.setDescription(getString(body, "description") != null ? getString(body, "description") : "");
            item.setPrice(toDouble(body.get("price")));
            item.setIsVeg(body.get("isVeg") != null && Boolean.parseBoolean(body.get("isVeg").toString()));
            item.setIsAvailable(body.get("isAvailable") == null || Boolean.parseBoolean(body.get("isAvailable").toString()));
            item.setAddOns(new ArrayList<>());
            item.setPreparationTime(body.get("preparationTime") != null ? Integer.parseInt(body.get("preparationTime").toString()) : 15);
            item.setSortOrder(0);
            item.setImageUrl(getString(body, "imageUrl"));

            MenuItem saved = menuItemRepository.save(item);
            saved.setCategoryId(category.getVisibleId());
            saved.setCategory(category.getName());
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to create menu item"));
        }
    }

    @PatchMapping("/api/menu-items/{id}")
    public ResponseEntity<?> updateMenuItem(@PathVariable String id, @RequestBody Map<String, Object> body) {
        try {
            Optional<MenuItem> optItem = menuItemRepository.findByVisibleId(id);
            if (optItem.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of("error", "Menu item not found"));
            }
            MenuItem item = optItem.get();

            if (body.containsKey("name")) item.setName(getString(body, "name"));
            if (body.containsKey("description")) item.setDescription(getString(body, "description"));
            if (body.containsKey("price")) item.setPrice(toDouble(body.get("price")));
            if (body.containsKey("isVeg")) item.setIsVeg(Boolean.parseBoolean(body.get("isVeg").toString()));
            if (body.containsKey("isAvailable")) item.setIsAvailable(Boolean.parseBoolean(body.get("isAvailable").toString()));
            if (body.containsKey("preparationTime")) item.setPreparationTime(Integer.parseInt(body.get("preparationTime").toString()));
            if (body.containsKey("imageUrl")) item.setImageUrl(getString(body, "imageUrl"));
            if (body.containsKey("categoryId") && body.get("categoryId") != null) {
                Optional<MenuCategory> optCat = menuCategoryRepository.findByVisibleId(body.get("categoryId").toString());
                optCat.ifPresent(cat -> item.setCategoryDbId(cat.getDbId()));
            }

            MenuItem saved = menuItemRepository.save(item);

            List<MenuCategory> categories = menuCategoryRepository.findAll();
            for (MenuCategory cat : categories) {
                if (cat.getDbId().equals(saved.getCategoryDbId())) {
                    saved.setCategoryId(cat.getVisibleId());
                    saved.setCategory(cat.getName());
                    break;
                }
            }

            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to update menu item"));
        }
    }

    @DeleteMapping("/api/menu-items/{id}")
    @Transactional
    public ResponseEntity<?> deleteMenuItem(@PathVariable String id) {
        try {
            Optional<MenuItem> optItem = menuItemRepository.findByVisibleId(id);
            if (optItem.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of("error", "Menu item not found"));
            }
            menuItemRepository.deleteByVisibleId(id);
            return ResponseEntity.ok(Map.of("success", true, "id", id));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to delete menu item"));
        }
    }

    private String getString(Map<String, Object> body, String key) {
        return body.get(key) != null ? body.get(key).toString() : null;
    }

    private Double toDouble(Object val) {
        if (val == null) return 0.0;
        try { return Double.parseDouble(val.toString()); } catch (Exception e) { return 0.0; }
    }
}
