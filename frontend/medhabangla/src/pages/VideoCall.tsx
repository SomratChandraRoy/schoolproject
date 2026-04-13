import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Loader2, Video, VideoOff } from "lucide-react";

const API_BASE_URL = import.meta.env.VITE_API_URL || "";
const DEFAULT_ROOM = "sopan-classroom";

type MeetingBootstrapResponse = {
  domain: string;
  app_id: string;
  room_slug: string;
  room_name: string;
  display_name: string;
  script_url: string;
  jwt: string | null;
  expires_at: number | null;
  requires_jwt: boolean;
};

type JitsiApi = {
  addListener: (event: string, callback: (...args: unknown[]) => void) => void;
  dispose: () => void;
  executeCommand: (command: string, ...args: unknown[]) => void;
};

type JitsiApiCtor = new (
  domain: string,
  options: Record<string, unknown>,
) => JitsiApi;

declare global {
  interface Window {
    JitsiMeetExternalAPI?: JitsiApiCtor;
  }
}

const ensureExternalApiScript = (scriptUrl: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (window.JitsiMeetExternalAPI) {
      resolve();
      return;
    }

    const selector = `script[data-jaas-script=\"true\"][src=\"${scriptUrl}\"]`;
    const existing = document.querySelector(
      selector,
    ) as HTMLScriptElement | null;

    if (existing) {
      const onLoad = () => {
        cleanup();
        resolve();
      };

      const onError = () => {
        cleanup();
        reject(new Error("Failed to load 8x8 script"));
      };

      const cleanup = () => {
        existing.removeEventListener("load", onLoad);
        existing.removeEventListener("error", onError);
      };

      existing.addEventListener("load", onLoad);
      existing.addEventListener("error", onError);
      return;
    }

    const script = document.createElement("script");
    script.src = scriptUrl;
    script.async = true;
    script.dataset.jaasScript = "true";

    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load 8x8 script"));

    document.head.appendChild(script);
  });
};

