package com.sheflow.backend.repository;

import com.sheflow.backend.entity.MoodLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface MoodRepository extends JpaRepository<MoodLog, Long> {
    List<MoodLog> findByUserIdOrderByLogDateDesc(Long userId);
    List<MoodLog> findByUserIdAndLogDate(Long userId, LocalDate logDate);
}
