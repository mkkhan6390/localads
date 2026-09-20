const express = require("express");
const router = express.Router();

// const db = require("../utils/data");
// const {authenticateuser} = require('../utils/authentication');

router.get('/', async (req, res) => {

    res.setHeader("Content-Type", "application/javascript");
    // add logic for setting height width and posistion as per user request;
    //will also need to add UI logic in My APPs where user can select height width and position and script tag should be created accordingly
    const sdkScript = `
    (function() {
        const currentScript = document.currentScript;
        const username = currentScript.getAttribute("username");
        const appid = currentScript.getAttribute("appid");
        const apikey = currentScript.getAttribute("apikey");
        const adtype = currentScript.getAttribute("adtype") || "image";
        const pincode = currentScript.getAttribute("pincode");

        // position controls where + how the ad box is rendered on the page.
        // Supported values: "sidebar" | "bottom" | "fullscreen"
        const position = (currentScript.getAttribute("position") || "sidebar").toLowerCase();

        // Ad size specs per position (Responsive Display Ad style specs).
        // These are the recommended creative sizes advertisers should upload;
        // the container itself scales responsively but keeps the same aspect ratio.
        const AD_SPECS = {
            sidebar: {
                // Skyscraper - Vertical (1:2), Recommended 300x600, Min 160x600
                width: '300px',
                height: '600px',
                minWidth: '160px',
                minHeight: '600px'
            },
            bottom: {
                // Leaderboard - Horizontal (~10.8:1), Recommended 970x90, Min 728x90
                width: '970px',
                height: '90px',
                minWidth: '728px',
                minHeight: '90px'
            },
            fullscreen: {
                // Interstitial - Landscape (1.91:1), Recommended 1200x628, Min 600x314
                width: '1200px',
                height: '628px',
                minWidth: '600px',
                minHeight: '314px'
            }
        };

        const spec = AD_SPECS[position] || AD_SPECS.sidebar;

        // The SDK's "position" attribute (sidebar/bottom/fullscreen) maps
        // to the ads.placement value used on the server. Without this map,
        // the server has no way to know which slot shape this widget wants
        // and could hand back an ad meant for a different placement.
        const POSITION_TO_PLACEMENT = {
            sidebar: 'right_sidebar',
            bottom: 'bottom_banner',
            fullscreen: 'interstitial'
        };
        const placement = POSITION_TO_PLACEMENT[position] || POSITION_TO_PLACEMENT.sidebar;

        // Detect device info
        const deviceInfo = {
          userAgent: navigator.userAgent,
          language: navigator.language,
          platform: navigator.platform,
          screen: {
            width: screen.width,
            height: screen.height
          }
        };

        // Function to get ad indexes
        function getAdIndex() {
            return JSON.parse(localStorage.getItem("adIndexes") || "{}");
        }

        // Rotation is now tracked per (pincode, placement) — two ad widgets
        // for different placements on the same page must not share one
        // rotation counter, or they'll interfere with each other's sequence.
        function adIndexKey(pincode, placementVal) {
            return pincode + ':' + placementVal;
        }

        // Function to set ad indexes
        function setAdIndex(pincode, placementVal, index) {
            const stored = JSON.parse(localStorage.getItem("adIndexes") || "{}");
            stored[adIndexKey(pincode, placementVal)] = index;
            localStorage.setItem("adIndexes", JSON.stringify(stored));
        }

        // Function to increment ad index for a pincode+placement (currently unused elsewhere, kept for API completeness)
        function incrementAdIndex(pincode, placementVal) {
            const adIndexes = getAdIndex();
            const key = adIndexKey(pincode, placementVal);
            adIndexes[key] = (adIndexes[key] || 0) + 1;
            setAdIndex(pincode, placementVal, adIndexes[key]);
        }


        // Detect location (via browser geolocation API)
        function getLocation() {
            return new Promise((resolve) => {
                if (!navigator.geolocation) 
                    return resolve(null);

                navigator.geolocation.getCurrentPosition(
                    (pos) => resolve(pos.coords),
                    () => resolve(null),
                    { enableHighAccuracy: true, timeout: 5000 }
                );
            });
        }

        // Applies position-specific placement + sizing to the ad container.
        function applyPositionStyles(adContainer, position, spec) {
            // Reset any previous placement styles first
            adContainer.style.top = '';
            adContainer.style.bottom = '';
            adContainer.style.left = '';
            adContainer.style.right = '';
            adContainer.style.transform = '';

            adContainer.style.position = 'fixed';
            adContainer.style.width = spec.width;
            adContainer.style.height = spec.height;
            adContainer.style.minWidth = spec.minWidth;
            adContainer.style.minHeight = spec.minHeight;
            adContainer.style.maxWidth = '95vw';
            adContainer.style.maxHeight = '95vh';

            if (position === 'sidebar') {
                // Right side, vertically centered - Skyscraper
                adContainer.style.top = '50%';
                adContainer.style.right = '20px';
                adContainer.style.transform = 'translateY(-50%)';
            } else if (position === 'bottom') {
                // Full-width bar pinned to the bottom - Leaderboard
                adContainer.style.bottom = '0px';
                adContainer.style.left = '50%';
                adContainer.style.transform = 'translateX(-50%)';
                adContainer.style.width = '100%';
                adContainer.style.maxWidth = spec.width;
                adContainer.style.borderRadius = '8px 8px 0 0';
            } else if (position === 'fullscreen') {
                // Centered on screen with a dimmed backdrop - Interstitial
                adContainer.style.top = '50%';
                adContainer.style.left = '50%';
                adContainer.style.transform = 'translate(-50%, -50%)';
            }
        }

        // Creates (or reuses) the dimmed backdrop used behind fullscreen ads.
        function ensureBackdrop() {
            let backdrop = document.getElementById('ad-backdrop');
            if (!backdrop) {
                backdrop = document.createElement('div');
                backdrop.id = 'ad-backdrop';
                backdrop.style.position = 'fixed';
                backdrop.style.top = '0';
                backdrop.style.left = '0';
                backdrop.style.width = '100vw';
                backdrop.style.height = '100vh';
                backdrop.style.backgroundColor = 'rgba(0,0,0,0.6)';
                backdrop.style.zIndex = '999';
                document.body.appendChild(backdrop);
            }
            return backdrop;
        }

        async function fetchAd() {
            try {
            let location = await getLocation();
            let adIndexes = getAdIndex();

            const payload = { username, appid, apikey, adtype, placement, deviceInfo, location, adIndexes, pincode };
            const response = await fetch("http://localhost:5000/ad/getad", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errText = await response.text();
                console.warn("LocalAds SDK: Failed to fetch ad:", response.status, errText);
                return;
            }

            const ad = await response.json();
	        
            //this should be done in the end after making sure user has seen the ad but placing it here for now.
            // Increment ad index for this pincode + placement
            if (ad.pincode) {
                setAdIndex(ad.pincode, placement, ad.next_index);
            }

            if (ad.id) {
                // Create ad container
                let adContainer = document.getElementById('ad-container'); 
		        if (!adContainer) {
                    adContainer = document.createElement('div'); 
                    adContainer.id = 'ad-container'; 

                    // Styling
                    adContainer.style.display = 'inline-block';
                    adContainer.style.backgroundColor = '#fff';
                    adContainer.style.border = '1px solid #ddd';
                    adContainer.style.borderRadius = '8px';
                    adContainer.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                    adContainer.style.overflow = 'hidden';
                    adContainer.style.zIndex = '1000';
                    adContainer.style.cursor = 'pointer';
                    adContainer.style.animation = 'fadeInAd 0.5s ease';

                    // Position + size based on the requested ad type
                    applyPositionStyles(adContainer, position, spec);

                    if (position === 'fullscreen') {
                        ensureBackdrop();
                    }

                    document.body.appendChild(adContainer); 

                    const style = document.createElement('style');
                    style.innerHTML = \`
                      @keyframes fadeInAd {
                        from { opacity: 0; transform: translateY(20px); }
                        to { opacity: 1; transform: translateY(0); }
                      }
                      #ad-container img {
                        width: 100%;
                        height: 100%;
                        object-fit: contain;
                        display: block;
                      }
                      #ad-container a {
                        display: block;
                        width: 100%;
                        height: 100%;
                      }
                    \`;
                    document.head.appendChild(style);
		        }

                //anchor href should be the link where we want to redirect the adclick
                //the href should be an api call to our server which will increment the click count of that add and then return the link to the details page of the ad// or maybe its just better to have an onclick function for clicks
                //consider how other type of ads will be handled and add type-wise logic. 
                //put the innerhtml content in quotes // should display style be inline block? //also think of giving some margin to the ad element to separate from website content
                adContainer.innerHTML = \`
				<a href="\${ad.landing_url}" id="adid1100\${ad.id}" target="_blank"> 
					<img 
						src="\${ad.ad_url}"
						alt="\${ad.title}"
					/>
				</a>\`;
 
	            document.getElementById(\`adid1100\${ad.id}\`).addEventListener('click', function(event) {
                    event.preventDefault();
                    //confirm later whether we really need to send the data as a blob or we can directly send the stringified data.
		            const clickBlob = new Blob([JSON.stringify({ id: ad.id, appid, pincode:ad.pincode })], { type: "application/json" });
		            navigator.sendBeacon("http://localhost:5000/ad/click", clickBlob);
                    window.open(ad.landing_url, "_blank");
                })
  
            }
            } catch (err) {
                console.warn("LocalAds SDK: Error loading ad:", err);
            }
        }
 
        fetchAd();
    })();
    `
  ;

    res.send(sdkScript);
})


module.exports = router;