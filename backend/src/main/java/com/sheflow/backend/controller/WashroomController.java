package com.sheflow.backend.controller;

import com.sheflow.backend.entity.WashroomFacility;
import com.sheflow.backend.repository.WashroomRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/washrooms")
public class WashroomController {

    private final WashroomRepository washroomRepository;

    public WashroomController(WashroomRepository washroomRepository) {
        this.washroomRepository = washroomRepository;
    }

    @GetMapping
    public ResponseEntity<List<WashroomFacility>> getWashrooms(@RequestParam(required = false) String type) {
        if ("WHEELCHAIR_ACCESSIBLE".equalsIgnoreCase(type)) {
            return ResponseEntity.ok(washroomRepository.findByWheelchairAccessibleTrue());
        }
        if (type != null && !type.equalsIgnoreCase("ALL")) {
            return ResponseEntity.ok(washroomRepository.findByFacilityTypeIgnoreCase(type));
        }
        return ResponseEntity.ok(washroomRepository.findAll());
    }
}
