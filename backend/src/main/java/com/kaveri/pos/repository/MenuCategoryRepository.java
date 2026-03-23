package com.kaveri.pos.repository;

import com.kaveri.pos.entity.MenuCategory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface MenuCategoryRepository extends JpaRepository<MenuCategory, Integer> {
    Optional<MenuCategory> findByVisibleId(String visibleId);
    void deleteByVisibleId(String visibleId);
}
