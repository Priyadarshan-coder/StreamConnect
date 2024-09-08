
import { useSelector } from 'react-redux';
import { useRef, useState, useEffect } from 'react';
import {
  getDownloadURL,
  getStorage,
  ref,
  uploadBytesResumable,
} from 'firebase/storage';
//import app  from '../firebase';
import {deleteUserFailure,deleteUserSuccess,deleteUserStart, logout} from '../redux/user'
import { useDispatch } from 'react-redux';
import { Link } from 'react-router-dom';
export default function Profile() {
  const fileRef = useRef(null);
  const { currentUser, loading, error } = useSelector((state) => state.user);
  const [file, setFile] = useState(undefined);
  const [filePerc, setFilePerc] = useState(0);
  const [fileUploadError, setFileUploadError] = useState(false);
  const [formData, setFormData] = useState({});
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [showListingsError, setShowListingsError] = useState(false);
  const [userListings, setUserListings] = useState([]);
  const dispatch = useDispatch();

  // firebase storage
  // allow read;
  // allow write: if
  // request.resource.size < 2 * 1024 * 1024 &&
  // request.resource.contentType.matches('image/.*')

  
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  

  
  const handleSignOut = async () => {
    try {
      dispatch(logout());
      const res = await fetch('/api/auth/signout');
      const data = await res.json();
      if (data.success === false) {
        dispatch(deleteUserFailure(data.message));
        return;
      }
      dispatch(deleteUserSuccess(data));
    } catch (error) {
      dispatch(deleteUserFailure(data.message));
    }
  };

  const handleShowListings = async () => {
    try {
      setShowListingsError(false);
      const res = await fetch(`/api/user/listings/${currentUser._id}`);
      const data = await res.json();
      if (data.success === false) {
        setShowListingsError(true);
        return;
      }

      setUserListings(data);
    } catch (error) {
      setShowListingsError(true);
    }
  };

  const handleListingDelete = async (listingId) => {
    try {
      const res = await fetch(`/api/listing/delete/${listingId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success === false) {
        console.log(data.message);
        return;
      }

      setUserListings((prev) =>
        prev.filter((listing) => listing._id !== listingId)
      );
    } catch (error) {
      console.log(error.message);
    }
  };
  return (
    <div className='p-3 max-w-lg mx-auto'>
  <h1 className='text-3xl font-semibold text-center my-7 text-white'>Profile</h1>
  
  <div className='flex flex-col items-center'>
    <input
      onChange={(e) => setFile(e.target.files[0])}
      type='file'
      ref={fileRef}
      hidden
      accept='image/*'
    />
    <img
      onClick={() => fileRef.current.click()}
      src={formData.avatar || currentUser.avatar}
      alt='profile'
      className='rounded-full h-24 w-24 object-cover cursor-pointer mt-2'
    />
    
    <div className='flex flex-col items-center mt-5 gap-4'>
      <span onClick={handleSignOut} style={{
        color: '#f1f1f1',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
      }}
      className='hover:bg-gray-200 border border-transparent hover:border-gray-500 py-2 px-4 rounded-md cursor-pointer'>
        Sign out
      </span>

      <button onClick={handleShowListings} style={{
        color: '#f1f1f1',
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
      }}
      className='hover:bg-gray-200 border border-transparent hover:border-gray-500 py-2 px-4 rounded-md cursor-pointer'>
        My Uploads
      </button>
    </div>
  </div>

  

  <p className='text-red-700 mt-5'>
    {showListingsError ? 'Error showing listings' : ''}
  </p>

  {userListings && userListings.length > 0 && (
    <div className='flex flex-col gap-4'>
      <h1 className='text-center mt-7 text-2xl font-semibold'>
        Your Listings
      </h1>
      {userListings.map((listing) => (
        <div
          key={listing._id}
          className='border rounded-lg p-3 flex justify-between items-center gap-4'
        >
          <Link to={`/listing/${listing._id}`}>
            <img
              src={listing.imageUrls[0]}
              alt='listing cover'
              className='h-16 w-16 object-contain'
            />
          </Link>
          <Link
            className='text-slate-700 font-semibold hover:underline truncate flex-1'
            to={`/listing/${listing._id}`}
          >
            <p>{listing.name}</p>
          </Link>

          <div className='flex flex-col items-center'>
            <button
              onClick={() => handleListingDelete(listing._id)}
              className='text-red-700 uppercase'
            >
              Delete
            </button>
            <Link to={`/update-listing/${listing._id}`}>
              <button className='text-green-700 uppercase'>Edit</button>
            </Link>
          </div>
        </div>
      ))}
    </div>
  )}
</div>

  );
}
