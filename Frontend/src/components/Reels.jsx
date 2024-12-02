import React, { useState, useEffect, useRef } from "react";
import axios from "axios";

const Reels = () => {
  const [videos, setVideos] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const videoRef = useRef(null);

  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const searchResponse = await axios.get(
          `https://www.googleapis.com/youtube/v3/search?part=snippet&maxResults=20&q=shorts&type=video&videoDuration=short&key=AIzaSyDgUk93AByUZZfoU34sQwUqfroSlY19fIo`
        );
        const videoIds = searchResponse.data.items.map(item => item.id.videoId);

        const videoDetailsResponse = await axios.get(
          `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,snippet&id=${videoIds.join(',')}&key=AIzaSyDgUk93AByUZZfoU34sQwUqfroSlY19fIo`
        );

        const shortVideos = videoDetailsResponse.data.items
          .filter(video => {
            const duration = video.contentDetails.duration;
            const match = duration.match(/PT(\d+M)?(\d+S)?/);
            const minutes = match[1] ? parseInt(match[1].slice(0, -1), 10) : 0;
            const seconds = match[2] ? parseInt(match[2].slice(0, -1), 10) : 0;
            return (minutes * 60 + seconds) <= 60;
          })
          .map(video => ({
            title: video.snippet.title,
            url: `https://www.youtube.com/embed/${video.id}?autoplay=1`
          }));

        setVideos(shortVideos);
      } catch (error) {
        console.error("Error fetching videos:", error);
      }
    };

    fetchVideos();
  }, []);

  useEffect(() => {
    const handleSpaceBarPress = (e) => {
      if (e.code === 'Space') {
        e.preventDefault();
        if (videoRef.current) {
          if (videoRef.current.paused) {
            videoRef.current.play();
          } else {
            videoRef.current.pause();
          }
        }
      }
    };

    window.addEventListener('keydown', handleSpaceBarPress);
    return () => {
      window.removeEventListener('keydown', handleSpaceBarPress);
    };
  }, [currentIndex, videos]);

  const handleSwipe = (e) => {
    const touch = e.changedTouches[0];
    const swipeDistance = touch.clientY - touch.startY;

    if (swipeDistance < -100) {
      setCurrentIndex((prevIndex) =>
        prevIndex < videos.length - 1 ? prevIndex + 1 : 0
      );
    } else if (swipeDistance > 100) {
      setCurrentIndex((prevIndex) =>
        prevIndex > 0 ? prevIndex - 1 : videos.length - 1
      );
    }
  };

  const handleTouchStart = (e) => {
    e.targetTouches[0].startY = e.targetTouches[0].clientY;
  };

  const handleVideoClick = () => {
    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen bg-black text-white relative">
      {videos.length > 0 ? (
        <iframe
          ref={videoRef}
          src={videos[currentIndex].url}
          className="w-full h-full object-cover"
          frameBorder="0"
          allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="YouTube Video"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleSwipe}
          onClick={handleVideoClick}
        ></iframe>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
};

export default Reels;
