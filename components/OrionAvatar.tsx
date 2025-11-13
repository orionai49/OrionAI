
import React from 'react';

interface OrionAvatarProps {
    state: 'idle' | 'thinking';
}

const OrionAvatar: React.FC<OrionAvatarProps> = ({ state }) => {
    const animationClass = state === 'thinking' ? 'animate-thinking' : 'animate-pulse-custom';

    return (
        <div className={`w-8 h-8 flex-shrink-0 ${animationClass}`}>
            <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                <defs>
                    <radialGradient id="avatarGradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                        <stop offset="0%" style={{ stopColor: '#22d3ee', stopOpacity: 1 }} />
                        <stop offset="100%" style={{ stopColor: '#0c4a6e', stopOpacity: 1 }} />
                    </radialGradient>
                </defs>
                <circle cx="50" cy="50" r="50" fill="url(#avatarGradient)" />
            </svg>
        </div>
    );
};

export default OrionAvatar;
