package com.example.ecommerce.repository;

import com.example.ecommerce.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;

public interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findByCategoryId(Long categoryId);
    List<Product> findByNameContainingIgnoreCase(String name);
    List<Product> findTop4ByCategoryIdAndIdNotOrderByIdDesc(Long categoryId, Long id);
    List<Product> findTop4ByIdNotOrderByIdDesc(Long id);

    // Used by the AI assistant (RAG). Fetch-joins the category so it can be read outside a web request.
    @Query("select p from Product p left join fetch p.category")
    List<Product> findAllWithCategory();

    @Query("select p from Product p left join fetch p.category where p.id in :ids")
    List<Product> findAllWithCategoryByIdIn(@Param("ids") Collection<Long> ids);
}
