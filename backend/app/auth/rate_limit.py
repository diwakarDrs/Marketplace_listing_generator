"""Small in-process sliding-window limiter for auth endpoints.

State is per-process (not shared between workers/containers); it blunts online
guessing against a single instance. Put a shared limiter (e.g. at the proxy)
in front for multi-replica deployments.
"""

import threading
import time
from collections import deque

from fastapi import Request

from app.config import get_settings
from app.exceptions import RateLimitedError

_SWEEP_EVERY = 500

_lock = threading.Lock()
_hits: dict[str, deque[float]] = {}
_calls = 0


def reset() -> None:
    with _lock:
        _hits.clear()


def client_ip(request: Request) -> str:
    return request.client.host if request.client else "unknown"


def _sweep(now: float, window: float) -> None:
    for key in [k for k, q in _hits.items() if not q or q[-1] <= now - window]:
        del _hits[key]


def hit(key: str, limit: int, window: float) -> None:
    """Record one attempt for ``key``; raise RateLimitedError when over ``limit``."""
    global _calls
    now = time.monotonic()
    with _lock:
        _calls += 1
        if _calls % _SWEEP_EVERY == 0:
            _sweep(now, window)
        q = _hits.setdefault(key, deque())
        while q and q[0] <= now - window:
            q.popleft()
        if len(q) >= limit:
            retry = max(1, int(q[0] + window - now) + 1)
            raise RateLimitedError("Too many attempts, try again later", retry_after=retry)
        q.append(now)


def limit_auth(request: Request, action: str, email: str | None = None, factor: int = 1) -> None:
    """Apply per-IP and (optionally) per-email limits for an auth ``action``."""
    s = get_settings()
    limit = s.AUTH_RATE_LIMIT_ATTEMPTS * factor
    window = float(s.AUTH_RATE_LIMIT_WINDOW_SECONDS)
    hit(f"{action}:ip:{client_ip(request)}", limit, window)
    if email:
        hit(f"{action}:email:{email.strip().lower()}", limit, window)
