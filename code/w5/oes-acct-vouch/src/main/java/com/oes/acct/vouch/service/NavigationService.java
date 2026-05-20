package com.oes.acct.vouch.service;

import com.oes.acct.vouch.model.dto.NavigationResult;
import com.oes.acct.vouch.model.dto.VouchLoadResponse;
import com.oes.acct.vouch.model.entity.AcctVouch;
import com.oes.acct.vouch.repository.VouchRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class NavigationService {

    private static final Logger log = LoggerFactory.getLogger(NavigationService.class);

    private final VouchRepository vouchRepository;

    public NavigationService(VouchRepository vouchRepository) {
        this.vouchRepository = vouchRepository;
    }

    /**
     * Navigate to previous or next voucher.
     */
    public NavigationResult navigate(Long vouchId, String direction, String compCode, String copyCode,
                                     String acctYear, String acctMonth, Integer vouchNo) {
        if (vouchId == null || vouchNo == null) {
            // Get boundary voucher info
            return getBoundaryVoucher(compCode, copyCode, acctYear, acctMonth, direction);
        }

        String orderDir = "next".equals(direction) ? "next" : "prev";
        List<AcctVouch> vouchers = vouchRepository.findByPeriod(
                compCode, copyCode, acctYear, acctMonth, vouchId, vouchNo, orderDir, 1);

        if (vouchers.isEmpty()) {
            return new NavigationResult(null, null, false, false);
        }

        AcctVouch target = vouchers.getFirst();
        boolean hasPrev = checkHasPrev(target.getVouchId(), target.getVouchNo(),
                compCode, copyCode, acctYear, acctMonth);
        boolean hasNext = checkHasNext(target.getVouchId(), target.getVouchNo(),
                compCode, copyCode, acctYear, acctMonth);

        return new NavigationResult(target.getVouchId(), target.getVouchNo(), hasPrev, hasNext);
    }

    private NavigationResult getBoundaryVoucher(String compCode, String copyCode, String acctYear,
                                                 String acctMonth, String direction) {
        if ("prev".equals(direction)) {
            // Get the last voucher in the period
            List<AcctVouch> vouchers = vouchRepository.findByPeriod(
                    compCode, copyCode, acctYear, acctMonth,
                    Long.MAX_VALUE, Integer.MAX_VALUE, "prev", 1);
            if (!vouchers.isEmpty()) {
                AcctVouch v = vouchers.getFirst();
                return new NavigationResult(v.getVouchId(), v.getVouchNo(), true, false);
            }
        } else {
            // Get the first voucher in the period
            List<AcctVouch> vouchers = vouchRepository.findByPeriod(
                    compCode, copyCode, acctYear, acctMonth,
                    0L, 0, "next", 1);
            if (!vouchers.isEmpty()) {
                AcctVouch v = vouchers.getFirst();
                return new NavigationResult(v.getVouchId(), v.getVouchNo(), false, true);
            }
        }
        return new NavigationResult(null, null, false, false);
    }

    private boolean checkHasPrev(Long vouchId, Integer vouchNo, String compCode, String copyCode,
                                 String acctYear, String acctMonth) {
        List<AcctVouch> prev = vouchRepository.findByPeriod(
                compCode, copyCode, acctYear, acctMonth, vouchId, vouchNo, "prev", 1);
        return !prev.isEmpty();
    }

    private boolean checkHasNext(Long vouchId, Integer vouchNo, String compCode, String copyCode,
                                 String acctYear, String acctMonth) {
        List<AcctVouch> next = vouchRepository.findByPeriod(
                compCode, copyCode, acctYear, acctMonth, vouchId, vouchNo, "next", 1);
        return !next.isEmpty();
    }
}
