package com.sheflow.backend.repository;

import com.sheflow.backend.entity.PeriodLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface PeriodLogRepository extends JpaRepository<PeriodLog, Long> {
    List<PeriodLog> findByUserIdOrderByStartDateDesc(Long userId);
}
