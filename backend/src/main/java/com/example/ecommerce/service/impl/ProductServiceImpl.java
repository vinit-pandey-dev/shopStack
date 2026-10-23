package com.example.ecommerce.service.impl;

import com.example.ecommerce.dto.request.ProductRequest;
import com.example.ecommerce.dto.response.ProductDto;
import com.example.ecommerce.entity.Category;
import com.example.ecommerce.entity.Product;
import com.example.ecommerce.exception.ResourceNotFoundException;
import com.example.ecommerce.repository.CategoryRepository;
import com.example.ecommerce.rag.KnowledgeIndexService;
import com.example.ecommerce.repository.ProductRepository;
import com.example.ecommerce.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductServiceImpl implements ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final KnowledgeIndexService knowledgeIndexService;

    @Override
    public List<ProductDto> getAllProducts() {
        return productRepository.findAll().stream().map(this::toDto).toList();
    }

    @Override
    public List<ProductDto> searchProducts(String keyword) {
        return productRepository.findByNameContainingIgnoreCase(keyword).stream().map(this::toDto).toList();
    }

    @Override
    public List<ProductDto> getProductsByCategory(Long categoryId) {
        return productRepository.findByCategoryId(categoryId).stream().map(this::toDto).toList();
    }

    @Override
    public ProductDto getProductById(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + id));
        return toDto(product);
    }

    @Override
    public List<ProductDto> getRelatedProducts(Long id) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + id));

        List<Product> related = List.of();
        if (product.getCategory() != null) {
            related = productRepository.findTop4ByCategoryIdAndIdNotOrderByIdDesc(product.getCategory().getId(), id);
        }
        if (related.isEmpty()) {
            related = productRepository.findTop4ByIdNotOrderByIdDesc(id);
        }
        return related.stream().map(this::toDto).toList();
    }

    @Override
    public ProductDto createProduct(ProductRequest request) {
        Product product = Product.builder()
                .name(request.getName())
                .description(request.getDescription())
                .price(request.getPrice())
                .stock(request.getStock())
                .imageUrl(request.getImageUrl())
                .category(resolveCategory(request.getCategoryId()))
                .build();
        Product saved = productRepository.save(product);
        knowledgeIndexService.indexProduct(saved);   // AI assistant: add this one product to the vector store
        return toDto(saved);
    }

    @Override
    public ProductDto updateProduct(Long id, ProductRequest request) {
        Product product = productRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + id));

        product.setName(request.getName());
        product.setDescription(request.getDescription());
        product.setPrice(request.getPrice());
        product.setStock(request.getStock());
        product.setImageUrl(request.getImageUrl());
        product.setCategory(resolveCategory(request.getCategoryId()));

        Product saved = productRepository.save(product);
        knowledgeIndexService.indexProduct(saved);   // AI assistant: replace this one product in the vector store
        return toDto(saved);
    }

    @Override
    public void deleteProduct(Long id) {
        if (!productRepository.existsById(id)) {
            throw new ResourceNotFoundException("Product not found: " + id);
        }
        productRepository.deleteById(id);
        knowledgeIndexService.removeProduct(id);
    }

    private Category resolveCategory(Long categoryId) {
        if (categoryId == null) return null;
        return categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found: " + categoryId));
    }

    private ProductDto toDto(Product p) {
        return new ProductDto(
                p.getId(),
                p.getName(),
                p.getDescription(),
                p.getPrice(),
                p.getStock(),
                p.getImageUrl(),
                p.getCategory() != null ? p.getCategory().getId() : null,
                p.getCategory() != null ? p.getCategory().getName() : null
        );
    }
}
