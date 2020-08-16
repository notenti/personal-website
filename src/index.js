import './style.css'
import './simple-grid.css'
import activity from './activity.json'

const spotifyDOM = (spotify_info) => {
    const spotify_elem = `<p class="type-dark">> Listened to <a class='activity' href=${spotify_info.song_url}>${spotify_info.song}</a> by <a class='activity' href=${spotify_info.artist_url}>${spotify_info.artist}</a></p>`

    return spotify_elem
}

const githubDOM = (github_info) => {
    const github_elem = `<p class="type-dark"> > Pushed ${github_info.num_commits} commit to <a class='activity' href=${github_info.url}>${github_info.repo_name}</p>`

    return github_elem
}

const mediumDOM = (medium_info) => {
    const medium_elem = `<p class="type-dark"> > Wrote about <a class='activity' href=${medium_info.story_url}>${medium_info.title}</a></p>`

    return medium_elem
}

const left_elem = document.getElementById('left-activity');
const right_elem = document.getElementById('right-activity')

left_elem.insertAdjacentHTML('afterbegin', spotifyDOM(activity.spotify))
left_elem.insertAdjacentHTML('afterbegin', githubDOM(activity.github))
right_elem.insertAdjacentHTML('afterbegin', mediumDOM(activity.medium))
