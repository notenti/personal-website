import github

def gatherGithubActivity():
    github_activity = github.getActivity('notenti')

    allowable_events = ['WatchEvent', 'IssueCommentEvent', 'PushEvent']

    event_idx = next(idx for idx, value in enumerate(
        github_activity) if value['type'] in allowable_events)
    latest_event = github_activity[event_idx]

    final = {'github': {'event_type': latest_event['type'],
                        'repo_name': latest_event['repo']['name'],
                        'num_commits': len(latest_event['payload']['commits']),
                        'url': latest_event['repo']['url']}}

    return final
