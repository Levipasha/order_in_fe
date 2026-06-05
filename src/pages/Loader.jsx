import React from 'react';
import { DotLottieReact } from '@lottiefiles/dotlottie-react';

export default function Loader({ message = "Loading...", size = "w-24 h-24", dark = false }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-8 mx-auto text-center">
      <div className={`${size} flex items-center justify-center`}>
        <DotLottieReact
          src="https://lottie.host/111da60a-128c-47b8-8637-48708597631b/45I5OFyj4V.lottie"
          loop
          autoplay
        />
      </div>
      {message && (
        <p className={`text-xs font-black tracking-wide uppercase ${dark ? 'text-slate-400' : 'text-slate-500'} animate-pulse`}>
          {message}
        </p>
      )}
    </div>
  );
}
