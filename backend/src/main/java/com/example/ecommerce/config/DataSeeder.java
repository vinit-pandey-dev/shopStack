package com.example.ecommerce.config;

import com.example.ecommerce.entity.*;
import com.example.ecommerce.repository.CategoryRepository;
import com.example.ecommerce.repository.ProductRepository;
import com.example.ecommerce.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;


@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    @Value("${app.admin.password:admin123}")
    private String adminPassword;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (userRepository.count() == 0) {
            userRepository.save(User.builder()
                    .username("admin")
                    .email("admin@example.com")
                    .password(passwordEncoder.encode(adminPassword))
                    .role(Role.ROLE_ADMIN)
                    .build());

            userRepository.save(User.builder()
                    .username("john")
                    .email("john@example.com")
                    .password(passwordEncoder.encode("password123"))
                    .role(Role.ROLE_USER)
                    .build());
        }

        if (categoryRepository.count() == 0) {
            Category electronics = categoryRepository.save(
                    Category.builder().name("Electronics").description("Gadgets and devices").build());
            Category books = categoryRepository.save(
                    Category.builder().name("Books").description("Fiction and non-fiction books").build());
            Category clothing = categoryRepository.save(
                    Category.builder().name("Clothing").description("Apparel for all").build());

            productRepository.save(Product.builder()
                    .name("Wireless Headphones").description("Noise-cancelling over-ear headphones")
                    .price(new BigDecimal("79.99")).stock(50)
                    .imageUrl("https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400")
                    .category(electronics).build());

            productRepository.save(Product.builder()
                    .name("Mechanical Keyboard").description("RGB backlit mechanical keyboard")
                    .price(new BigDecimal("59.99")).stock(30)
                    .imageUrl("https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400")
                    .category(electronics).build());

            productRepository.save(Product.builder()
                    .name("Smart Watch").description("Fitness tracking smart watch")
                    .price(new BigDecimal("129.99")).stock(20)
                    .imageUrl("https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400")
                    .category(electronics).build());

            productRepository.save(Product.builder()
                    .name("The Pragmatic Programmer").description("A classic software engineering book")
                    .price(new BigDecimal("34.99")).stock(40)
                    .imageUrl("https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400")
                    .category(books).build());

            productRepository.save(Product.builder()
                    .name("Clean Code").description("A handbook of agile software craftsmanship")
                    .price(new BigDecimal("29.99")).stock(35)
                    .imageUrl("https://images.unsplash.com/photo-1532012197267-da84d127e765?w=400")
                    .category(books).build());

            productRepository.save(Product.builder()
                    .name("Cotton T-Shirt").description("Comfortable everyday cotton t-shirt")
                    .price(new BigDecimal("14.99")).stock(100)
                    .imageUrl("https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400")
                    .category(clothing).build());

            productRepository.save(Product.builder()
                    .name("Denim Jacket").description("Classic fit denim jacket")
                    .price(new BigDecimal("49.99")).stock(25)
                    .imageUrl("https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400")
                    .category(clothing).build());
        }
    }
}
