// window.addEventListener('DOMContentLoaded', () => {
//     const btnContainer = document.querySelector('.button-container');
//     const contactBtn = document.getElementById('btn2');
//     const popupOverlay = document.getElementById('popupOverlay');
//     const closePopup = document.getElementById('closePopup');
//     const logo = document.getElementById('logo');
//     const bgVideo = document.getElementById('bgVideo');
//     const playBtn = document.getElementById('btn');

//     // Smooth fade-in on load
//     setTimeout(() => {
//         btnContainer.style.opacity = '1';
//     }, 200);

//     // Contact popup show
//     contactBtn.addEventListener('click', () => {
//         popupOverlay.classList.add('show');
//     });

//     // Close popup with close button
//     closePopup.addEventListener('click', () => {
//         popupOverlay.classList.remove('show');
//     });

//     // Optional: Close popup by clicking outside the popup box
//     popupOverlay.addEventListener('click', (e) => {
//         if (e.target === popupOverlay) {
//             popupOverlay.classList.remove('show');
//         }
//     });

//     // Play button transitions
//     playBtn.addEventListener('click', () => {
//         // Fade out UI
//         btnContainer.style.transition = 'opacity 1s ease';
//         logo.style.transition = 'opacity 1s ease';
//         btnContainer.style.opacity = '0';
//         logo.style.opacity = '0';

//         // Fade out video after 1s
//         setTimeout(() => {
//             bgVideo.style.transition = 'opacity 1.2s ease';
//             bgVideo.style.opacity = '0';
//             bgVideo.body.style.backgroundColor = "black";
//         }, 1000);

//         // Redirect to controls.html after total 2.2s
//         setTimeout(() => {
//             window.location.href = 'controls.html';
//         }, 2200);
//     });
// });
//   window.addEventListener('DOMContentLoaded', () => {
//     const audio = document.getElementById('bg-audio');
    
//     // Try to play
//     const playPromise = audio.play();

//     if (playPromise !== undefined) {
//       playPromise
//         .then(() => {
//           console.log("Audio is playing.");
//         })
//         .catch((error) => {
//           console.log("Autoplay failed. Browser blocked it. Waiting for interaction...");
//         });
//     }
//   });
window.addEventListener('DOMContentLoaded', () => { 
    const btnContainer = document.querySelector('.button-container'); 
    const contactBtn = document.getElementById('btn2'); 
    const popupOverlay = document.getElementById('popupOverlay'); 
    const closePopup = document.getElementById('closePopup'); 
    const logo = document.getElementById('logo'); 
    const bgVideo = document.getElementById('bgVideo'); 
    const playBtn = document.getElementById('btn'); 
    const audio = document.getElementById('bg-audio'); 
    
    let audioStarted = false;

    // Smooth fade-in on load 
    setTimeout(() => { 
        btnContainer.style.opacity = '1'; 
    }, 200); 

    // Try to unmute audio after 500ms from page load
    setTimeout(() => {
        if (audio && !audio.muted) {
            audio.muted = false;
            audio.volume = 0.7;
            console.log("Audio unmuted after 500ms");
        }
    }, 500);

    // Global click handler to start audio on user interaction
    function handleUserInteraction() {
        if (!audioStarted) {
            const playPromise = audio.play();
            if (playPromise !== undefined) {
                playPromise
                    .then(() => {
                        console.log("Audio started after user interaction");
                        audioStarted = true;
                        // Unmute immediately on first click
                        audio.muted = false;
                        audio.volume = 0.7;
                        console.log("Audio unmuted immediately after first click");
                    })
                    .catch(console.error);
            }
        }
    }

    // Add event listeners for user interaction
    document.addEventListener('click', handleUserInteraction, { once: true });

    // Contact popup show 
    contactBtn.addEventListener('click', () => { 
        popupOverlay.classList.add('show');
    }); 

    // Close popup with close button 
    closePopup.addEventListener('click', () => { 
        popupOverlay.classList.remove('show'); 
    }); 

    // Close popup by clicking outside the popup box 
    popupOverlay.addEventListener('click', (e) => { 
        if (e.target === popupOverlay) { 
            popupOverlay.classList.remove('show'); 
        } 
    }); 

    // Play button transitions 
    playBtn.addEventListener('click', () => { 
        // Fade out UI 
        btnContainer.style.transition = 'opacity 1s ease'; 
        logo.style.transition = 'opacity 1s ease'; 
        btnContainer.style.opacity = '0'; 
        logo.style.opacity = '0'; 

        // Fade out video after 1s 
        setTimeout(() => { 
            bgVideo.style.transition = 'opacity 1.2s ease'; 
            bgVideo.style.opacity = '0'; 
            document.body.style.backgroundColor = "black";
        }, 1000); 

        // Redirect to controls.html after total 2.2s 
        setTimeout(() => { 
            window.location.href = 'controls.html'; 
        }, 2200); 
    }); 
});