const VideoCall: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const apiRef = useRef<JitsiApi | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const user = useMemo(() => {
    const raw = localStorage.getItem("user");
    if (!raw) {
      return null;
    }

    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }, []);

  const [roomInput, setRoomInput] = useState(
    searchParams.get("room") || DEFAULT_ROOM,
  );
  const [displayName, setDisplayName] = useState(() => {
    const fullName =
      `${user?.first_name || ""} ${user?.last_name || ""}`.trim();
    return fullName || user?.username || "Student";
  });
  const [activeRoomName, setActiveRoomName] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const disposeConference = useCallback(() => {
    if (!apiRef.current) {
      return;
    }

    try {
      apiRef.current.dispose();
    } catch {
      // Ignore cleanup errors from third-party SDK internals.
    }

    apiRef.current = null;
  }, []);

  const handleLeave = useCallback(() => {
    if (apiRef.current) {
      try {
        apiRef.current.executeCommand("hangup");
      } catch {
        // If hangup fails, dispose still closes the conference.
      }
    }

    disposeConference();
    setIsConnected(false);
    setIsJoining(false);
    setActiveRoomName(null);
  }, [disposeConference]);

  const joinConference = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setError("Please login first to start a video call.");
      return;
    }

    if (!roomInput.trim()) {
      setError("Please enter a room name.");
      return;
    }

    if (!containerRef.current) {
      setError("Video container is not ready yet. Please try again.");
      return;
    }

    setError(null);
    setIsJoining(true);
    setIsConnected(false);

    try {
      handleLeave();

      const response = await fetch(
        `${API_BASE_URL}/api/accounts/video-call/token/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${token}`,
          },
          body: JSON.stringify({
            room_name: roomInput,
            display_name: displayName,
          }),
        },
      );

      const data = (await response.json()) as MeetingBootstrapResponse & {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(data?.error || "Failed to create video call session.");
      }

      await ensureExternalApiScript(data.script_url);

      if (!window.JitsiMeetExternalAPI) {
        throw new Error("8x8 external API failed to initialize.");
      }

      const options: Record<string, unknown> = {
        roomName: data.room_name,
        parentNode: containerRef.current,
        width: "100%",
        height: "100%",
        userInfo: {
          displayName: data.display_name,
        },
        configOverwrite: {
          prejoinPageEnabled: true,
          startWithAudioMuted: false,
          startWithVideoMuted: false,
          disableDeepLinking: true,
        },
        interfaceConfigOverwrite: {
          SHOW_JITSI_WATERMARK: false,
          SHOW_WATERMARK_FOR_GUESTS: false,
          MOBILE_APP_PROMO: false,
        },
      };

      if (data.jwt) {
        options.jwt = data.jwt;
      }

      const api = new window.JitsiMeetExternalAPI(data.domain, options);
      apiRef.current = api;
      setActiveRoomName(data.room_name);

      api.addListener("videoConferenceJoined", () => {
        setIsConnected(true);
        setIsJoining(false);
      });

      api.addListener("videoConferenceLeft", () => {
        setIsConnected(false);
      });

      api.addListener("readyToClose", () => {
        setIsConnected(false);
        setActiveRoomName(null);
        disposeConference();
      });

      api.addListener("conferenceError", () => {
        setError("Conference error occurred. Please leave and rejoin.");
      });

      window.setTimeout(() => {
        setIsJoining(false);
      }, 9000);
    } catch (joinError) {
      setIsJoining(false);
      setIsConnected(false);
      setActiveRoomName(null);
      disposeConference();
      setError(
        joinError instanceof Error
          ? joinError.message
          : "Failed to connect to video call.",
      );
    }
  }, [API_BASE_URL, displayName, disposeConference, handleLeave, roomInput]);

  useEffect(() => {
    const roomFromUrl = searchParams.get("room");
    if (roomFromUrl) {
      setRoomInput(roomFromUrl);
    }
  }, [searchParams]);

  useEffect(() => {
    return () => {
      disposeConference();
    };
  }, [disposeConference]);

  return (
    <div className="fixed inset-0 z-[1000] bg-slate-950 text-slate-100">
      <header className="flex h-16 items-center justify-between border-b border-slate-800 px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-1.5 text-sm hover:bg-slate-800">
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <div>
            <h1 className="text-base font-semibold sm:text-lg">
              8x8 Video Call
            </h1>
            {activeRoomName ? (
              <p className="text-xs text-slate-400">Room: {activeRoomName}</p>
            ) : (
              <p className="text-xs text-slate-400">Ready to join</p>
            )}
          </div>
        </div>

        {activeRoomName && (
          <button
            onClick={handleLeave}
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-1.5 text-sm font-semibold hover:bg-red-700">
            <VideoOff className="h-4 w-4" />
            Leave
          </button>
        )}
      </header>

      <div className="relative h-[calc(100%-4rem)] w-full">
        <div
          ref={containerRef}
          id="jaas-container"
          className="h-full w-full bg-black"
        />

        {!activeRoomName && (
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950/95 p-4">
            <div className="w-full max-w-xl rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl">
              <h2 className="text-xl font-bold text-white">
                Start a live class
              </h2>
              <p className="mt-2 text-sm text-slate-400">
                Your call runs on 8x8 JaaS. Room access token is generated from
                backend for production safety.
              </p>

              <div className="mt-5 space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-300">
                    Room name
                  </label>
                  <input
                    value={roomInput}
                    onChange={(event) => setRoomInput(event.target.value)}
                    placeholder="class-10-math"
                    className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-300">
                    Display name
                  </label>
                  <input
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                    placeholder="Teacher Name"
                    className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2 text-sm text-white outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>

                {error && (
                  <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                    {error}
                  </div>
                )}

                <button
                  onClick={joinConference}
                  disabled={isJoining || !roomInput.trim()}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60">
                  {isJoining ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Joining...
                    </>
                  ) : (
                    <>
                      <Video className="h-4 w-4" />
                      Join Call
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {isJoining && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/35">
            <div className="inline-flex items-center gap-2 rounded-lg bg-slate-900/90 px-4 py-2 text-sm text-white shadow-xl">
              <Loader2 className="h-4 w-4 animate-spin" />
              Connecting to meeting...
            </div>
          </div>
        )}

        {isConnected && (
          <div className="pointer-events-none absolute bottom-4 left-4 rounded-md bg-emerald-600/90 px-3 py-1 text-xs font-semibold text-white">
            Connected
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoCall;
