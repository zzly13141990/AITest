package com.oes.acct.vouch.service;

import com.oes.acct.vouch.repository.OtherFzSettingRepository;
import com.oes.acct.vouch.repository.SubjRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
class OtherFzhsSettingServiceTest {

    @Mock
    private OtherFzSettingRepository repository;

    @Test
    void resolveSpecialFieldMapping_withDate_shouldReturnOrderDate() {
        assertEquals("order_date", OtherFzhsSettingService.resolveSpecialFieldMapping("日期", "2026-05-01"));
    }

    @Test
    void resolveSpecialFieldMapping_withSettlement_shouldReturnPayTypeId() {
        assertEquals("pay_type_id", OtherFzhsSettingService.resolveSpecialFieldMapping("结算方式", "1"));
    }

    @Test
    void resolveSpecialFieldMapping_withCheque_shouldReturnCheqNo() {
        assertEquals("cheq_no", OtherFzhsSettingService.resolveSpecialFieldMapping("票据号", "ABC123"));
    }

    @Test
    void resolveSpecialFieldMapping_withReceipt_shouldReturnReceiptNo() {
        assertEquals("receipt_no", OtherFzhsSettingService.resolveSpecialFieldMapping("回单号", "RCP001"));
    }

    @Test
    void resolveSpecialFieldMapping_withUnknownType_shouldReturnNull() {
        assertNull(OtherFzhsSettingService.resolveSpecialFieldMapping("未知类型", "value"));
    }

    @Test
    void resolveSpecialFieldMapping_withNullType_shouldReturnNull() {
        assertNull(OtherFzhsSettingService.resolveSpecialFieldMapping(null, "value"));
    }

    @Test
    void resolveSpecialFieldMapping_withNullValue_shouldReturnNull() {
        assertNull(OtherFzhsSettingService.resolveSpecialFieldMapping("日期", null));
    }

    @Test
    void resolveSpecialFieldMapping_withWhitespaceInType_shouldTrim() {
        assertEquals("order_date", OtherFzhsSettingService.resolveSpecialFieldMapping("  日期  ", "2026-05-01"));
    }
}
