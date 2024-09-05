import axios from "axios";
import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { loginFailure, loginStart, loginSuccess } from "../redux/user";
import { auth, provider } from "../firebase";
import { signInWithPopup } from "firebase/auth";
import { useNavigate } from "react-router-dom";

const SignIn = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    dispatch(loginStart());
    try {
      const res = await axios.post("/api/auth/signin", { name, password });
      dispatch(loginSuccess(res.data));
      navigate("/");
    } catch (err) {
      dispatch(loginFailure());
    }
  };

  const signInWithGoogle = async () => {
    dispatch(loginStart());
    signInWithPopup(auth, provider)
      .then((result) => {
        axios
          .post("/api/auth/google", {
            name: result.user.displayName,
            email: result.user.email,
            photo: result.user.photoURL,
          },{withCredentials:true})
          .then((res) => {
            dispatch(loginSuccess(res.data));
            navigate("/");
          });
      })
      .catch((error) => {
        dispatch(loginFailure());
      });
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100 text-gray-900">
      <div className="flex flex-col items-center bg-white border border-gray-300 p-8 gap-4 rounded-lg shadow-lg">
        <h1 className="text-2xl">Sign in</h1>
        <h2 className="text-xl font-light">to continue to StreamConnect</h2>
        <input
          className="border border-gray-300 rounded-md p-2 w-full"
          placeholder="username"
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="border border-gray-300 rounded-md p-2 w-full"
          type="password"
          placeholder="password"
          onChange={(e) => setPassword(e.target.value)}
        />
        <button
          className="bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-md cursor-pointer"
          onClick={handleLogin}
        >
          Sign in
        </button>
        <h1 className="text-2xl">or</h1>
        <button
          className="bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-md cursor-pointer"
          onClick={signInWithGoogle}
        >
          Sign in with Google
        </button>
        <h1 className="text-2xl">or</h1>
        <input
          className="border border-gray-300 rounded-md p-2 w-full"
          placeholder="username"
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="border border-gray-300 rounded-md p-2 w-full"
          placeholder="email"
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          className="border border-gray-300 rounded-md p-2 w-full"
          type="password"
          placeholder="password"
          onChange={(e) => setPassword(e.target.value)}
        />
        <button className="bg-gray-300 text-gray-800 font-medium py-2 px-4 rounded-md cursor-pointer">
          Sign up
        </button>
      </div>
      <div className="flex flex-col mt-4 text-xs text-gray-500">
        <span>English(USA)</span>
        <div className="flex mt-2">
          <span className="ml-8">Help</span>
          <span className="ml-8">Privacy</span>
          <span className="ml-8">Terms</span>
        </div>
      </div>
    </div>
  );
};

export default SignIn;
