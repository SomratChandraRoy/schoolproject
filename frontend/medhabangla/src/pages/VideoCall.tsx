import React, { useEffect, useRef, useState } from 'react';

const VideoCall: React.FC = () => {
    const apiRef = useRef<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        console.log('[VideoCall] Component mounted');

        const initJitsi = () => {
            console.log('[VideoCall] Initializing Jitsi...');
            const container = document.querySelector('#jaas-container');

            if (!container) {
                console.error('[VideoCall] Container not found!');
                return;
            }

            try {
                // Clean up previous instance if exists
                if (apiRef.current) {
                    console.log('[VideoCall] Disposing previous instance');
                    apiRef.current.dispose();
                    apiRef.current = null;
                }

                console.log('[VideoCall] Creating new Jitsi instance');
                // @ts-ignore
                apiRef.current = new window.JitsiMeetExternalAPI("8x8.vc", {
                    roomName: "vpaas-magic-cookie-7a1f64e823774bbea7b06d2e7f947e3b/SampleAppPhilosophicalCavesLeanIndoors",
                    parentNode: container,
                    jwt: "eyJraWQiOiJ2cGFhcy1tYWdpYy1jb29raWUtN2ExZjY0ZTgyMzc3NGJiZWE3YjA2ZDJlN2Y5NDdlM2IvMmRlMjkzLVNBTVBMRV9BUFAiLCJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiJqaXRzaSIsImlzcyI6ImNoYXQiLCJpYXQiOjE3NzU3MTgxMTgsImV4cCI6MTc3NTcyNTMxOCwibmJmIjoxNzc1NzE4MTEzLCJzdWIiOiJ2cGFhcy1tYWdpYy1jb29raWUtN2ExZjY0ZTgyMzc3NGJiZWE3YjA2ZDJlN2Y5NDdlM2IiLCJjb250ZXh0Ijp7ImZlYXR1cmVzIjp7ImxpdmVzdHJlYW1pbmciOmZhbHNlLCJmaWxlLXVwbG9hZCI6ZmFsc2UsIm91dGJvdW5kLWNhbGwiOmZhbHNlLCJzaXAtb3V0Ym91bmQtY2FsbCI6ZmFsc2UsInRyYW5zY3JpcHRpb24iOmZhbHNlLCJsaXN0LXZpc2l0b3JzIjpmYWxzZSwicmVjb3JkaW5nIjpmYWxzZSwiZmxpcCI6ZmFsc2V9LCJ1c2VyIjp7ImhpZGRlbi1mcm9tLXJlY29yZGVyIjpmYWxzZSwibW9kZXJhdG9yIjp0cnVlLCJuYW1lIjoiVGVzdCBVc2VyIiwiaWQiOiJnb29nbGUtb2F1dGgyfDExMTAyNzE2NDk3NTI5NjQ0MTYyNiIsImF2YXRhciI6IiIsImVtYWlsIjoidGVzdC51c2VyQGNvbXBhbnkuY29tIn19LCJyb29tIjoiKiJ9.coEfSOvVH3t7C-yVFxsO8A0eo8YwHfDeWoJiGaOLDWcqiVtZkxPOPWRBGTmnKakVKwbN1FwyI9mYMzmnnv3TemzfSiuRT-MbkHDG0ASJdwgRvfFbOy9kaT7ClUhRdjOC_vVsh2oDFf6p9I7SINU7dqhH1kXklQK1A51TyjetEAFnM5LUBI4hbo5RvbA2vq96nVLaUTrjccQMKlG6IQSLZ7_XtctNI1BzKf1vzQeUGuUMS22pdfi20aryHiVPhWNl_u5k5d7VIAKZc6twVqgPTFESW-77N532nogQowuLSV08T1catDvH1Eol5qMMVjOH1DdrtW6z3E14rVuJwhVuqA",
                    width: '100%',
                    height: '100%',
                    configOverwrite: {
                        startWithAudioMuted: false,
                        startWithVideoMuted: false,
                        prejoinPageEnabled: true,
                    },
                    interfaceConfigOverwrite: {
                        SHOW_JITSI_WATERMARK: false,
                        MOBILE_APP_PROMO: false,
                    }
                });

                // Event listeners
                apiRef.current.addListener('videoConferenceJoined', () => {
                    console.log('[VideoCall] Conference joined');
                    setIsLoading(false);
                });

                apiRef.current.addListener('readyToClose', () => {
                    console.log('[VideoCall] Ready to close');
                });

                console.log('[VideoCall] Jitsi initialized successfully');
                // Hide loading after a short delay even if event doesn't fire
                setTimeout(() => setIsLoading(false), 3000);

            } catch (err) {
                console.error('[VideoCall] Error initializing Jitsi:', err);
                setError('Failed to initialize video call. Please refresh the page.');
                setIsLoading(false);
            }
        };

        // @ts-ignore
        if (!window.JitsiMeetExternalAPI) {
            console.log('[VideoCall] Loading Jitsi script...');
            const script = document.createElement('script');
            script.src = 'https://8x8.vc/vpaas-magic-cookie-7a1f64e823774bbea7b06d2e7f947e3b/external_api.js';
            script.async = true;
            script.onload = () => {
                console.log('[VideoCall] Jitsi script loaded');
                initJitsi();
            };
            script.onerror = () => {
                console.error('[VideoCall] Failed to load Jitsi script');
                setError('Failed to load video call service. Please check your internet connection.');
                setIsLoading(false);
            };
            document.head.appendChild(script);
        } else {
            console.log('[VideoCall] Jitsi script already loaded');
            initJitsi();
        }

        return () => {
            console.log('[VideoCall] Cleaning up...');
            if (apiRef.current) {
                try {
                    apiRef.current.dispose();
                } catch (e) {
                    console.error('[VideoCall] Error disposing Jitsi API:', e);
                }
                apiRef.current = null;
            }
        };
    }, []);

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: '#111',
            zIndex: 1000
        }}>
            {/* Loading State */}
            {isLoading && !error && (
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#1a1a1a',
                    zIndex: 2000
                }}>
                    <div style={{ textAlign: 'center' }}>
                        <div style={{
                            width: '60px',
                            height: '60px',
                            border: '4px solid #333',
                            borderTop: '4px solid #3b82f6',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite',
                            margin: '0 auto 20px'
                        }}></div>
                        <p style={{ color: '#fff', fontSize: '18px', fontWeight: '500' }}>
                            Connecting to video call...
                        </p>
                        <p style={{ color: '#999', fontSize: '14px', marginTop: '10px' }}>
                            Please wait while we set up your conference
                        </p>
                    </div>
                </div>
            )}

            {/* Error State */}
            {error && (
                <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#1a1a1a',
                    zIndex: 2000
                }}>
                    <div style={{ textAlign: 'center', maxWidth: '500px', padding: '20px' }}>
                        <div style={{
                            width: '80px',
                            height: '80px',
                            backgroundColor: 'rgba(239, 68, 68, 0.2)',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 20px'
                        }}>
                            <span style={{ fontSize: '40px', color: '#ef4444' }}>⚠</span>
                        </div>
                        <h2 style={{ color: '#fff', fontSize: '24px', fontWeight: '600', marginBottom: '10px' }}>
                            Connection Error
                        </h2>
                        <p style={{ color: '#999', marginBottom: '30px' }}>{error}</p>
                        <button
                            onClick={() => window.location.reload()}
                            style={{
                                padding: '12px 24px',
                                backgroundColor: '#3b82f6',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '8px',
                                fontSize: '16px',
                                cursor: 'pointer',
                                fontWeight: '500'
                            }}
                        >
                            Reload Page
                        </button>
                    </div>
                </div>
            )}

            {/* Video Call Container */}
            <div
                id="jaas-container"
                style={{
                    width: '100%',
                    height: '100%',
                    backgroundColor: '#111'
                }}
            />

            {/* CSS Animation */}
            <style>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
};

export default VideoCall;
