package com.oes.acct.vouch.service;

import com.oes.acct.vouch.model.entity.AcctSubjOtherFzSetting;
import com.oes.acct.vouch.repository.OtherFzSettingRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.List;

@Service
public class OtherFzhsSettingService {

    private final OtherFzSettingRepository repository;

    public OtherFzhsSettingService(OtherFzSettingRepository repository) {
        this.repository = repository;
    }

    public List<AcctSubjOtherFzSetting> getSettings(String acctSubjCode, String compCode, String copyCode, String acctYear) {
        return repository.findBySubject(acctSubjCode, compCode, copyCode, acctYear);
    }

    public List<AcctSubjOtherFzSetting> getVisibleSettings(String acctSubjCode, String compCode, String copyCode, String acctYear) {
        return repository.findVisibleBySubject(acctSubjCode, compCode, copyCode, acctYear);
    }

    /**
     * Map special fields based on check type name.
     * v2.1: 日期 -> order_date/occur_date, 结算方式 -> pay_type_id, 票据号 -> cheq_no/order_no, 回单号 -> receipt_no
     */
    public static String resolveSpecialFieldMapping(String checkTypeName, String infoFzhsValue) {
        if (checkTypeName == null || infoFzhsValue == null) {
            return null;
        }

        return switch (checkTypeName.trim()) {
            case "日期" -> "order_date";
            case "结算方式" -> "pay_type_id";
            case "票据号" -> "cheq_no";
            case "回单号" -> "receipt_no";
            default -> null;
        };
    }
}
