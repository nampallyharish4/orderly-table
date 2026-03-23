package com.kaveri.pos.repository;

import com.kaveri.pos.entity.MenuItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.List;

@Repository
public interface MenuItemRepository extends JpaRepository<MenuItem, Integer> {
    List<MenuItem> findAllByOrderByDbIdAsc();
    Optional<MenuItem> findByVisibleId(String visibleId);
    void deleteByVisibleId(String visibleId);
}
