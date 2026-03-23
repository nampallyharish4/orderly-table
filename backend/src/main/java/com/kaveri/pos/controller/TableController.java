package com.kaveri.pos.controller;

import com.kaveri.pos.entity.RestaurantTable;
import com.kaveri.pos.repository.TableRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/tables")
public class TableController {

    @Autowired
    private TableRepository tableRepository;

    @GetMapping
    public ResponseEntity<List<RestaurantTable>> getAllTables() {
        try {
            return ResponseEntity.ok(tableRepository.findAll());
        } catch (Exception e) {
            return ResponseEntity.status(500).build();
        }
    }

    @PatchMapping("/{id}")
    @SuppressWarnings("unchecked")
    public ResponseEntity<?> updateTable(@PathVariable String id, @RequestBody Map<String, Object> body) {

        try {
            Optional<RestaurantTable> optTable = tableRepository.findByVisibleId(id);
            if (optTable.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of("error", "Table not found"));
            }
            RestaurantTable table = optTable.get();

            if (body.containsKey("status") && body.get("status") != null)
                table.setStatus(body.get("status").toString());
            if (body.containsKey("currentOrderIds") && body.get("currentOrderIds") != null)
                table.setCurrentOrderIds((List<String>) body.get("currentOrderIds"));

            RestaurantTable saved = tableRepository.save(table);
            return ResponseEntity.ok(saved);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", "Failed to update table"));
        }
    }
}
