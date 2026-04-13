import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const NotFound: React.FC = () => {
    const [countdown, setCountdown] = useState(5);
    const navigate = useNavigate();

    useEffect(() => {
        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    navigate('/');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [navigate]);

    return (
        <div
            className="min-h-screen w-full flex items-center justify-center bg-cover bg-center bg-no-repeat relative"
            style={{ backgroundImage: 'url(/404.png)' }}
        >
            {/* Dark overlay for better text visibility */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

            {/* Countdown */}
            <div className="relative z-10">
                <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl px-12 py-8 shadow-2xl">
                    <div className="text-center">
                        <div className="text-8xl font-bold text-white mb-4 drop-shadow-2xl">
                            {countdown}
                        </div>
                        <div className="text-xl text-white/90 font-medium drop-shadow-lg">
                            Redirecting to home...
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotFound;
