import axios from "axios";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import Comment from "./Comment";

const Comments = ({ videoId }) => {
  const { currentUser } = useSelector((state) => state.user);

  const [comments, setComments] = useState([]);

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const res = await axios.get(`/comments/${videoId}`);
        setComments(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchComments();
  }, [videoId]);

  // TODO: ADD NEW COMMENT FUNCTIONALITY

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 mb-4">
        <img src={currentUser.img} alt="User Avatar" className="w-12 h-12 rounded-full" />
        <input
          type="text"
          placeholder="Add a comment..."
          className="flex-1 border-b border-gray-300 p-2 bg-transparent outline-none text-gray-800"
        />
      </div>
      {comments.map((comment) => (
        <Comment key={comment._id} comment={comment} />
      ))}
    </div>
  );
};

export default Comments;
