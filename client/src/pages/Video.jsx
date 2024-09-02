import React, { useEffect, useState } from "react";
import ThumbUpOutlinedIcon from "@mui/icons-material/ThumbUpOutlined";
import ThumbDownOffAltOutlinedIcon from "@mui/icons-material/ThumbDownOffAltOutlined";
import ReplyOutlinedIcon from "@mui/icons-material/ReplyOutlined";
import AddTaskOutlinedIcon from "@mui/icons-material/AddTaskOutlined";
import ThumbDownIcon from "@mui/icons-material/ThumbDown";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import Comments from "../components/Comments";
import Card from "../components/Card";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import axios from "axios";
import { dislike, fetchSuccess, like } from "../redux/videoSlice";
import { format } from "timeago.js";
import { subscription } from '../redux/user';
import Recommendation from "../components/Recommendation";

const Video = () => {
  const { currentUser } = useSelector((state) => state.user);
  const { currentVideo } = useSelector((state) => state.video);
  const dispatch = useDispatch();

  const path = useLocation().pathname.split("/")[2];

  const [channel, setChannel] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const videoRes = await axios.get(`/videos/find/${path}`);
        const channelRes = await axios.get(`/users/find/${videoRes.data.userId}`);
        setChannel(channelRes.data);
        dispatch(fetchSuccess(videoRes.data));
      } catch (err) {}
    };
    fetchData();
  }, [path, dispatch]);

  const handleLike = async () => {
    await axios.put(`/users/like/${currentVideo._id}`);
    dispatch(like(currentUser._id));
  };
  const handleDislike = async () => {
    await axios.put(`/users/dislike/${currentVideo._id}`);
    dispatch(dislike(currentUser._id));
  };

  const handleSub = async () => {
    currentUser.subscribedUsers.includes(channel._id)
      ? await axios.put(`/users/unsub/${channel._id}`)
      : await axios.put(`/users/sub/${channel._id}`);
    dispatch(subscription(channel._id));
  };

  return (
    <div className="flex gap-6">
      <div className="flex-5">
        <div>
          <video className="max-h-[720px] w-full object-cover" src={currentVideo.videoUrl} controls />
        </div>
        <h1 className="text-lg font-normal mt-5 mb-2 text-gray-900">{currentVideo.title}</h1>
        <div className="flex items-center justify-between">
          <span className="text-gray-500">
            {currentVideo.views} views • {format(currentVideo.createdAt)}
          </span>
          <div className="flex gap-5 text-gray-900">
            <div className="flex items-center gap-1 cursor-pointer" onClick={handleLike}>
              {currentVideo.likes?.includes(currentUser?._id) ? (
                <ThumbUpIcon />
              ) : (
                <ThumbUpOutlinedIcon />
              )}{" "}
              {currentVideo.likes?.length}
            </div>
            <div className="flex items-center gap-1 cursor-pointer" onClick={handleDislike}>
              {currentVideo.dislikes?.includes(currentUser?._id) ? (
                <ThumbDownIcon />
              ) : (
                <ThumbDownOffAltOutlinedIcon />
              )}{" "}
              Dislike
            </div>
            <div className="flex items-center gap-1 cursor-pointer">
              <ReplyOutlinedIcon /> Share
            </div>
            <div className="flex items-center gap-1 cursor-pointer">
              <AddTaskOutlinedIcon /> Save
            </div>
          </div>
        </div>
        <hr className="my-4 border-gray-300" />
        <div className="flex justify-between">
          <div className="flex gap-5">
            <img className="w-12 h-12 rounded-full" src={channel.img} alt="channel" />
            <div className="flex flex-col text-gray-900">
              <span className="font-medium">{channel.name}</span>
              <span className="mt-1 mb-5 text-gray-500 text-sm">{channel.subscribers} subscribers</span>
              <p className="text-sm">{currentVideo.desc}</p>
            </div>
          </div>
          <button
            className="bg-red-600 text-white font-medium py-2 px-4 rounded cursor-pointer"
            onClick={handleSub}
          >
            {currentUser.subscribedUsers?.includes(channel._id)
              ? "SUBSCRIBED"
              : "SUBSCRIBE"}
          </button>
        </div>
        <hr className="my-4 border-gray-300" />
        <Comments videoId={currentVideo._id} />
      </div>
      <Recommendation tags={currentVideo.tags} />
    </div>
  );
};

export default Video;
