package com.kaveri.pos.repository;

import com.kaveri.pos.entity.RestaurantTable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TableRepository extends JpaRepository<RestaurantTable, Integer> {
    Optional<RestaurantTable> findByVisibleId(String visibleId);
}
