package com.sheflow.backend.controller;

import com.sheflow.backend.dto.ProductResponseDto;
import com.sheflow.backend.entity.Product;
import com.sheflow.backend.repository.ProductRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/products")
public class ProductController {

    private final ProductRepository productRepository;

    public ProductController(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    /**
     * Backward-compatible & paginated product catalog listing.
     * When page and size are supplied, returns Page<ProductResponseDto>;
     * otherwise returns full list for legacy clients.
     */
    @GetMapping
    public ResponseEntity<?> getProducts(
        @RequestParam(required = false) String category,
        @RequestParam(required = false) Integer page,
        @RequestParam(required = false) Integer size
    ) {
        if (page != null || size != null) {
            int p = page != null ? Math.max(page, 0) : 0;
            int s = size != null ? Math.min(Math.max(size, 1), 100) : 20;
            Pageable pageable = PageRequest.of(p, s, Sort.by(Sort.Direction.DESC, "rating"));

            Page<ProductResponseDto> paginated = (category != null && !category.equalsIgnoreCase("ALL"))
                ? productRepository.findByCategoryIgnoreCase(category, pageable).map(ProductResponseDto::fromEntity)
                : productRepository.findAll(pageable).map(ProductResponseDto::fromEntity);

            return ResponseEntity.ok(paginated);
        }

        // Backward compatibility: list format
        List<Product> products = (category != null && !category.equalsIgnoreCase("ALL"))
            ? productRepository.findByCategoryIgnoreCaseOrderByRatingDesc(category)
            : productRepository.findAllByOrderByRatingDesc();

        return ResponseEntity.ok(products.stream().map(ProductResponseDto::fromEntity).toList());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ProductResponseDto> getProductById(@PathVariable Long id) {
        Product p = productRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Product not found with id: " + id));
        return ResponseEntity.ok(ProductResponseDto.fromEntity(p));
    }

    @GetMapping("/search")
    public ResponseEntity<Page<ProductResponseDto>> search(
        @RequestParam String q,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "20") int size
    ) {
        int clampedSize = Math.min(Math.max(size, 1), 100);
        Pageable pageable = PageRequest.of(Math.max(page, 0), clampedSize, Sort.by(Sort.Direction.DESC, "rating"));
        return ResponseEntity.ok(productRepository.searchProducts(q, pageable).map(ProductResponseDto::fromEntity));
    }
}
