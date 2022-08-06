import React from "react";

const Project = ({ projectInfo }) => {
  return (
    <div className="content__project four columns">
      <a href={projectInfo.link}>
        <div>
          <h3>{projectInfo.title}</h3>
          <p>{projectInfo.description}</p>
        </div>
      </a>
    </div>
  );
};

export default Project;
