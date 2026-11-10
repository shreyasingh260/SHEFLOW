package com.sheflow.backend.repository;

import com.sheflow.backend.entity.CyclePrediction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface CyclePredictionRepository extends JpaRepository<CyclePrediction, Long> {
    Optional<CyclePrediction> findTopByUserIdOrderByCalculatedAtDesc(Long userId);
}
