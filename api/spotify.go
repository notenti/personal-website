package api

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"net/url"
	"strings"
)

type SpotifyRefreshResponse struct {
	AccessToken string `json:"access_token"`
}

type SpotifyRecentlyPlayedResults struct {
	Items []struct {
		Track struct {
			Artists []struct {
				Name         string `json:"name"`
				ExternalUrls struct {
					ArtistUrl string `json:"spotify"`
				} `json:"external_urls"`
			} `json:"artists"`
			Name         string `json:"name"`
			ExternalUrls struct {
				SongUrl string `json:"spotify"`
			} `json:"external_urls"`
		} `json:"track"`
	} `json:"items"`
}

type SpotifyLastTrackInfo struct {
	Artist    string
	ArtistUrl string
	Track     string
	TrackUrl  string
}

func (c *Client) FetchSpotify() (SpotifyLastTrackInfo, error) {
	v := url.Values{}
	v.Set("refresh_token", c.spotifyAuth.RefreshToken)
	v.Set("grant_type", "refresh_token")

	req, err := http.NewRequest("POST", "https://accounts.spotify.com/api/token", strings.NewReader(v.Encode()))
	req.Header.Add("Content-Type", "application/x-www-form-urlencoded")
	if err != nil {
		return SpotifyLastTrackInfo{}, nil
	}

	req.SetBasicAuth(c.spotifyAuth.ClientId, c.spotifyAuth.ClientSecret)
	resp, err := c.http.Do(req)
	if err != nil {
		return SpotifyLastTrackInfo{}, err
	}
	bodyText, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return SpotifyLastTrackInfo{}, nil
	}
	accessResp := &SpotifyRefreshResponse{}
	if err := json.Unmarshal(bodyText, accessResp); err != nil {
		return SpotifyLastTrackInfo{}, err
	}

	lastPlayedReq, err := http.NewRequest("GET", "https://api.spotify.com/v1/me/player/recently-played?limit=1", nil)
	if err != nil {
		return SpotifyLastTrackInfo{}, err
	}

	lastPlayedReq.Header.Add("Content-Type", "application/json")
	lastPlayedReq.Header.Add("Authorization", fmt.Sprintf("Bearer %s", accessResp.AccessToken))
	lastPlayedResp, err := c.http.Do(lastPlayedReq)
	if err != nil {
		return SpotifyLastTrackInfo{}, err
	}
	lastPlayedText, err := ioutil.ReadAll(lastPlayedResp.Body)
	if err != nil {
		return SpotifyLastTrackInfo{}, err
	}

	recentlyPlayed := &SpotifyRecentlyPlayedResults{}
	if err := json.Unmarshal(lastPlayedText, recentlyPlayed); err != nil {
		return SpotifyLastTrackInfo{}, nil
	}

	lastTrack := recentlyPlayed.Items[0]
	return SpotifyLastTrackInfo{
		Artist:    lastTrack.Track.Artists[0].Name,
		ArtistUrl: lastTrack.Track.Artists[0].ExternalUrls.ArtistUrl,
		Track:     lastTrack.Track.Name,
		TrackUrl:  lastTrack.Track.ExternalUrls.SongUrl,
	}, nil
}
