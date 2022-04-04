import "./css/App.css";
import "./css/base.css";
import React from "react";
import Song from "./components/Song";
import useFetch from "react-fetch-hook";
import Workout from "./components/Workout";
import Project from "./components/Project";
import LoadingSpinner from "./components/Spinner";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";

const generateSocialLinks = (mapping) => {
  return (
    <div className="content__social__links one-third column">
      {mapping.map((social) => (
        <div key={social.platform} className="social">
          <li>
            {social.link.startsWith("https://") ? (
              <a href={social.link}>{social.platform}</a>
            ) : (
              <Link to={social.link}>{social.platform}</Link>
            )}
          </li>
        </div>
      ))}
    </div>
  );
};

const generateProjects = (mapping) => {
  return (
    <div className="project__container">
      {mapping.map((project) => (
        <Project key={project.title} projectInfo={project} />
      ))}
    </div>
  );
};

export default function App() {
  return (
    <Router>
      <div>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/resume" element={<Resume />} />
        </Routes>
      </div>
    </Router>
  );
}

function Home() {
  const songResp = useFetch("https://api.nateotenti.com/songs?limit=1");
  const workoutResp = useFetch("https://api.nateotenti.com/workouts?limit=1");

  const redirects = [
    {
      platform: "LinkedIn",
      link: "https://www.linkedin.com/in/nathan-otenti/",
    },
    { platform: "Github", link: "https://github.com/notenti" },
    { platform: "Résumé", link: "/resume" },
  ];

  const projects = [
    {
      title: "COVID-19 & Housing",
      description: "Choropleth to track market trends during COVID-19",
      link: "https://github.com/notenti/covid-housing",
    },
    {
      title: "SMOLDiR",
      description: "A smoke detector that doesn't need smoke",
      link: "https://github.com/notenti/SMOLDiR",
    },
    {
      title: "Isolation",
      description: "Game against an AI agent",
      link: "https://github.com/notenti/isolation",
    },
  ];

  const renderContent = (
    <div className="app__content two-thirds column">
      <div className="content__header">
        <h1>
          Hi, I'm Nate.
          <br />
          I'm a software engineer.
        </h1>
      </div>
      <div className="content__desc one-half column">
        <p>
          Passionate about writing expressive, maintainable code, learning about
          DevOps, trying out new programming languages, and watching Survivor.
          Software engineer at <a href="https://motional.com/">Motional</a>.
          Boston, MA.
        </p>
      </div>
      {generateSocialLinks(redirects)}
      <div className="content__subheader">
        <h3>Projects</h3>
      </div>
      {generateProjects(projects)}
      <div className="content__subheader">
        <h3>Nate recently...</h3>
      </div>
      <div className="activity__container">
        <div className="one-half column">
          {songResp.data && (
            <Song key="test" songDesc={songResp.data[0]}></Song>
          )}
        </div>
        <div className="one-half column">
          {workoutResp.data && (
            <Workout key="sdf" workoutDesc={workoutResp.data[0]}></Workout>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="app__container">
      {songResp.isLoading || workoutResp.isLoading ? (
        <LoadingSpinner />
      ) : (
        renderContent
      )}
    </div>
  );
}

function Resume() {
  return (
    <div>
      <h1>Resume</h1>
    </div>
  );
}
