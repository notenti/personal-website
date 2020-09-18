import requests
from typing import Any, Dict


def getGithubActivity(username: str) -> Dict[Any, Any]:
    """
    Get recent Github activity.
    """
    activity = requests.get(f'https://api.github.com/users/{username}/events')
    return activity.json()