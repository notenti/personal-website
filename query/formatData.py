import json
import pathlib
from typing import Dict
import github
import spotify
import medium

APIInfo = Dict[str, str]


def gatherGithubActivity() -> APIInfo:
    """
    Return curated activity from Github.
    """
    github_activity = github.getGithubActivity('notenti')

    allowable_events = ['WatchEvent', 'IssueCommentEvent', 'PushEvent']

    event_idx = next(idx for idx, value in enumerate(
        github_activity) if value['type'] in allowable_events)
    latest_event = github_activity[event_idx]

    repo = latest_event['repo']['url'].replace('/repos', '').replace('api.', '')

    curated = {'event_type': latest_event['type'],
               'repo_name': latest_event['repo']['name'],
               'num_commits': len(latest_event['payload']['commits']),
               'url': repo
               }
    return curated

def gatherMediumActivity() -> APIInfo:
    """
    Return curated activity from Medium.
    """
    medium_activity = medium.getMediumActivity('otenti.nate')

    most_recent_story = medium_activity['items'][0]

    curated = {'title': most_recent_story['title'],
               'story_url': most_recent_story['link']
               }
    return curated


def gatherSpotifyActivity() -> APIInfo:
    """
    Return curated activity from Spotify.
    """
    spotify_activity = spotify.getSpotifyActivity()
    most_recent_song = spotify_activity['items'][0]

    curated = {'artist': most_recent_song['track']['artists'][0]['name'],
               'artist_url': most_recent_song['track']['artists'][0]['external_urls']['spotify'],
               'song': most_recent_song['track']['name'],
               'song_url': most_recent_song['track']['external_urls']['spotify']}

    return curated


def produceActivityFile(filename: str) -> None:
    collected_info = {'spotify': gatherSpotifyActivity(),
                      'github': gatherGithubActivity(),
                      'medium': gatherMediumActivity()}

    with open(filename, 'w') as f:
        json.dump(collected_info, f)


if __name__ == '__main__':
    script_dir = pathlib.Path(__file__).parent.absolute()
    produceActivityFile(filename=f'{script_dir}/../src/activity.json')
