package com.sheflow.backend.repository;

import com.sheflow.backend.entity.WaterLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.Optional;
import java.util.List;

@Repository
public interface WaterRepository extends JpaRepository<WaterLog, Long> {
    Optional<WaterLog> findByUserIdAndLogDate(Long userId, LocalDate logDate);
    List<WaterLog> findByUserIdOrderByLogDateDesc(Long userId);
}
