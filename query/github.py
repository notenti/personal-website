import requests
from typing import Any, Dict

def getActivity(username: str) -> Dict[Any, Any]:
    activity = requests.get(f'https://api.github.com/users/{username}/events')
    return activity.json()
