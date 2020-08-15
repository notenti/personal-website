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

// const mediumDOM = (medium_info) => {
//     const medium_elem = `<p class="type-dark">Wrote about <a class='type-dark' href=${medium_info.published}>a weird Docker workflow</a></p>`

//     return medium_elem
// }

const element = document.getElementById("song");
element.insertAdjacentHTML('afterbegin', spotifyDOM(activity.spotify))
element.insertAdjacentHTML('afterbegin', githubDOM(activity.github))
// element.insertAdjacentHTML('afterbegin', mediumDOM(j.medium))
