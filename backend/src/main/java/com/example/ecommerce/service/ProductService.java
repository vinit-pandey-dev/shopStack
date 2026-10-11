package com.example.ecommerce.service;

import com.example.ecommerce.dto.request.ProductRequest;
import com.example.ecommerce.dto.response.ProductDto;

import java.util.List;

public interface ProductService {
    List<ProductDto> getAllProducts();
    List<ProductDto> searchProducts(String keyword);
    List<ProductDto> getProductsByCategory(Long categoryId);
    ProductDto getProductById(Long id);
    List<ProductDto> getRelatedProducts(Long id);
    ProductDto createProduct(ProductRequest request);
    ProductDto updateProduct(Long id, ProductRequest request);
    void deleteProduct(Long id);
}
