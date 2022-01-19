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

func (c *Client) FetchGithub(ch chan<- GithubResults) {
	endpoint := fmt.Sprintf("https://api.github.com/users/%s/events", c.githubAuth.Username)
	resp, err := c.http.Get(endpoint)
	if err != nil {
		ch <- GithubResults{}
		return
	}
	defer resp.Body.Close()

	body, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		ch <- GithubResults{}
		return
	}

	if resp.StatusCode != http.StatusOK {
		ch <- GithubResults{}
		return
	}

	results := &[]GithubResults{}
	if err := json.Unmarshal(body, results); err != nil {
		ch <- GithubResults{}
		return
	}

	for _, res := range *results {
		if res.Type == "PushEvent" {
			res.Repo.Url = strings.Replace(strings.Replace(res.Repo.Url, "api.", "", -1), "/repos", "", -1)
			ch <- res
			return
		}
	}
	ch <- GithubResults{}
}
