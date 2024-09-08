import React, { useEffect, useState } from "react";
import Card from "../components/Card";
import axios from "axios";

const Home = ({ type }) => {
  const [videos, setVideos] = useState([]);

  useEffect(() => {
    const fetchVideos = async () => {
      const res = await axios.get(`/api/videos/${type}`);
      //console.log(res);
      setVideos(res.data);
    };
    fetchVideos();
  }, [type]);

  return (
    <div className="flex justify-between flex-wrap">
      {videos.map((video) => (
        <Card key={video.id} video={video} />
      ))}
    </div>
  );
};

export default Home;
