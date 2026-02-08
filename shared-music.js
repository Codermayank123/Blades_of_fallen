let audio;

window.addEventListener('DOMContentLoaded', () => {
  // Only create or resume music if it's not already created
  if (!window.sharedAudio) {
    audio = new Audio('firstpage.ogg');
    audio.volume = 0;
    audio.loop = true;
    audio.play().catch(() => {}); // autoplay block workaround
    window.sharedAudio = audio;
  } else {
    audio = window.sharedAudio;
  }
});
