package com.sqlserver.mcp.llm;

import com.sqlserver.mcp.model.error.LlmApiException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.Instant;
import java.util.concurrent.Callable;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;
import java.util.concurrent.locks.ReentrantLock;

public class CircuitBreaker {
    private static final Logger log = LoggerFactory.getLogger(CircuitBreaker.class);

    enum State { CLOSED, OPEN, HALF_OPEN }

    private final int slidingWindowSize;
    private final double failureRateThreshold;
    private final long waitDurationInOpenNanos;
    private final int permittedCallsInHalfOpen;

    private final AtomicReference<State> state = new AtomicReference<>(State.CLOSED);
    private final AtomicInteger failureCount = new AtomicInteger(0);
    private final AtomicInteger callCount = new AtomicInteger(0);
    private final AtomicReference<Instant> lastFailureTime = new AtomicReference<>(Instant.now());
    private final ReentrantLock stateLock = new ReentrantLock();

    public CircuitBreaker() {
        this(10, 0.5, 30_000_000_000L, 3); // defaults: 10 window, 50%, 30s, 3 half-open calls
    }

    public CircuitBreaker(int slidingWindowSize, double failureRateThreshold,
                          long waitDurationInOpenNanos, int permittedCallsInHalfOpen) {
        this.slidingWindowSize = slidingWindowSize;
        this.failureRateThreshold = failureRateThreshold;
        this.waitDurationInOpenNanos = waitDurationInOpenNanos;
        this.permittedCallsInHalfOpen = permittedCallsInHalfOpen;
    }

    public <T> T executeSupplier(Callable<T> supplier) throws LlmApiException {
        if (!isCallPermitted()) {
            throw new LlmApiException("Circuit breaker is OPEN, call rejected");
        }

        try {
            var result = supplier.call();
            onSuccess();
            return result;
        } catch (LlmApiException e) {
            onFailure();
            throw e;
        } catch (Exception e) {
            onFailure();
            throw new LlmApiException("Circuit breaker caught exception: " + e.getMessage(), e);
        }
    }

    private boolean isCallPermitted() {
        var currentState = state.get();
        return switch (currentState) {
            case CLOSED -> true;
            case OPEN -> {
                var lastFailure = lastFailureTime.get();
                if (Instant.now().isAfter(lastFailure.plusNanos(waitDurationInOpenNanos))) {
                    if (state.compareAndSet(State.OPEN, State.HALF_OPEN)) {
                        log.info("Circuit breaker transitioning from OPEN to HALF_OPEN");
                        yield true;
                    }
                    yield state.get() != State.OPEN;
                }
                yield false;
            }
            case HALF_OPEN -> {
                // In half-open, only allow permittedCallsInHalfOpen concurrent calls
                if (callCount.get() < permittedCallsInHalfOpen) {
                    yield true;
                }
                yield false;
            }
        };
    }

    private void onSuccess() {
        var currentState = state.get();
        if (currentState == State.HALF_OPEN) {
            stateLock.lock();
            try {
                if (state.compareAndSet(State.HALF_OPEN, State.CLOSED)) {
                    resetCounters();
                    log.info("Circuit breaker transitioning from HALF_OPEN to CLOSED");
                }
            } finally {
                stateLock.unlock();
            }
        }
        // In CLOSED state, reset counters periodically to avoid unbounded growth
        var currentCount = callCount.incrementAndGet();
        if (currentCount > slidingWindowSize * 2) {
            resetCounters();
        }
    }

    private void onFailure() {
        lastFailureTime.set(Instant.now());
        failureCount.incrementAndGet();
        callCount.incrementAndGet();

        var currentState = state.get();
        if (currentState == State.HALF_OPEN) {
            stateLock.lock();
            try {
                if (state.compareAndSet(State.HALF_OPEN, State.OPEN)) {
                    log.warn("Circuit breaker transitioning from HALF_OPEN to OPEN after failure");
                }
            } finally {
                stateLock.unlock();
            }
        } else if (currentState == State.CLOSED) {
            var currentFailureRate = (double) failureCount.get() / Math.max(1, callCount.get());
            if (callCount.get() >= slidingWindowSize && currentFailureRate >= failureRateThreshold) {
                stateLock.lock();
                try {
                    if (state.compareAndSet(State.CLOSED, State.OPEN)) {
                        log.warn("Circuit breaker transitioning from CLOSED to OPEN: failure rate={}",
                            String.format("%.2f", currentFailureRate));
                    }
                } finally {
                    stateLock.unlock();
                }
            }
        }
    }

    private void resetCounters() {
        failureCount.set(0);
        callCount.set(0);
    }

    State getState() {
        return state.get();
    }
}
