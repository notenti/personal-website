import requests
import os
from typing import Dict, Any

def getSpotifyActivity() -> Dict[Any, Any]:
    """
    Get most recent Spotify activity in
    the form of the most recent songs played.
    """
    def getAccessToken() -> Dict[Any, Any]:
        """
        Get access token used to make Spotify API requests.
        """
        refresh_token = os.environ['SPOTIFY_REFRESH_TOKEN']
        client_id = os.environ['SPOTIFY_CLIENT_ID']
        client_secret = os.environ['SPOTIFY_CLIENT_SECRET']

        payload = {'refresh_token': refresh_token,
                   'grant_type':'refresh_token'}

        access_response = requests.post('https://accounts.spotify.com/api/token',
                                        data=payload,
                                        auth=(client_id, client_secret))
        return access_response.json()['access_token']


    query_response = requests.get('https://api.spotify.com/v1/me/player/recently-played',
                                    headers={'Content-Type': 'application/json',
                                    'Authorization': f'Bearer {getAccessToken()}'})

    return query_response.json()