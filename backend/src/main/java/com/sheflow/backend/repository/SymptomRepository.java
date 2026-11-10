package com.sheflow.backend.repository;

import com.sheflow.backend.entity.SymptomLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface SymptomRepository extends JpaRepository<SymptomLog, Long> {
    List<SymptomLog> findByUserIdOrderByLogDateDesc(Long userId);
    List<SymptomLog> findByUserIdAndLogDate(Long userId, LocalDate logDate);
}
