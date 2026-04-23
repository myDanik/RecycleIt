from geopy.geocoders import Nominatim
from geopy.extra.rate_limiter import RateLimiter
import time
import logging

logger = logging.getLogger(__name__)

_geocoder = Nominatim(
    user_agent="recycle-map-app",
    timeout=5
)

_geocode = RateLimiter(
    _geocoder.geocode,
    min_delay_seconds=1,
    swallow_exceptions=False
)


def geocode_address(address: str, retries: int = 3) -> tuple[float | None, float | None]:
    if not address or not address.strip():
        return None, None

    address = address.strip()

    for attempt in range(retries):
        try:
            loc = _geocode(address)

            if loc:
                lat = float(loc.latitude)
                lng = float(loc.longitude)

                return lat, lng

            logger.info(f"No geocoding result for: {address}")
            return None, None

        except Exception as e:
            logger.warning(
                f"Geocoding error (attempt {attempt + 1}/{retries}) "
                f"for address='{address}': {e}"
            )

            time.sleep(1.5 * (attempt + 1))

    return None, None