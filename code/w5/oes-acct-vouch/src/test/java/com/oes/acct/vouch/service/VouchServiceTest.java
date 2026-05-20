package com.oes.acct.vouch.service;

import com.oes.acct.vouch.exception.BusinessException;
import com.oes.acct.vouch.model.dto.*;
import com.oes.acct.vouch.model.entity.*;
import com.oes.acct.vouch.repository.*;
import com.oes.acct.vouch.util.SnowflakeIdGenerator;
import com.oes.acct.vouch.validator.AccountingStandardsValidator;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class VouchServiceTest {

    @Mock private VouchRepository vouchRepository;
    @Mock private VouchDetailRepository detailRepository;
    @Mock private CheckItemsRepository checkItemsRepository;
    @Mock private CheckService checkService;
    @Mock private VouchNoGenerator vouchNoGenerator;
    @Mock private AccountingStandardsValidator validator;
    @Mock private JdbcTemplate jdbcTemplate;
    @Mock private SnowflakeIdGenerator idGenerator;
    @Mock private RowMapper<OperatorInfo> operatorRowMapper;

    @InjectMocks
    private VouchService vouchService;

    @Captor private ArgumentCaptor<AcctVouch> vouchCaptor;
    @Captor private ArgumentCaptor<AcctVouchDetail> detailCaptor;
    @Captor private ArgumentCaptor<List<AcctCheckItem>> checkItemsCaptor;

    private VouchSaveRequest.VouchMain createVouchMain(Long vouchId) {
        return new VouchSaveRequest.VouchMain(
                vouchId, "01", "001", "2026", "05",
                1, LocalDateTime.of(2026, 5, 15, 10, 0), 2, 1,
                "01", "张三", "admin", null, null, 0, null, null, null);
    }

    private VouchSaveRequest.VouchDetail createDetail(Long detailId, String subjCode,
                                                        BigDecimal debit, BigDecimal credit) {
        return new VouchSaveRequest.VouchDetail(
                detailId, 1, 1, "摘要", subjCode, debit, credit, null);
    }

    private VouchSaveRequest.VouchDetail createDetailWithChecks(Long detailId, String subjCode,
                                                                  BigDecimal debit, BigDecimal credit,
                                                                  List<VouchSaveRequest.CheckItem> checkItems) {
        return new VouchSaveRequest.VouchDetail(
                detailId, 1, 1, "摘要", subjCode, debit, credit, checkItems);
    }

    @Test
    void loadVouch_withNullVouchId_shouldReturnCreateMode() {
        when(jdbcTemplate.queryForObject(anyString(), any(RowMapper.class), eq("admin")))
                .thenThrow(new DataAccessException("test") {});
        when(jdbcTemplate.queryForObject(anyString(), eq(String.class), anyString(), anyString()))
                .thenReturn("财务主管");

        VouchLoadResponse response = vouchService.loadVouch("admin", null, "01", "001", "2026", "05", null, null);

        assertEquals("create", response.mode());
        assertNotNull(response.vouch());
        assertEquals("01", response.vouch().compCode());
    }

    @Test
    void loadVouch_withExistingVouchId_shouldReturnEditMode() {
        AcctVouch existing = new AcctVouch();
        existing.setVouchId(1L);
        existing.setCompCode("01");
        existing.setCopyCode("001");
        existing.setAcctYear("2026");
        existing.setAcctMonth("05");
        existing.setVouchNo(1);

        when(vouchRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(detailRepository.findByVouchId(1L)).thenReturn(List.of());
        when(jdbcTemplate.queryForObject(anyString(), any(RowMapper.class), eq("admin")))
                .thenThrow(new DataAccessException("test") {});

        VouchLoadResponse response = vouchService.loadVouch("admin", "1", "01", "001", "2026", "05", null, null);

        assertEquals("edit", response.mode());
        assertEquals(1L, response.vouch().vouchId());
    }

    @Test
    void loadVouch_withNonExistingVouchId_shouldThrow() {
        when(vouchRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(BusinessException.class,
                () -> vouchService.loadVouch("admin", "999", "01", "001", "2026", "05", null, null));
    }

    @Test
    void loadVouch_withBlankVouchId_shouldReturnCreateMode() {
        when(jdbcTemplate.queryForObject(anyString(), any(RowMapper.class), eq("admin")))
                .thenThrow(new DataAccessException("test") {});
        when(jdbcTemplate.queryForObject(anyString(), eq(String.class), anyString(), anyString()))
                .thenReturn("财务主管");

        VouchLoadResponse response = vouchService.loadVouch("admin", "  ", "01", "001", "2026", "05", null, null);

        assertEquals("create", response.mode());
    }

    // === saveVouch tests ===

    @Test
    void saveVouch_newVoucher_shouldInsertAndReturnResult() {
        VouchSaveRequest request = new VouchSaveRequest(
                createVouchMain(null),
                List.of(createDetail(null, "1001", BigDecimal.valueOf(100), BigDecimal.ZERO),
                        createDetail(null, "2001", BigDecimal.ZERO, BigDecimal.valueOf(100))),
                null);

        when(vouchNoGenerator.nextVouchNoWithLock("01", "001", "2026", "05")).thenReturn(42);
        when(idGenerator.nextVouchId()).thenReturn(1L);
        when(idGenerator.nextDetailId()).thenReturn(10L, 11L);
        when(jdbcTemplate.queryForObject(anyString(), eq(String.class), eq("admin")))
                .thenReturn("管理员");

        SaveVouchResult result = vouchService.saveVouch(request, "admin");

        assertNotNull(result);
        assertEquals(1L, result.vouchId());
        assertEquals(42, result.vouchNo());
        assertEquals("保存成功", result.message());

        verify(vouchRepository).insert(vouchCaptor.capture());
        AcctVouch saved = vouchCaptor.getValue();
        assertEquals("01", saved.getCompCode());
        assertEquals(42, saved.getVouchNo());
        assertEquals("0", saved.getIsCheck());

        verify(detailRepository, times(2)).insert(any());
        verify(vouchNoGenerator).releaseLock("01", "001", "2026", "05");
    }

    @Test
    void saveVouch_updateExisting_shouldUpdateInsteadOfInsert() {
        AcctVouch existing = new AcctVouch();
        existing.setVouchId(1L);
        existing.setCompCode("01");
        existing.setCopyCode("001");

        when(vouchRepository.findById(1L)).thenReturn(Optional.of(existing));
        when(jdbcTemplate.queryForObject(anyString(), eq(String.class), eq("admin")))
                .thenReturn("管理员");

        VouchSaveRequest request = new VouchSaveRequest(
                createVouchMain(1L),
                List.of(createDetail(10L, "1001", BigDecimal.valueOf(100), BigDecimal.ZERO)),
                null);

        SaveVouchResult result = vouchService.saveVouch(request, "admin");

        assertNotNull(result);
        assertEquals(1L, result.vouchId());
        verify(vouchRepository).update(any());
        verify(vouchRepository, never()).insert(any());
        verify(vouchNoGenerator, never()).nextVouchNoWithLock(anyString(), anyString(), anyString(), anyString());
        verify(vouchNoGenerator, never()).releaseLock(anyString(), anyString(), anyString(), anyString());
    }

    @Test
    void saveVouch_withDeletedDetails_shouldRemoveThem() {
        when(vouchNoGenerator.nextVouchNoWithLock("01", "001", "2026", "05")).thenReturn(1);
        when(idGenerator.nextVouchId()).thenReturn(1L);
        when(idGenerator.nextDetailId()).thenReturn(10L);
        when(jdbcTemplate.queryForObject(anyString(), eq(String.class), eq("admin")))
                .thenReturn("管理员");

        VouchSaveRequest request = new VouchSaveRequest(
                createVouchMain(null),
                List.of(createDetail(null, "1001", BigDecimal.valueOf(100), BigDecimal.ZERO)),
                List.of(99L, 100L));

        vouchService.saveVouch(request, "admin");

        verify(checkItemsRepository).deleteByDetailId(99L);
        verify(detailRepository).deleteById(99L);
        verify(checkItemsRepository).deleteByDetailId(100L);
        verify(detailRepository).deleteById(100L);
    }

    @Test
    void saveVouch_withCheckItems_shouldSaveFullReplacement() {
        when(vouchNoGenerator.nextVouchNoWithLock("01", "001", "2026", "05")).thenReturn(1);
        when(idGenerator.nextVouchId()).thenReturn(1L);
        when(idGenerator.nextDetailId()).thenReturn(10L);
        when(jdbcTemplate.queryForObject(anyString(), eq(String.class), eq("admin")))
                .thenReturn("管理员");

        VouchSaveRequest.CheckItem checkItem = new VouchSaveRequest.CheckItem(
                null, 1, "standard", null, null, null,
                java.util.Map.of(1001, 1), null, null, null, null, null,
                null, null, null, null, null, null, null);

        VouchSaveRequest request = new VouchSaveRequest(
                createVouchMain(null),
                List.of(createDetailWithChecks(null, "1001", BigDecimal.valueOf(100),
                        BigDecimal.ZERO, List.of(checkItem))),
                null);

        vouchService.saveVouch(request, "admin");

        verify(checkItemsRepository).deleteByDetailId(10L);
        verify(checkItemsRepository).batchInsert(checkItemsCaptor.capture());

        List<AcctCheckItem> savedItems = checkItemsCaptor.getValue();
        assertEquals(1, savedItems.size());
        assertEquals(1, savedItems.getFirst().getLine());
        assertEquals(10L, savedItems.getFirst().getVouchDetailId());
    }

    @Test
    void saveVouch_withOtherFzhs_shouldMapToSeparateLines() {
        when(vouchNoGenerator.nextVouchNoWithLock("01", "001", "2026", "05")).thenReturn(1);
        when(idGenerator.nextVouchId()).thenReturn(1L);
        when(idGenerator.nextDetailId()).thenReturn(10L);
        when(jdbcTemplate.queryForObject(anyString(), eq(String.class), eq("admin")))
                .thenReturn("管理员");

        VouchSaveRequest.CheckItem otherCheck = new VouchSaveRequest.CheckItem(
                null, 2, "other", "其他摘要", null, null,
                null, 1, "FZHS_VAL", null, null, null, null,
                null, null, null, null, null, null);

        VouchSaveRequest request = new VouchSaveRequest(
                createVouchMain(null),
                List.of(createDetailWithChecks(null, "1001", BigDecimal.valueOf(100),
                        BigDecimal.ZERO, List.of(otherCheck))),
                null);

        vouchService.saveVouch(request, "admin");

        verify(checkItemsRepository).batchInsert(checkItemsCaptor.capture());
        List<AcctCheckItem> items = checkItemsCaptor.getValue();
        assertEquals(1, items.size());
        assertEquals(2, items.getFirst().getLine());
        assertEquals("FZHS_VAL", items.getFirst().getInfoFzhs1());
    }

    @Test
    void saveVouch_shouldCallValidatorBeforeSave() {
        when(vouchNoGenerator.nextVouchNoWithLock("01", "001", "2026", "05")).thenReturn(1);
        when(idGenerator.nextVouchId()).thenReturn(1L);
        when(idGenerator.nextDetailId()).thenReturn(10L);
        when(jdbcTemplate.queryForObject(anyString(), eq(String.class), eq("admin")))
                .thenReturn("管理员");

        VouchSaveRequest request = new VouchSaveRequest(
                createVouchMain(null),
                List.of(createDetail(null, "1001", BigDecimal.valueOf(100), BigDecimal.ZERO)),
                null);

        vouchService.saveVouch(request, "admin");

        verify(validator).validate(request);
    }

    @Test
    void saveVouch_whenValidatorThrows_shouldNotSave() {
        VouchSaveRequest request = new VouchSaveRequest(
                createVouchMain(null),
                List.of(createDetail(null, "1001", BigDecimal.valueOf(100), BigDecimal.ZERO)),
                null);

        doThrow(new BusinessException(1001, "校验失败")).when(validator).validate(request);

        assertThrows(BusinessException.class, () -> vouchService.saveVouch(request, "admin"));

        verify(vouchRepository, never()).insert(any());
        verify(vouchNoGenerator, never()).nextVouchNoWithLock(anyString(), anyString(), anyString(), anyString());
    }

    @Test
    void saveVouch_whenDataAccessException_shouldReleaseLockAndThrow() {
        when(vouchNoGenerator.nextVouchNoWithLock("01", "001", "2026", "05")).thenReturn(1);
        doThrow(new DataAccessException("DB error") {}).when(vouchRepository).insert(any());
        when(jdbcTemplate.queryForObject(anyString(), eq(String.class), eq("admin")))
                .thenReturn("管理员");

        VouchSaveRequest request = new VouchSaveRequest(
                createVouchMain(null),
                List.of(createDetail(null, "1001", BigDecimal.valueOf(100), BigDecimal.ZERO)),
                null);

        assertThrows(BusinessException.class, () -> vouchService.saveVouch(request, "admin"));

        verify(vouchNoGenerator).releaseLock("01", "001", "2026", "05");
    }

    @Test
    void saveVouch_whenDetailHasNullAmounts_shouldDefaultToZero() {
        when(vouchNoGenerator.nextVouchNoWithLock("01", "001", "2026", "05")).thenReturn(1);
        when(idGenerator.nextVouchId()).thenReturn(1L);
        when(idGenerator.nextDetailId()).thenReturn(10L);
        when(jdbcTemplate.queryForObject(anyString(), eq(String.class), eq("admin")))
                .thenReturn("管理员");

        VouchSaveRequest.VouchDetail detailWithNullAmounts = new VouchSaveRequest.VouchDetail(
                null, 1, 1, "摘要", "1001", null, null, null);

        VouchSaveRequest request = new VouchSaveRequest(
                createVouchMain(null), List.of(detailWithNullAmounts), null);

        vouchService.saveVouch(request, "admin");

        verify(detailRepository).insert(detailCaptor.capture());
        AcctVouchDetail saved = detailCaptor.getValue();
        assertEquals(BigDecimal.ZERO, saved.getAmtDebit());
        assertEquals(BigDecimal.ZERO, saved.getAmtCredit());
    }

    @Test
    void saveVouch_withNullDeletedDetails_shouldNotCallDelete() {
        when(vouchNoGenerator.nextVouchNoWithLock("01", "001", "2026", "05")).thenReturn(1);
        when(idGenerator.nextVouchId()).thenReturn(1L);
        when(idGenerator.nextDetailId()).thenReturn(10L);
        when(jdbcTemplate.queryForObject(anyString(), eq(String.class), eq("admin")))
                .thenReturn("管理员");

        VouchSaveRequest request = new VouchSaveRequest(
                createVouchMain(null),
                List.of(createDetail(null, "1001", BigDecimal.valueOf(100), BigDecimal.ZERO)),
                null);

        vouchService.saveVouch(request, "admin");

        // deleteByDetailId is called for the saved detail as part of check items full replacement
        verify(checkItemsRepository, times(1)).deleteByDetailId(anyLong());
    }

    @Test
    void resolveOperatorName_whenJdbcFails_shouldReturnAccount() {
        when(jdbcTemplate.queryForObject(anyString(), eq(String.class), eq("admin")))
                .thenThrow(new DataAccessException("") {});

        String result = vouchService.resolveOperatorName("admin");
        assertEquals("admin", result);
    }

    @Test
    void resolveOperatorName_withNullAccount_shouldReturn() {
        assertNull(vouchService.resolveOperatorName(null));
    }

    @Test
    void resolveOperatorName_withBlankAccount_shouldReturnNull() {
        assertNull(vouchService.resolveOperatorName("  "));
    }

    @Test
    void saveVouch_withNullCheckItems_shouldNotBatchInsert() {
        when(vouchNoGenerator.nextVouchNoWithLock("01", "001", "2026", "05")).thenReturn(1);
        when(idGenerator.nextVouchId()).thenReturn(1L);
        when(idGenerator.nextDetailId()).thenReturn(10L);
        when(jdbcTemplate.queryForObject(anyString(), eq(String.class), eq("admin")))
                .thenReturn("管理员");

        VouchSaveRequest.VouchDetail detailWithNullChecks = new VouchSaveRequest.VouchDetail(
                null, 1, 1, "摘要", "1001",
                BigDecimal.valueOf(100), BigDecimal.ZERO, null);

        VouchSaveRequest request = new VouchSaveRequest(
                createVouchMain(null), List.of(detailWithNullChecks), null);

        vouchService.saveVouch(request, "admin");

        verify(detailRepository).insert(any());
        // checkItems is null, so batchInsert should never be called
        verify(checkItemsRepository, never()).batchInsert(anyList());
    }

    @Test
    void saveVouch_withEmptyCheckItems_shouldDeleteThenSkipBatchInsert() {
        when(vouchNoGenerator.nextVouchNoWithLock("01", "001", "2026", "05")).thenReturn(1);
        when(idGenerator.nextVouchId()).thenReturn(1L);
        when(idGenerator.nextDetailId()).thenReturn(10L);
        when(jdbcTemplate.queryForObject(anyString(), eq(String.class), eq("admin")))
                .thenReturn("管理员");

        VouchSaveRequest.VouchDetail detailWithEmptyChecks = new VouchSaveRequest.VouchDetail(
                null, 1, 1, "摘要", "1001",
                BigDecimal.valueOf(100), BigDecimal.ZERO, List.of());

        VouchSaveRequest request = new VouchSaveRequest(
                createVouchMain(null), List.of(detailWithEmptyChecks), null);

        vouchService.saveVouch(request, "admin");

        // deleteByDetailId is called (full replacement strategy always deletes first)
        verify(checkItemsRepository).deleteByDetailId(10L);
        // but batchInsert should NOT be called for empty list
        verify(checkItemsRepository, never()).batchInsert(anyList());
    }
}
