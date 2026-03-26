package com.kaveri.pos.config;

import com.kaveri.pos.entity.MenuItem;
import com.kaveri.pos.repository.MenuItemRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
public class DataSeeder implements CommandLineRunner {

    @Autowired
    private com.kaveri.pos.repository.MenuCategoryRepository menuCategoryRepository;

    @Autowired
    private MenuItemRepository menuItemRepository;

    @Override
    public void run(String... args) throws Exception {
        System.out.println("--- Starting Menu Item Image Seeding ---");
        
        Map<String, String> itemImages = new HashMap<>();
        // Manchuria Items
        itemImages.put("Veg Manchuria", "https://images.unsplash.com/photo-1631452100871-33758b29c9cc?q=80&w=800&auto=format&fit=crop");
        itemImages.put("Gobi Manchuria", "https://images.unsplash.com/photo-1606471191009-63994c53433b?q=80&w=800&auto=format&fit=crop");
        itemImages.put("Paneer Manchuria", "https://images.unsplash.com/photo-1565557623262-b51c2513a641?q=80&w=800&auto=format&fit=crop");
        
        // Paneer Items
        itemImages.put("Paneer Tikka", "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?q=80&w=800&auto=format&fit=crop");
        itemImages.put("Paneer Sticks", "https://images.unsplash.com/photo-1541544741300-880c2941584c?q=80&w=800&auto=format&fit=crop");
        itemImages.put("Paneer Majestics", "https://images.unsplash.com/photo-1517244465804-6385755d8f4e?q=80&w=800&auto=format&fit=crop");
        
        // Aloo and Rolls
        itemImages.put("Aloo 65", "https://images.unsplash.com/photo-1589647363585-f4a7d3877b10?q=80&w=800&auto=format&fit=crop");
        itemImages.put("Spring Rolls", "https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=800&auto=format&fit=crop");
        itemImages.put("Aloo Spring Roll", "https://images.unsplash.com/photo-1606333585112-b3c4fc310344?q=80&w=800&auto=format&fit=crop");
        
        // Others
        itemImages.put("Chilli Paneer", "https://images.unsplash.com/photo-1631515243349-e0cb75fb8d3a?q=80&w=800&auto=format&fit=crop");
        itemImages.put("Mashroom Manchuria", "https://images.unsplash.com/photo-1599487488170-d11ec9c172f0?q=80&w=800&auto=format&fit=crop"); // Placeholder
        itemImages.put("Mashroom 65", "https://images.unsplash.com/photo-1589647363585-f4a7d3877b10?q=80&w=800&auto=format&fit=crop"); // Placeholder

        List<MenuItem> items = menuItemRepository.findAll();
        int updatedCount = 0;

        for (MenuItem item : items) {
            String name = item.getName();
            // Check for names in my map
            String foundUrl = null;
            for (String key : itemImages.keySet()) {
                if (name.toLowerCase().contains(key.toLowerCase())) {
                    foundUrl = itemImages.get(key);
                    break;
                }
            }

            if (foundUrl != null && (item.getImageUrl() == null || item.getImageUrl().isEmpty() || item.getImageUrl().contains("placeholder"))) {
                item.setImageUrl(foundUrl);
                menuItemRepository.save(item);
                updatedCount++;
            }
        }

        // Category Images
        Map<String, String> categoryImages = new HashMap<>();
        categoryImages.put("VEG STARTERS", "https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?q=80&w=800&auto=format&fit=crop");
        categoryImages.put("NON-VEG STARTERS", "https://images.unsplash.com/photo-1626777552726-4a6b52c67ad4?q=80&w=800&auto=format&fit=crop");
        categoryImages.put("MAIN COURSE", "https://images.unsplash.com/photo-1515003322820-222394541544?q=80&w=800&auto=format&fit=crop");
        categoryImages.put("BEVERAGES", "https://images.unsplash.com/photo-1437419764061-2473afe69fc2?q=80&w=800&auto=format&fit=crop");

        // Seed Category Images
        List<com.kaveri.pos.entity.MenuCategory> categories = menuCategoryRepository.findAll();
        for (com.kaveri.pos.entity.MenuCategory cat : categories) {
            String img = categoryImages.get(cat.getName().toUpperCase());
            if (img != null && (cat.getImageUrl() == null || cat.getImageUrl().isEmpty())) {
                cat.setImageUrl(img);
                menuCategoryRepository.save(cat);
            }
        }

        System.out.println("--- Seeding complete. Updated " + updatedCount + " menu items and categories with high-quality images. ---");
    }
}
