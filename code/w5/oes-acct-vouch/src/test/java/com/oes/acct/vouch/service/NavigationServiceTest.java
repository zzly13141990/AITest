package com.oes.acct.vouch.service;

import com.oes.acct.vouch.model.dto.NavigationResult;
import com.oes.acct.vouch.model.entity.AcctVouch;
import com.oes.acct.vouch.repository.VouchRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Captor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NavigationServiceTest {

    @Mock
    private VouchRepository vouchRepository;

    @InjectMocks
    private NavigationService navigationService;

    @Captor
    private ArgumentCaptor<Long> longCaptor;

    @Captor
    private ArgumentCaptor<Integer> intCaptor;

    private AcctVouch createVouch(Long id, Integer no) {
        AcctVouch v = new AcctVouch();
        v.setVouchId(id);
        v.setVouchNo(no);
        return v;
    }

    @Test
    void navigate_next_shouldReturnNextVoucher() {
        AcctVouch current = createVouch(1L, 5);
        AcctVouch next = createVouch(2L, 6);

        when(vouchRepository.findByPeriod(eq("01"), eq("001"), eq("2026"), eq("05"),
                eq(1L), eq(5), eq("next"), eq(1)))
                .thenReturn(List.of(next));
        when(vouchRepository.findByPeriod(eq("01"), eq("001"), eq("2026"), eq("05"),
                eq(2L), eq(6), eq("prev"), eq(1)))
                .thenReturn(List.of(current));
        when(vouchRepository.findByPeriod(eq("01"), eq("001"), eq("2026"), eq("05"),
                eq(2L), eq(6), eq("next"), eq(1)))
                .thenReturn(List.of());

        NavigationResult result = navigationService.navigate(1L, "next", "01", "001", "2026", "05", 5);

        assertNotNull(result);
        assertEquals(2L, result.vouchId());
        assertEquals(6, result.vouchNo());
        assertTrue(result.hasPrev());
        assertFalse(result.hasNext());
    }

    @Test
    void navigate_prev_shouldReturnPrevVoucher() {
        AcctVouch prev = createVouch(1L, 4);

        when(vouchRepository.findByPeriod(eq("01"), eq("001"), eq("2026"), eq("05"),
                eq(2L), eq(5), eq("prev"), eq(1)))
                .thenReturn(List.of(prev));
        when(vouchRepository.findByPeriod(eq("01"), eq("001"), eq("2026"), eq("05"),
                eq(1L), eq(4), eq("prev"), eq(1)))
                .thenReturn(List.of());
        when(vouchRepository.findByPeriod(eq("01"), eq("001"), eq("2026"), eq("05"),
                eq(1L), eq(4), eq("next"), eq(1)))
                .thenReturn(List.of(createVouch(2L, 5)));

        NavigationResult result = navigationService.navigate(2L, "prev", "01", "001", "2026", "05", 5);

        assertNotNull(result);
        assertEquals(1L, result.vouchId());
        assertEquals(4, result.vouchNo());
        assertFalse(result.hasPrev());
        assertTrue(result.hasNext());
    }

    @Test
    void navigate_whenNoNextVoucher_shouldReturnNoNext() {
        when(vouchRepository.findByPeriod(eq("01"), eq("001"), eq("2026"), eq("05"),
                eq(5L), eq(10), eq("next"), eq(1)))
                .thenReturn(List.of());

        NavigationResult result = navigationService.navigate(5L, "next", "01", "001", "2026", "05", 10);

        assertNull(result.vouchId());
        assertNull(result.vouchNo());
        assertFalse(result.hasPrev());
        assertFalse(result.hasNext());
    }

    @Test
    void navigate_withNullVouchId_shouldGetBoundaryForNext() {
        AcctVouch first = createVouch(1L, 1);
        when(vouchRepository.findByPeriod(eq("01"), eq("001"), eq("2026"), eq("05"),
                eq(0L), eq(0), eq("next"), eq(1)))
                .thenReturn(List.of(first));

        NavigationResult result = navigationService.navigate(null, "next", "01", "001", "2026", "05", null);

        assertNotNull(result);
        assertEquals(1L, result.vouchId());
        assertEquals(1, result.vouchNo());
        assertFalse(result.hasPrev());
        assertTrue(result.hasNext());
    }

    @Test
    void navigate_withNullVouchId_whenPrev_shouldGetBoundaryForPrev() {
        AcctVouch last = createVouch(10L, 20);
        when(vouchRepository.findByPeriod(eq("01"), eq("001"), eq("2026"), eq("05"),
                eq(Long.MAX_VALUE), eq(Integer.MAX_VALUE), eq("prev"), eq(1)))
                .thenReturn(List.of(last));

        NavigationResult result = navigationService.navigate(null, "prev", "01", "001", "2026", "05", null);

        assertNotNull(result);
        assertEquals(10L, result.vouchId());
        assertEquals(20, result.vouchNo());
        assertTrue(result.hasPrev());
        assertFalse(result.hasNext());
    }

    @Test
    void navigate_withNullVouchId_whenNoVouchers_shouldReturnEmpty() {
        when(vouchRepository.findByPeriod(anyString(), anyString(), anyString(), anyString(),
                eq(0L), eq(0), eq("next"), eq(1)))
                .thenReturn(List.of());

        NavigationResult result = navigationService.navigate(null, "next", "01", "001", "2026", "05", null);

        assertNull(result.vouchId());
        assertNull(result.vouchNo());
        assertFalse(result.hasPrev());
        assertFalse(result.hasNext());
    }
}
