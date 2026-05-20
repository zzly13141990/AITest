CREATE TABLE IF NOT EXISTS query_log (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    request_time    TIMESTAMP   NOT NULL,
    client_ip       VARCHAR(45) NOT NULL,
    database_ip     VARCHAR(45) NOT NULL,
    database_port   INT         NOT NULL,
    database_type   VARCHAR(20) NOT NULL,
    database_name   VARCHAR(100) NOT NULL,
    sql_hash        VARCHAR(64) NOT NULL,
    sql_preview     VARCHAR(200),
    sql_full        TEXT,
    result_data     TEXT,
    status          VARCHAR(10) NOT NULL,
    message         VARCHAR(500),
    duration_ms     INT NOT NULL DEFAULT 0,
    created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_log_request_time ON query_log(request_time);
CREATE INDEX IF NOT EXISTS idx_log_client_ip ON query_log(client_ip);
CREATE INDEX IF NOT EXISTS idx_log_status ON query_log(status);
CREATE INDEX IF NOT EXISTS idx_log_type ON query_log(database_type);
