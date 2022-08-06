import React from "react";

const Song = ({ songDesc }) => {
  return (
    <p>
      {">"} Listened to{" "}
      <a className="activity" href={songDesc.Track_url}>
        {songDesc.Track_name}
      </a>{" "}
      by{" "}
      <a className="activity" href={songDesc.Artist_url}>
        {songDesc.Artist_name}
      </a>
    </p>
  );
};

export default Song;
