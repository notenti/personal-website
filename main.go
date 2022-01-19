package main

import (
	"bytes"
	"fmt"
	"html/template"
	"log"
	"net/http"
	"net/http/cookiejar"
	"os"
	"time"

	"github.com/joho/godotenv"
	"github.com/notenti/personal-website/api"
)

type GithubTemplateResults struct {
	LatestCommitString string
	RepoName           string
	RepoUrl            string
}

type SpotifyTemplateResults struct {
	ArtistName string
	ArtistUrl  string
	TrackName  string
	TrackUrl   string
}

type PelotonTemplateResults struct {
	FitnessDiscipline string
	RideTitle         string
	InstructorName    string
}

type ApiResults struct {
	Github  GithubTemplateResults
	Peloton PelotonTemplateResults
	Spotify SpotifyTemplateResults
}

var tpl = template.Must(template.ParseFiles("index.html"))

func createCommitString(commits []api.Commit) string {
	numCommits := len(commits)
	if numCommits == 1 {
		return fmt.Sprintf("%d commit", numCommits)
	}
	return fmt.Sprintf("%d commits", numCommits)
}

func indexHandler(api *api.Client) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		githubData, err := api.FetchGithub()
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		ghTemplate := GithubTemplateResults{
			LatestCommitString: createCommitString(githubData.Payload.Commits),
			RepoName:           githubData.Repo.Name,
			RepoUrl:            githubData.Repo.Url,
		}

		peloData, err := api.FetchPelo()
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		peloTemplate := PelotonTemplateResults{
			RideTitle:         peloData.Ride.Title,
			FitnessDiscipline: peloData.Ride.FitnessDiscipline,
			InstructorName:    peloData.Ride.Instructor.Name,
		}

		spotData, err := api.FetchSpotify()
		if err != nil {
			fmt.Println(err)
		}
		spotTemplate := SpotifyTemplateResults{
			ArtistName: spotData.Artist,
			ArtistUrl:  spotData.ArtistUrl,
			TrackName:  spotData.Track,
			TrackUrl:   spotData.TrackUrl,
		}

		apiRes := &ApiResults{
			Github:  ghTemplate,
			Peloton: peloTemplate,
			Spotify: spotTemplate,
		}
		buf := &bytes.Buffer{}
		if err := tpl.Execute(buf, apiRes); err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}
		buf.WriteTo(w)
	}
}

func main() {

	if err := godotenv.Load(); err != nil {
		log.Println("Error loading .env file")
	}
	port := os.Getenv("PORT")
	if port == "" {
		port = "3000"
	}

	githubUsername := os.Getenv("GITHUB_USERNAME")
	if githubUsername == "" {
		log.Fatal("Env: github username must be set")
	}

	spotifyClientId := os.Getenv("SPOTIFY_CLIENT_ID")
	spotifySecret := os.Getenv("SPOTIFY_CLIENT_SECRET")
	spotifyRefresh := os.Getenv("SPOTIFY_REFRESH_TOKEN")
	peloEmail := os.Getenv("PELOTON_EMAIL")
	peloPassword := os.Getenv("PELOTON_PASSWORD")

	jar, _ := cookiejar.New(nil)
	client := &http.Client{Timeout: 10 * time.Second, Jar: jar}

	apis := api.NewClient(
		client,
		spotifyClientId,
		spotifySecret,
		spotifyRefresh,
		githubUsername,
		peloEmail,
		peloPassword)

	fs := http.FileServer(http.Dir("assets"))

	mux := http.NewServeMux()
	mux.Handle("/assets/", http.StripPrefix("/assets/", fs))
	mux.HandleFunc("/", indexHandler(apis))
	http.ListenAndServe(":"+port, mux)
}
