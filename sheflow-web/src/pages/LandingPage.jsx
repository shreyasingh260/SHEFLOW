import React, { useRef, useState, useEffect } from 'react';
import { Volume2, VolumeX } from 'lucide-react';

export default function LandingPage({ onNavigateLogin, onNavigateSignup }) {
  const videoRef = useRef(null);
  const [muted, setMuted] = useState(true);
  const [showHint, setShowHint] = useState(true);
  const [interacted, setInteracted] = useState(false);

  /* ── Attempt autoplay with audio on first user interaction ── */
  useEffect(() => {
    const tryUnmute = () => {
      if (interacted) return;
      setInteracted(true);
      setShowHint(false);

      const v = videoRef.current;
      if (!v) return;

      v.muted = false;
      v.volume = 1;
      v.play().catch(() => {
        // Browser still blocked audio — keep muted silently
        v.muted = true;
        setMuted(true);
      });
      setMuted(false);
    };

    // Listen on the whole document — first tap / click / key enables audio
    document.addEventListener('click', tryUnmute, { once: true });
    document.addEventListener('keydown', tryUnmute, { once: true });
    document.addEventListener('touchstart', tryUnmute, { once: true });

    return () => {
      document.removeEventListener('click', tryUnmute);
      document.removeEventListener('keydown', tryUnmute);
      document.removeEventListener('touchstart', tryUnmute);
    };
  }, [interacted]);

  /* ── Hide "click for sound" hint after 4 s even without interaction ── */
  useEffect(() => {
    const t = setTimeout(() => setShowHint(false), 4000);
    return () => clearTimeout(t);
  }, []);

  /* ── Manual mute / unmute toggle button ── */
  const toggleMute = (e) => {
    e.stopPropagation();
    const v = videoRef.current;
    if (!v) return;

    if (muted) {
      v.muted = false;
      v.volume = 1;
      v.play().catch(() => { v.muted = true; });
      setMuted(false);
    } else {
      v.muted = true;
      setMuted(true);
    }
    // Mark as interacted so the document listener doesn't fire again
    setInteracted(true);
    setShowHint(false);
  };

  return (
    /* Full-screen black wrapper */
    <div className="fixed inset-0 bg-black overflow-hidden select-none">

      {/* ── Full-screen mascot video ── */}
      <video
        ref={videoRef}
        src="/assets/flora-mascot.mp4"
        autoPlay
        loop
        playsInline
        muted          /* starts muted for browser autoplay policy; unmuted on first interaction */
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* ── Top-right button cluster ── */}
      <div className="absolute top-5 right-5 z-20 flex items-center gap-3">

        {/* Volume toggle */}
        <button
          onClick={toggleMute}
          title={muted ? 'Unmute' : 'Mute'}
          className="
            flex items-center justify-center
            w-10 h-10 rounded-full
            bg-white/15 backdrop-blur-md border border-white/30
            text-white hover:bg-white/25 active:scale-95
            transition-all duration-200
          "
        >
          {muted
            ? <VolumeX className="w-4 h-4" />
            : <Volume2 className="w-4 h-4" />}
        </button>

        {/* Login */}
        <button
          onClick={onNavigateLogin}
          className="
            px-5 py-2.5 rounded-full
            bg-white/15 backdrop-blur-md border border-white/30
            text-white text-sm font-bold
            hover:bg-white/25 active:scale-95
            transition-all duration-200
          "
        >
          Login
        </button>

        {/* Sign Up */}
        <button
          onClick={onNavigateSignup}
          className="
            px-5 py-2.5 rounded-full
            bg-[#E83D6F] hover:bg-[#D4265A] active:scale-95
            text-white text-sm font-bold
            shadow-lg hover:shadow-xl
            transition-all duration-200
          "
        >
          Sign Up
        </button>
      </div>

      {/* ── "Click anywhere to enable sound" hint ── */}
      <div
        className={`
          absolute bottom-8 left-1/2 -translate-x-1/2 z-20
          px-4 py-2 rounded-full
          bg-black/40 backdrop-blur-sm border border-white/20
          text-white/80 text-xs font-medium
          pointer-events-none
          transition-opacity duration-700
          ${showHint ? 'opacity-100' : 'opacity-0'}
        `}
      >
        🔊 Click anywhere to enable sound
      </div>

    </div>
  );
}
