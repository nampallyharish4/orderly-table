package com.kaveri.pos.repository;

import com.kaveri.pos.entity.AppSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SettingsRepository extends JpaRepository<AppSettings, Integer> {
}
