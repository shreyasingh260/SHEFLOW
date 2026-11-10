package com.sheflow.backend.repository;

import com.sheflow.backend.entity.WashroomFacility;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface WashroomRepository extends JpaRepository<WashroomFacility, Long> {
    List<WashroomFacility> findByFacilityTypeIgnoreCase(String facilityType);
    List<WashroomFacility> findByWheelchairAccessibleTrue();
}
