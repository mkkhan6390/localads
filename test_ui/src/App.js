import { useEffect, useState } from 'react';
import './App.css';

function App() {
  // const [coords, setCoords] = useState(null); 

  // useEffect(() => {
  //   if (navigator.geolocation) {
  //     navigator.geolocation.getCurrentPosition(
  //       (position) => {
  //         const { latitude, longitude } = position.coords;
  //         console.log("User allowed location:", latitude, longitude);
  //         setCoords({ latitude, longitude });
  //       },
  //       (error) => {
  //         console.error("Geolocation error:", error); 
  //       },
  //       {
  //         enableHighAccuracy: true,
  //         timeout: 10000,
  //         maximumAge: 0,
  //       }
  //     );
  //   } else {
  //     console.error("Geolocation not supported");
  //   }
  // }, []);

  // useEffect(() => {
  //   console.log(coords)
  //   if (!coords) return;

  //   // Build API URL with latitude & longitude
  //   const script = document.createElement('script');
  //   script.src = `http://localhost:5000/ad/getad?lat=${coords.latitude}&long=${coords.longitude}&username=mkhan6390&apikey=6147b71dad25c4fdc61c0fe32f37ece3&appid=915f89f1-84e1-11f0-bfe2-c85b7660b47d`;
  //   script.async = true;
  //   document.body.appendChild(script);
  //   return () => {
  //     document.body.removeChild(script);
  //   };
  // }, [coords]);

  useEffect(() => {
    const adcontainer = document.getElementById('adcontainer');
    if(adcontainer) return;

    const script = document.createElement("script");
    script.src = "http://localhost:5000/sdk";
    script.async = true;

    // add custom attributes
    script.setAttribute("username", "mkhan6390");
    script.setAttribute("appid", "0c8e2b0e-84b9-11f0-bfe2-c85b7660b47d");
    script.setAttribute("apikey", "$2a$10$pRDeD2axZz7Xj0oe3wbvROYsZAyUyk.b8lsY1XIpo8SnT8uOlcFqe");
    script.setAttribute("adtype", "image");

    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script); // cleanup on unmount
    };
  }, []);

  return (
    <div className="App">
      
      <p>The adbox is Above this</p>
    </div>
  );
}

export default App;
