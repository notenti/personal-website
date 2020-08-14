import './style.css'
import './simple-grid.css'
import j from './test.json'

const spotifyDOM = (spotify_info) => {
    const spotify_elem = `<p class="type-dark">Listened to <span class="highlight-activity">${spotify_info.song}</span> by <span class="highlight-activity">${spotify_info.artist}</span></p>`

    return spotify_elem
}

const githubDOM = (github_info) => {
    const github_elem = `<p class="type-dark">Pushed 1 commit to <span class="highlight-activity">${github_info.repo}</p>`

    return github_elem
}

const mediumDOM = (medium_info) => {
    const medium_elem = `<p class="type-dark">Wrote about <a class='type-dark' href=${medium_info.published}>a weird Docker workflow</a></p>`

    return medium_elem
}

const element = document.getElementById("song");
element.insertAdjacentHTML('afterbegin', spotifyDOM(j.spotify))
element.insertAdjacentHTML('afterbegin', githubDOM(j.github))
element.insertAdjacentHTML('afterbegin', mediumDOM(j.medium))
