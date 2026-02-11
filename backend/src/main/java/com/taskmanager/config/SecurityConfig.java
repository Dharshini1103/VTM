package com.taskmanager.config;

import com.taskmanager.security.JwtAuthenticationEntryPoint;
import com.taskmanager.security.JwtAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;
    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint,
                         JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationEntryPoint = jwtAuthenticationEntryPoint;
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable())
            .exceptionHandling(ex -> ex.authenticationEntryPoint(jwtAuthenticationEntryPoint))
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Public endpoints
                .requestMatchers("/auth/**").permitAll()
                .requestMatchers("/h2-console/**").permitAll()
                
                // SUPER_ADMIN only endpoints
                .requestMatchers(HttpMethod.POST, "/users/super-admin").hasRole("SUPER_ADMIN")
                .requestMatchers("/admin/system/**").hasRole("SUPER_ADMIN")
                
                // User management endpoints - ADMIN and SUPER_ADMIN
                .requestMatchers(HttpMethod.POST, "/users").hasAnyRole("ADMIN", "SUPER_ADMIN")
                .requestMatchers(HttpMethod.PUT, "/users/**").hasAnyRole("ADMIN", "SUPER_ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/users/**").hasAnyRole("ADMIN", "SUPER_ADMIN")
                .requestMatchers("/users/{userId}/permanent").hasRole("SUPER_ADMIN")
                
                // User view endpoints - All authenticated users
                .requestMatchers(HttpMethod.GET, "/users").authenticated()
                .requestMatchers(HttpMethod.GET, "/users/all").hasAnyRole("ADMIN", "SUPER_ADMIN")
                .requestMatchers(HttpMethod.GET, "/users/{userId}").authenticated()
                .requestMatchers("/users/me").authenticated()
                
                // Task management endpoints
                .requestMatchers(HttpMethod.POST, "/tasks").hasAnyRole("SUPER_ADMIN", "ADMIN", "MANAGER", "USER")
                .requestMatchers(HttpMethod.PUT, "/tasks/**").authenticated()
                .requestMatchers(HttpMethod.DELETE, "/tasks/**").hasAnyRole("SUPER_ADMIN", "ADMIN", "MANAGER")
                .requestMatchers(HttpMethod.GET, "/tasks/**").authenticated()
                
                // Manager team endpoints
                .requestMatchers(HttpMethod.GET, "/tasks/team/**").hasAnyRole("SUPER_ADMIN", "ADMIN", "MANAGER")
                .requestMatchers("/users/team/**").hasAnyRole("SUPER_ADMIN", "ADMIN", "MANAGER")
                
                // Voice and meeting endpoints
                .requestMatchers("/voice/**").authenticated()
                .requestMatchers("/meetings/**").authenticated()
                
                // Admin-only endpoints
                .requestMatchers("/admin/**").hasAnyRole("ADMIN", "SUPER_ADMIN")
                
                .anyRequest().authenticated()
            )
            .headers(headers -> headers.frameOptions().disable());

        http.addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
