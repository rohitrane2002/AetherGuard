from slowapi import Limiter
from slowapi.util import get_remote_address

# Robust global rate limiter using SlowAPI (IP based by default)
limiter = Limiter(key_func=get_remote_address, default_limits=["100/minute"])

# Keep the old one just in case it's used elsewhere, but marked as legacy
import time
from collections import defaultdict, deque

class InMemoryRateLimiter:
    def __init__(self) -> None:
        self._buckets = defaultdict(deque)

    def allow(self, key: str, limit: int, window_seconds: int) -> bool:
        now = time.time()
        bucket = self._buckets[key]
        while bucket and bucket[0] <= now - window_seconds:
            bucket.popleft()
        if len(bucket) >= limit:
            return False
        bucket.append(now)
        return True

    def get_usage(self, key: str, window_seconds: int) -> int:
        now = time.time()
        bucket = self._buckets[key]
        while bucket and bucket[0] <= now - window_seconds:
            bucket.popleft()
        return len(bucket)

    def increment(self, key: str, window_seconds: int) -> None:
        now = time.time()
        self._buckets[key].append(now)

rate_limiter = InMemoryRateLimiter()
