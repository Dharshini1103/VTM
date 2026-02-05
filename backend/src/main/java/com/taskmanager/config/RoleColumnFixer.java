package com.taskmanager.config;

import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.Map;

/**
 * Ensures the users.role column can store larger role names (e.g. SUPER_ADMIN).
 * If the column is an ENUM or has insufficient length, this component will
 * alter it to VARCHAR(20) DEFAULT 'USER'. This runs once at startup.
 */
@Component
public class RoleColumnFixer {

    private static final Logger logger = LoggerFactory.getLogger(RoleColumnFixer.class);
    private final JdbcTemplate jdbcTemplate;

    public RoleColumnFixer(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    @PostConstruct
    public void ensureRoleColumn() {
        try {
            String q = "SELECT DATA_TYPE, CHARACTER_MAXIMUM_LENGTH FROM information_schema.columns " +
                    "WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'role'";

            Map<String, Object> info = jdbcTemplate.queryForMap(q);
            if (info != null && !info.isEmpty()) {
                String dataType = (String) info.get("DATA_TYPE");
                Object maxLenObj = info.get("CHARACTER_MAXIMUM_LENGTH");
                Integer maxLen = maxLenObj == null ? null : ((Number) maxLenObj).intValue();

                logger.info("Role column current data_type={}, character_max_length={}", dataType, maxLen);

                boolean needsAlter = false;
                if (dataType != null && dataType.equalsIgnoreCase("enum")) {
                    needsAlter = true;
                }
                if (maxLen != null && maxLen < 20) {
                    needsAlter = true;
                }

                if (needsAlter) {
                    logger.info("Altering 'users.role' column to VARCHAR(20) NOT NULL DEFAULT 'USER'");
                    jdbcTemplate.execute("ALTER TABLE users MODIFY COLUMN role VARCHAR(20) NOT NULL DEFAULT 'USER'");
                    logger.info("'users.role' column altered successfully");
                } else {
                    logger.info("'users.role' column already suitable; no action needed");
                }
            } else {
                logger.warn("Could not find 'role' column metadata in information_schema; skipping alter check");
            }
        } catch (DataAccessException dae) {
            logger.error("Error while checking/modifying 'users.role' column: {}", dae.getMessage(), dae);
        } catch (Exception e) {
            logger.error("Unexpected error in RoleColumnFixer: {}", e.getMessage(), e);
        }
    }
}
