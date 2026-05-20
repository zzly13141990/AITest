package com.oes.acct.vouch.cache;

import com.oes.acct.vouch.exception.BusinessException;
import com.oes.acct.vouch.exception.ErrorCode;
import com.oes.acct.vouch.model.entity.SysCheckDefine;
import com.oes.acct.vouch.repository.CheckDefineRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import jakarta.annotation.PostConstruct;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class CheckDefineCache {

    private static final Logger log = LoggerFactory.getLogger(CheckDefineCache.class);

    private final Map<Integer, SysCheckDefine> cacheById = new ConcurrentHashMap<>();
    private final Map<String, SysCheckDefine> cacheByName = new ConcurrentHashMap<>();
    private final Map<String, SysCheckDefine> cacheByTableId = new ConcurrentHashMap<>();
    private final CheckDefineRepository repository;

    public CheckDefineCache(CheckDefineRepository repository) {
        this.repository = repository;
    }

    @PostConstruct
    public void init() {
        loadAllDefines();
        log.info("CheckDefineCache initialized with {} entries", cacheById.size());
    }

    @Scheduled(fixedDelayString = "${oes.acct.vouch.cache.check-define-refresh-ms:300000}")
    public void refresh() {
        loadAllDefines();
        log.debug("CheckDefineCache refreshed: {} entries", cacheById.size());
    }

    private void loadAllDefines() {
        List<SysCheckDefine> allDefines = repository.findAll();
        Map<Integer, SysCheckDefine> newCacheById = new ConcurrentHashMap<>();
        Map<String, SysCheckDefine> newCacheByName = new ConcurrentHashMap<>();
        Map<String, SysCheckDefine> newCacheByTableId = new ConcurrentHashMap<>();

        for (SysCheckDefine def : allDefines) {
            if (!"1".equals(def.getIsStop())) {
                newCacheById.put(def.getCheckId(), def);
                if (def.getCheckName() != null) {
                    newCacheByName.put(def.getCheckName(), def);
                }
                if (def.getTableId() != null) {
                    newCacheByTableId.put(def.getTableId(), def);
                }
            }
        }

        cacheById.clear();
        cacheById.putAll(newCacheById);
        cacheByName.clear();
        cacheByName.putAll(newCacheByName);
        cacheByTableId.clear();
        cacheByTableId.putAll(newCacheByTableId);
    }

    public SysCheckDefine getCheckDefine(Integer checkId) {
        SysCheckDefine def = cacheById.get(checkId);
        if (def == null) {
            throw new BusinessException(ErrorCode.PARAM_INVALID, "不存在的辅助核算定义: checkId=" + checkId);
        }
        return def;
    }

    public SysCheckDefine findByCheckName(String checkName) {
        return cacheByName.get(checkName);
    }

    public SysCheckDefine findByTableId(String tableId) {
        return cacheByTableId.get(tableId);
    }

    public int size() {
        return cacheById.size();
    }
}
