package api

import "net/http"

type SpotifyAuth struct {
	ClientId     string
	ClientSecret string
	RefreshToken string
}

type GithubAuth struct {
	Username string
}

type PelotonAuth struct {
	Email    string
	Password string
}

type Client struct {
	http        *http.Client
	spotifyAuth SpotifyAuth
	githubAuth  GithubAuth
	pelotonAuth PelotonAuth
}

func NewClient(httpClient *http.Client, spotClient, spotSecret, spotRefresh, githubUsername, peloEmail, peloPassword string) *Client {
	return &Client{
		httpClient,
		SpotifyAuth{ClientId: spotClient, ClientSecret: spotSecret, RefreshToken: spotRefresh},
		GithubAuth{Username: githubUsername},
		PelotonAuth{Email: peloEmail, Password: peloPassword},
	}
}
