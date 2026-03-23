package com.kaveri.pos.repository;

import com.kaveri.pos.entity.MenuItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface MenuItemRepository extends JpaRepository<MenuItem, Integer> {
    Optional<MenuItem> findByVisibleId(String visibleId);
    void deleteByVisibleId(String visibleId);
}
