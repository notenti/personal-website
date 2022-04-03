import React from "react";

const Workout = ({ workoutDesc }) => {
  return (
    <p>
      {" "}
      {">"} Took a{" "}
      <a
        className="activity"
        href="https://members.onepeloton.com/members/notenti/overview"
      >
        {workoutDesc.Workout_title}
      </a>{" "}
      {workoutDesc.Fitness_Discipline} class on Peloton
    </p>
  );
};

export default Workout;
