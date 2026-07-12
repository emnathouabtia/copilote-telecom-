"""
Cache Redis léger, utilisé devant les requêtes coûteuses (vues dashboard,
listes d'incidents). Si Redis n'est pas disponible (pas encore lancé en
Docker), le cache est simplement ignoré : l'application continue de
fonctionner directement sur PostgreSQL, juste plus lentement.
"""
import json
from typing import Any, Optional

import redis

REDIS_URL = "redis://localhost:6379/0"
DEFAULT_TTL_SECONDS = 30

try:
    _client: Optional[redis.Redis] = redis.from_url(REDIS_URL, decode_responses=True)
    _client.ping()
except Exception:
    _client = None


def get_json(key: str) -> Optional[Any]:
    if _client is None:
        return None
    try:
        raw = _client.get(key)
        return json.loads(raw) if raw else None
    except Exception:
        return None


def set_json(key: str, value: Any, ttl: int = DEFAULT_TTL_SECONDS) -> None:
    if _client is None:
        return
    try:
        _client.set(key, json.dumps(value, default=str), ex=ttl)
    except Exception:
        pass


def invalidate(key: str) -> None:
    if _client is None:
        return
    try:
        _client.delete(key)
    except Exception:
        pass


def cached(key: str, ttl: int = DEFAULT_TTL_SECONDS):
    """Décorateur simple : met en cache le résultat d'une route en lecture seule.

    Usage:
        @router.get("/kpis")
        @cached("dashboard:kpis", ttl=15)
        def get_kpis(): ...
    """

    def decorator(func):
        def wrapper(*args, **kwargs):
            hit = get_json(key)
            if hit is not None:
                return hit
            result = func(*args, **kwargs)
            set_json(key, result, ttl)
            return result

        return wrapper

    return decorator
