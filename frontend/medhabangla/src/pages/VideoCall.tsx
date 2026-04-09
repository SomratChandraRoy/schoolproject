import React, { useEffect, useRef } from 'react';

const VideoCall: React.FC = () => {
    const apiRef = useRef<any>(null);

    useEffect(() => {
        const initJitsi = () => {
            if (!document.querySelector('#jaas-container')) return;

            // Clean up previous instance if exists during strict mode
            if (apiRef.current) {
                apiRef.current.dispose();
                apiRef.current = null;
            }

            // @ts-ignore
            apiRef.current = new window.JitsiMeetExternalAPI("8x8.vc", {
                roomName: "vpaas-magic-cookie-7a1f64e823774bbea7b06d2e7f947e3b/SampleAppPhilosophicalCavesLeanIndoors",
                parentNode: document.querySelector('#jaas-container'),
                jwt: "eyJraWQiOiJ2cGFhcy1tYWdpYy1jb29raWUtN2ExZjY0ZTgyMzc3NGJiZWE3YjA2ZDJlN2Y5NDdlM2IvMmRlMjkzLVNBTVBMRV9BUFAiLCJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiJqaXRzaSIsImlzcyI6ImNoYXQiLCJpYXQiOjE3NzU3MTgxMTgsImV4cCI6MTc3NTcyNTMxOCwibmJmIjoxNzc1NzE4MTEzLCJzdWIiOiJ2cGFhcy1tYWdpYy1jb29raWUtN2ExZjY0ZTgyMzc3NGJiZWE3YjA2ZDJlN2Y5NDdlM2IiLCJjb250ZXh0Ijp7ImZlYXR1cmVzIjp7ImxpdmVzdHJlYW1pbmciOmZhbHNlLCJmaWxlLXVwbG9hZCI6ZmFsc2UsIm91dGJvdW5kLWNhbGwiOmZhbHNlLCJzaXAtb3V0Ym91bmQtY2FsbCI6ZmFsc2UsInRyYW5zY3JpcHRpb24iOmZhbHNlLCJsaXN0LXZpc2l0b3JzIjpmYWxzZSwicmVjb3JkaW5nIjpmYWxzZSwiZmxpcCI6ZmFsc2V9LCJ1c2VyIjp7ImhpZGRlbi1mcm9tLXJlY29yZGVyIjpmYWxzZSwibW9kZXJhdG9yIjp0cnVlLCJuYW1lIjoiVGVzdCBVc2VyIiwiaWQiOiJnb29nbGUtb2F1dGgyfDExMTAyNzE2NDk3NTI5NjQ0MTYyNiIsImF2YXRhciI6IiIsImVtYWlsIjoidGVzdC51c2VyQGNvbXBhbnkuY29tIn19LCJyb29tIjoiKiJ9.coEfSOvVH3t7C-yVFxsO8A0eo8YwHfDeWoJiGaOLDWcqiVtZkxPOPWRBGTmnKakVKwbN1FwyI9mYMzmnnv3TemzfSiuRT-MbkHDG0ASJdwgRvfFbOy9kaT7ClUhRdjOC_vVsh2oDFf6p9I7SINU7dqhH1kXklQK1A51TyjetEAFnM5LUBI4hbo5RvbA2vq96nVLaUTrjccQMKlG6IQSLZ7_XtctNI1BzKf1vzQeUGuUMS22pdfi20aryHiVPhWNl_u5k5d7VIAKZc6twVqgPTFESW-77N532nogQowuLSV08T1catDvH1Eol5qMMVjOH1DdrtW6z3E14rVuJwhVuqA"
            });
        };

        // @ts-ignore
        if (!window.JitsiMeetExternalAPI) {
            const script = document.createElement('script');
            script.src = 'https://8x8.vc/vpaas-magic-cookie-7a1f64e823774bbea7b06d2e7f947e3b/external_api.js';
            script.async = true;
            script.onload = initJitsi;
            document.head.appendChild(script);
        } else {
            initJitsi();
        }

        return () => {
            if (apiRef.current) {
                try {
                    apiRef.current.dispose();
                } catch (e) {
                    console.error('Error disposing Jitsi API:', e);
                }
                apiRef.current = null;
            }
        };
    }, []);

    return (
        <div style={{ width: '100%', minHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
            <div id="jaas-container" style={{ flex: 1, width: '100%', height: '100%', minHeight: '600px', backgroundColor: '#111' }} />
        </div>
    );
};

export default VideoCall;
