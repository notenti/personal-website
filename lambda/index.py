from __future__ import annotations
import os
from typing import Any, Dict, List
import requests
import json
from decimal import Decimal
import boto3
from datetime import datetime, timedelta
from dataclasses import dataclass


@dataclass
class PelotonWorkoutModel:
    id: str
    fitness_dicipline: str
    timestamp: int
    total_work: float
    difficulty: float
    duration_s: int
    workout_title: str
    was_personal_record: bool

    def as_dynamo_dict(self) -> dict[str, Any]:
        data = {
            "id": self.id,
            "fitness_discipline": self.fitness_dicipline,
            "timestamp": self.timestamp,
            "total_work": self.total_work,
            "difficulty": self.difficulty,
            "duration": self.duration_s,
            "workout_title": self.workout_title,
            "was_personal_record": self.was_personal_record,
        }
        return json.loads(json.dumps(data), parse_float=Decimal)


@dataclass
class SpotifyRecentlyPlayedModel:
    id: str
    year: int
    timestamp: int
    expiration_timestamp: int
    track_name: str
    album_name: str
    artist_name: str
    track_url: str
    album_url: str
    artist_url: str

    def as_dynamo_dict(self) -> Dict[str, Any]:
        data = {
            "year": self.year,
            "timestamp": self.timestamp,
            "expiration_timestamp": self.expiration_timestamp,
            "id": self.id,
            "track_name": self.track_name,
            "album_name": self.album_name,
            "artist_name": self.artist_name,
            "track_url": self.track_url,
            "album_url": self.album_url,
            "artist_url": self.artist_url,
        }
        return json.loads(json.dumps(data), parse_float=Decimal)


def datetime_to_epoch(str_datetime: str) -> int:
    datetime_format = "%Y-%m-%dT%H:%M:%S.%fZ"
    converted = datetime.strptime(str_datetime, datetime_format)
    epoch = datetime.utcfromtimestamp(0)
    return int((converted - epoch).total_seconds() * 1000)


def recently_played_json_to_model(
    raw_recently_played: Dict[Any, Any]
) -> SpotifyRecentlyPlayedModel:

    play_time = datetime_to_epoch(raw_recently_played["played_at"])
    two_weeks_from_play_time = int(
        (play_time + timedelta(weeks=2).total_seconds() * 1000) / 1000
    )
    return SpotifyRecentlyPlayedModel(
        year=2022,
        id=raw_recently_played["track"]["id"],
        timestamp=datetime_to_epoch(raw_recently_played["played_at"]),
        expiration_timestamp=two_weeks_from_play_time,
        track_name=raw_recently_played["track"]["name"],
        album_name=raw_recently_played["track"]["album"]["name"],
        artist_name=raw_recently_played["track"]["artists"][0]["name"],
        track_url=raw_recently_played["track"]["external_urls"]["spotify"],
        album_url=raw_recently_played["track"]["album"]["external_urls"]["spotify"],
        artist_url=raw_recently_played["track"]["artists"][0]["external_urls"][
            "spotify"
        ],
    )


def workout_json_to_model(raw_workout: Dict[Any, Any]) -> PelotonWorkoutModel:
    ride = raw_workout["ride"]
    return PelotonWorkoutModel(
        id=raw_workout["id"],
        fitness_dicipline=ride["fitness_discipline"],
        timestamp=raw_workout["start_time"],
        total_work=raw_workout["total_work"],
        difficulty=ride["difficulty_estimate"],
        duration_s=ride["duration"],
        workout_title=ride["title"],
        was_personal_record=raw_workout["is_total_work_personal_record"],
    )


def getSpotifyAccessToken() -> str:
    """
    Get access token used to make Spotify API requests.
    """
    refresh_token = os.environ["SPOTIFY_REFRESH_TOKEN"]
    client_id = os.environ["SPOTIFY_CLIENT_ID"]
    client_secret = os.environ["SPOTIFY_CLIENT_SECRET"]

    payload = {"refresh_token": refresh_token, "grant_type": "refresh_token"}

    access_response = requests.post(
        "https://accounts.spotify.com/api/token",
        data=payload,
        auth=(client_id, client_secret),
    )
    return access_response.json()["access_token"]


def getSpotifyActivity(limit: int = 20):
    """
    Get most recent Spotify activity in
    the form of the most recent songs played.
    """

    query_response = requests.get(
        f"https://api.spotify.com/v1/me/player/recently-played?limit={limit}",
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {getSpotifyAccessToken()}",
        },
    )
    return [
        recently_played_json_to_model(rec_played)
        for rec_played in query_response.json()["items"]
    ]


def authenticatePeloton(pelo_username: str, pelo_pw: str) -> requests.Session:
    s = requests.Session()
    payload = {"username_or_email": pelo_username, "password": pelo_pw}
    s.post("https://api.onepeloton.com/auth/login", json=payload)
    return s


def getPelotonActivity() -> List[PelotonWorkoutModel]:

    pelo_username = os.environ["PELOTON_USERNAME"]
    pelo_password = os.environ["PELOTON_PASSWORD"]
    pelo_user_token = os.environ["PELOTON_USER_TOKEN"]

    session = authenticatePeloton(pelo_username, pelo_password)
    
    user_workouts_endpoint = (
        f"https://api.onepeloton.com/api/user/{pelo_user_token}/workouts"
    )
    specific_workout_endpoint = "https://api.onepeloton.com/api/workout"

    page_num = 0
    total_pages = float("inf")
    workout_ids = []
    while page_num != total_pages:
        resp = session.get(f"{user_workouts_endpoint}?page={page_num}")
        if resp.status_code != 200:
            break
        content = resp.json()
        total_pages = content["page_count"]
        page_num += 1
        workout_ids.extend([workout["id"] for workout in content["data"]])
    workout_models = []
    for workout_id in workout_ids:
        resp = session.get(f"{specific_workout_endpoint}/{workout_id}")
        if resp.status_code != 200:
            break
        content = resp.json()
        workout_models.append(workout_json_to_model(content))
    return workout_models


def handler(event, context):
    print("Getting spotify activity...")
    latest_played = getSpotifyActivity()
    print(f"Got {len(latest_played)} songs!")
    print("Getting Peloton activities...")
    latest_workouts = getPelotonActivity()
    print(f"Got {len(latest_workouts)} workouts!")
    dynamodb = boto3.resource("dynamodb")
    for model in latest_played:
        dynamodb.Table("spotify").put_item(Item=model.as_dynamo_dict())

    for model in latest_workouts:
        dynamodb.Table("peloton").put_item(Item=model.as_dynamo_dict())
