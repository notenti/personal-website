package api

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"strings"
)

type Commit struct {
	Sha string `json:"sha"`
}

type GithubResults struct {
	Id   string `json:"id"`
	Type string `json:"type"`
	Repo struct {
		Id   int    `json:"id"`
		Name string `json:"name"`
		Url  string `json:"url"`
	} `json:"repo"`
	Payload struct {
		Commits []Commit `json:"commits"`
	}
}

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

func (c *Client) FetchGithub() (*GithubResults, error) {
	endpoint := fmt.Sprintf("https://api.github.com/users/%s/events", c.githubAuth.Username)
	resp, err := c.http.Get(endpoint)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf(string(body))
	}

	results := &[]GithubResults{}
	if err := json.Unmarshal(body, results); err != nil {
		return nil, err
	}

	for _, res := range *results {
		if res.Type == "PushEvent" {
			res.Repo.Url = strings.Replace(strings.Replace(res.Repo.Url, "api.", "", -1), "/repos", "", -1)
			return &res, nil
		}
	}
	return nil, fmt.Errorf("no push events in github history")
}
