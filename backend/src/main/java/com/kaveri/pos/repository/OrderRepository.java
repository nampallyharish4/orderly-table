package com.kaveri.pos.repository;

import com.kaveri.pos.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Integer> {
    List<Order> findAllByOrderByCreatedAtDesc();
    Optional<Order> findByVisibleId(String visibleId);
    void deleteByVisibleId(String visibleId);
}
