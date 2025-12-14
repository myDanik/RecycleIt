from geopy.geocoders import Nominatim

_geocoder = Nominatim(user_agent="recycle-map-app")


def geocode_address(address: str) -> tuple[float | None, float | None]:
    if not address:
        return None, None
    try:
        loc = _geocoder.geocode(address)
        if loc:
            return loc.latitude, loc.longitude
    except Exception:
        pass
    return None, None
