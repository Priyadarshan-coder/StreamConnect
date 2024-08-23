import React, { useState } from 'react';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';

export default function VideoUpload() {
  const [file, setFile] = useState(null);
  const [chunks, setChunks] = useState([]);
  const [totalChunks, setTotalChunks] = useState(0);
const { currentUser } = useSelector((state) => state.user);
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = () => {
    if (!file) {
      alert('Please select a file first!');
      return;
    }

    const chunkSize = 5*1024 * 1024; 
    const totalChunks = Math.ceil(file.size / chunkSize);
    const chunksArray = [];
    
    for (let i = 0; i < totalChunks; i++) {
      const start = i * chunkSize;
      const end = Math.min(file.size, start + chunkSize);
      const chunk = file.slice(start, end);
      chunksArray.push(chunk);
    }

    setChunks(chunksArray);
    setTotalChunks(totalChunks);
  };

  const handleSendChunks = async () => {
    if (chunks.length === 0) {
      alert('No chunks to upload!');
      return;
    }

    const formData = new FormData();
    chunks.forEach((chunk, index) => {
      formData.append('chunks', chunk, `chunk-${index}.part`);
    });
    formData.append('filename', file.name);
    formData.append('totalChunks', totalChunks);
    formData.append('email',currentUser.email);

    try {
      await axios.post('/api/video/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      alert('Chunks uploaded successfully!');
    } catch (error) {
      console.error('Error uploading chunks:', error);
    }
  };

  return (
    <div className='p-6 max-w-lg mx-auto flex items-center space-x-4'>
  <input 
    type="file" 
    onChange={handleFileChange} 
    className='px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400'
  />
  <button 
    onClick={handleUpload}
    className='px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400'
  >
    Prepare Chunks
  </button>
  <button 
    onClick={handleSendChunks}
    className='px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400'
  >
    Send Chunks
  </button>
</div>
  );
}

