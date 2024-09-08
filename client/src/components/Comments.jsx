import axios from "axios";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import Comment from "./Comment";

const Comments = ({ videoId }) => {
  const { currentUser } = useSelector((state) => state.user);

  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState(""); // State for the new comment

  useEffect(() => {
    const fetchComments = async () => {
      try {
        const res = await axios.get(`/api/comments/${videoId}`);
        setComments(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchComments();
  }, [videoId]);

  const handleAddComment = async () => {
    if (newComment.trim() === "") return; // Do not allow empty comments

    try {
      const res = await axios.post("/api/comments", {
        videoId,
        desc: newComment,
      });

      setComments([res.data, ...comments]); // Add the new comment to the top of the list
      setNewComment(""); // Clear the input field after submission
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 mb-4">
        <img
          src={currentUser.avatar}
          alt="User Avatar"
          className="w-12 h-12 rounded-full"
        />
        <input
          type="text"
          value={newComment} // Bind the input to the newComment state
          onChange={(e) => setNewComment(e.target.value)} // Update the newComment state
          placeholder="Add a comment..."
          className="flex-1 border-b border-gray-300 p-2 bg-transparent outline-none text-gray-800"
        />
        <button
          onClick={handleAddComment}
          className="bg-gray-500 text-white py-1 px-3 rounded"
        >
          Comment
        </button>
      </div>

      {comments.map((comment) => (
        <Comment key={comment.id} comment={comment} />
      ))}
    </div>
  );
};

export default Comments;
