import requests
from typing import Any, Dict


def getMediumActivity(username: str) -> Dict[Any, Any]:
    """
    Get recent Medium activity.
    """
    activity = requests.get(f'https://api.rss2json.com/v1/api.json?rss_url=https://medium.com/feed/@{username}')
    return activity.json()

