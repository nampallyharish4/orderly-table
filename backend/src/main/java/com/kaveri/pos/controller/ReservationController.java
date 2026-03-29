package com.kaveri.pos.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/reservations")
public class ReservationController {

    private static final Logger logger = LoggerFactory.getLogger(ReservationController.class);

    @Autowired(required = false)
    private JdbcTemplate jdbcTemplate;

    private static final Set<String> ALLOWED_STATUS = new HashSet<>(List.of("waitlist", "confirmed"));

    @GetMapping
    public ResponseEntity<?> getReservations() {
        try {
            if (jdbcTemplate == null) {
                return ResponseEntity.status(500).body(Map.of("error", "Database client is not configured"));
            }

            String regClass = jdbcTemplate.queryForObject(
                    "SELECT to_regclass('public.reservations')",
                    String.class
            );

            if (regClass == null || regClass.isBlank()) {
                return ResponseEntity.status(404).body(Map.of("error", "Table public.reservations was not found"));
            }

            List<String> columns = jdbcTemplate.queryForList(
                    "SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='reservations'",
                    String.class
            );

            String orderByColumn = null;
            for (String candidate : List.of("reservation_date", "reserved_at", "reservation_time", "created_at", "id")) {
                if (columns.contains(candidate)) {
                    orderByColumn = candidate;
                    break;
                }
            }

            String sql = "SELECT * FROM reservations";
            if (orderByColumn != null) {
                sql += " ORDER BY " + orderByColumn + " DESC";
            }

            List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql);
            Map<String, Object> response = new LinkedHashMap<>();
            response.put("count", rows.size());
            response.put("items", rows);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("[ReservationController] Failed to fetch reservations", e);
            return ResponseEntity.status(500).body(Map.of("error", "Failed to fetch reservations", "details", e.getMessage()));
        }
    }

    @PatchMapping("/{reservationId}/status")
    public ResponseEntity<?> updateReservationStatus(
            @PathVariable String reservationId,
            @RequestBody Map<String, Object> body
    ) {
        try {
            if (jdbcTemplate == null) {
                return ResponseEntity.status(500).body(Map.of("error", "Database client is not configured"));
            }

            Object rawStatus = body.get("status");
            if (rawStatus == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "status is required"));
            }

            String status = rawStatus.toString().trim().toLowerCase();
            if (!ALLOWED_STATUS.contains(status)) {
                return ResponseEntity.badRequest().body(
                        Map.of("error", "Invalid status. Allowed values are: waitlist, confirmed")
                );
            }

            List<String> columns = jdbcTemplate.queryForList(
                    "SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='reservations'",
                    String.class
            );

            if (columns.isEmpty()) {
                return ResponseEntity.status(404).body(Map.of("error", "Table public.reservations was not found"));
            }

            if (!columns.contains("status")) {
                return ResponseEntity.status(500).body(Map.of("error", "status column does not exist in reservations table"));
            }

            String whereClause;
            List<Object> identityParams = new ArrayList<>();

            boolean hasId = columns.contains("id");
            boolean hasVisibleId = columns.contains("visible_id");

            if (hasId && hasVisibleId) {
                whereClause = "(CAST(id AS TEXT) = ? OR visible_id = ?)";
                identityParams.add(reservationId);
                identityParams.add(reservationId);
            } else if (hasId) {
                whereClause = "CAST(id AS TEXT) = ?";
                identityParams.add(reservationId);
            } else if (hasVisibleId) {
                whereClause = "visible_id = ?";
                identityParams.add(reservationId);
            } else {
                return ResponseEntity.status(500).body(Map.of("error", "No supported identifier column found (id/visible_id)"));
            }

            List<Object> updateParams = new ArrayList<>();
            updateParams.add(status);
            updateParams.addAll(identityParams);

            int updatedRows = jdbcTemplate.update(
                    "UPDATE reservations SET status = ? WHERE " + whereClause,
                    updateParams.toArray()
            );

            if (updatedRows == 0) {
                return ResponseEntity.status(404).body(Map.of("error", "Reservation not found"));
            }

            List<Map<String, Object>> rows = jdbcTemplate.queryForList(
                    "SELECT * FROM reservations WHERE " + whereClause + " LIMIT 1",
                    identityParams.toArray()
            );

            Map<String, Object> response = new LinkedHashMap<>();
            response.put("status", "ok");
            response.put("item", rows.isEmpty() ? null : rows.get(0));
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("[ReservationController] Failed to update reservation status", e);
            return ResponseEntity.status(500).body(Map.of("error", "Failed to update reservation status", "details", e.getMessage()));
        }
    }
}