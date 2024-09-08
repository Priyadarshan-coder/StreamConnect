import axios from "axios";
import React, { useEffect, useState } from "react";

const Comment = ({ comment }) => {
  const [channel, setChannel] = useState({});

  useEffect(() => {
    const fetchComment = async () => {
      try {
        const res = await axios.get(`/api/users/find/${comment.userId}`);
        setChannel(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchComment();
  }, [comment.userId]);

  return (
    <div className="flex gap-2 my-8">
      <img src={channel.avatar} alt="User Avatar" className="w-12 h-12 rounded-full" />
      <div className="flex flex-col gap-2 text-gray-800">
        <span className="text-sm font-medium">
          {channel.name} <span className="text-xs font-normal text-gray-500 ml-1">1 day ago</span>
        </span>
        <span className="text-base">{comment.desc}</span>
      </div>
    </div>
  );
};

export default Comment;
