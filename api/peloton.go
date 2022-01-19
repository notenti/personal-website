package api

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
)

type PelotonWorkouts struct {
	Data []struct {
		Id string `json:"id"`
	} `json:"data"`
}

type PelotonRideResults struct {
	Ride struct {
		Title             string `json:"title"`
		FitnessDiscipline string `json:"fitness_discipline"`
		Instructor        struct {
			Name string `json:"name"`
		} `json:"instructor"`
	} `json:"ride"`
}

func (c *Client) FetchPelo(ch chan<- PelotonRideResults) {
	authValues := map[string]string{"username_or_email": c.pelotonAuth.Email, "password": c.pelotonAuth.Password}
	jsonAuth, _ := json.Marshal(authValues)
	loginResp, err := c.http.Post("https://api.onepeloton.com/auth/login", "application/x-www-form-urlencoded", bytes.NewBuffer(jsonAuth))
	if err != nil {
		ch <- PelotonRideResults{}
		return
	}
	defer loginResp.Body.Close()

	workoutResp, err := c.http.Get("https://api.onepeloton.com/api/user/5bf4d97be5a746a48ff85f281e76cd55/workouts?limit=1")
	if err != nil {
		ch <- PelotonRideResults{}
		return
	}
	defer workoutResp.Body.Close()
	workoutsBody, err := ioutil.ReadAll(workoutResp.Body)
	if err != nil {
		ch <- PelotonRideResults{}
		return
	}
	workouts := &PelotonWorkouts{}
	if err := json.Unmarshal(workoutsBody, workouts); err != nil {
		ch <- PelotonRideResults{}
		return
	}

	lastWorkoutResp, err := c.http.Get(fmt.Sprintf("https://api.onepeloton.com/api/workout/%s?joins=ride,ride.instructor&limit=1&page=0", workouts.Data[0].Id))
	if err != nil {
		ch <- PelotonRideResults{}
		return
	}
	defer lastWorkoutResp.Body.Close()

	lastWorkoutBody, err := ioutil.ReadAll(lastWorkoutResp.Body)
	if err != nil {
		ch <- PelotonRideResults{}
		return
	}

	if lastWorkoutResp.StatusCode != http.StatusOK {
		ch <- PelotonRideResults{}
		return
	}

	rideResults := &PelotonRideResults{}
	if err := json.Unmarshal(lastWorkoutBody, rideResults); err != nil {
		ch <- PelotonRideResults{}
		return
	}
	ch <- *rideResults
}