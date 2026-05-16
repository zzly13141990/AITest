package com.sqlserver.mcp.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class ConfigLoader {
    private static final Logger log = LoggerFactory.getLogger(ConfigLoader.class);

    private ConfigLoader() {}

    public static AppConfig load(String[] args) {
        var configPath = resolveConfigPath(args);
        log.info("Loading configuration from: {}", configPath != null ? configPath : "defaults");

        var yamlLoader = new YamlConfigLoader(configPath);
        var appConfig = yamlLoader.load();

        log.info("Configuration loaded: server={}, databases={}, llm={}",
            appConfig.mcp().serverName(),
            appConfig.database().sources().size(),
            appConfig.llm().model()
        );

        return appConfig;
    }

    private static String resolveConfigPath(String[] args) {
        // Check system property first
        var configPath = System.getProperty("config.path");
        if (configPath != null) return configPath;

        // Check environment variable
        configPath = System.getenv("CONFIG_PATH");
        if (configPath != null) return configPath;

        // Check command line args
        if (args != null) {
            for (int i = 0; i < args.length - 1; i++) {
                if ("--config".equals(args[i]) || "-c".equals(args[i])) {
                    return args[i + 1];
                }
            }
        }

        return null; // Use default path
    }
}
