package com.kaveri.pos.repository;

import com.kaveri.pos.entity.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

import java.time.OffsetDateTime;

@Repository
public interface OrderRepository extends JpaRepository<Order, Integer> {
    List<Order> findAllByOrderByCreatedAtDesc();
    Page<Order> findAll(Pageable pageable);
    List<Order> findByStatusInOrderByCreatedAtDesc(Collection<String> statuses);
    List<Order> findByUpdatedAtAfterOrderByUpdatedAtDesc(OffsetDateTime lastUpdated);
    Optional<Order> findByVisibleId(String visibleId);

    void deleteByVisibleId(String visibleId);
}

