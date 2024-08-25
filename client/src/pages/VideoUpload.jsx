import React, { useState } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function VideoUpload() {
  const [file, setFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const { currentUser } = useSelector((state) => state.user);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file first!');
      return;
    }

    const chunkSize = 5 * 1024 * 1024;
    const totalChunks = Math.ceil(file.size / chunkSize);
    const chunksArray = [];

    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(file.size, start + chunkSize);
      const chunk = file.slice(start, end);
      chunksArray.push(chunk);
    }

    const formData = new FormData();
    chunksArray.forEach((chunk, index) => {
      formData.append('chunks', chunk, `chunk-${index}.part`);
    });
    formData.append('filename', file.name);
    formData.append('totalChunks', totalChunks);
    formData.append('email', currentUser.email);

    try {
      await axios.post('/api/video/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(progress);
        },
      });
      toast.success('Chunks uploaded successfully!');
      setUploadProgress(0); // Reset progress after successful upload
    } catch (error) {
      console.error('Error uploading chunks:', error);
      toast.error('Error uploading chunks.');
    }
  };

  return (
    <div className="p-6 max-w-lg mx-auto flex flex-col items-center space-y-4">
      <input 
        type="file" 
        onChange={handleFileChange} 
        className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
      />
      <button 
        onClick={handleUpload}
        className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400"
      >
        Upload
      </button>
      {uploadProgress > 0 && (
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div
            className="bg-green-500 h-4 rounded-full"
            style={{ width: `${uploadProgress}%` }}
          />
        </div>
      )}
      {uploadProgress > 0 && <p>{uploadProgress}% uploaded</p>}
      <ToastContainer />
    </div>
  );
}
