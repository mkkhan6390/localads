import { useEffect } from 'react';
import './App.css';

function App() {
  useEffect(() => {
    // Create a script element
    const script = document.createElement('script');
    script.src = "http://localhost:5000/ad/getads?pincode=416520&username=mkkhan6390&apikey=666123a8ea670b3370efc6081b86fb41";
    script.async = true;

    // Append the script to the document body
    document.body.appendChild(script);

    // Clean up by removing the script when the component unmounts
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div className="App">
      <p>The adbox is below this</p>
      <div id="ad-container"></div>
    </div>
  );
}

export default App;

