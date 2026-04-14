import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Loader2, Video, VideoOff } from "lucide-react";

const RAW_API_BASE_URL = (import.meta.env.VITE_API_URL || "").trim();
const API_BASE_URL = RAW_API_BASE_URL.replace(/\/+$/, "");
const FRONTEND_JAAS_APP_ID = (import.meta.env.VITE_JAAS_APP_ID || "").trim();
const DEFAULT_ROOM = "sopan-classroom";
let jaasScriptLoadPromise: Promise<void> | null = null;

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

type VideoCallApiError = {
  error?: string;
  code?: string;
  hint?: string;
  missing_fields?: string[];
};

type VideoCallConfigResponse = {
  domain: string;
  app_id: string | null;
  configured: boolean;
  requires_jwt: boolean;
  has_jwt_signing: boolean;
  token_endpoint_ready: boolean;
  missing_fields: string[];
  error?: string;
  hint?: string;
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
  if (window.JitsiMeetExternalAPI) {
    return Promise.resolve();
  }

  if (jaasScriptLoadPromise) {
    return jaasScriptLoadPromise;
  }

  jaasScriptLoadPromise = new Promise((resolve, reject) => {
    const finalizeLoaded = () => {
      if (window.JitsiMeetExternalAPI) {
        resolve();
        return;
      }

      jaasScriptLoadPromise = null;
      reject(new Error("8x8 API script loaded but SDK is unavailable."));
    };

    const selector = `script[data-jaas-script=\"true\"][src=\"${scriptUrl}\"]`;
    const existing = document.querySelector(
      selector,
    ) as HTMLScriptElement | null;

    if (existing) {
      if (existing.dataset.loaded === "true") {
        finalizeLoaded();
        return;
      }

      const onLoad = () => {
        cleanup();
        existing.dataset.loaded = "true";
        finalizeLoaded();
      };

      const onError = () => {
        cleanup();
        jaasScriptLoadPromise = null;
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

    script.onload = () => {
      script.dataset.loaded = "true";
      finalizeLoaded();
    };

    script.onerror = () => {
      jaasScriptLoadPromise = null;
      reject(new Error("Failed to load 8x8 script"));
    };

    document.head.appendChild(script);
  });

  return jaasScriptLoadPromise;
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
  const [configStatus, setConfigStatus] =
    useState<VideoCallConfigResponse | null>(null);
  const [isConfigLoading, setIsConfigLoading] = useState(true);

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

      const fallbackAppId = FRONTEND_JAAS_APP_ID || configStatus?.app_id || "";
      const payload: Record<string, string> = {
        room_name: roomInput,
        display_name: displayName,
      };

      if (fallbackAppId) {
        payload.app_id = fallbackAppId;
      }

      const response = await fetch(
        `${API_BASE_URL}/api/accounts/video-call/token/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Token ${token}`,
          },
          body: JSON.stringify(payload),
        },
      );

      const data = (await response.json()) as
        | MeetingBootstrapResponse
        | VideoCallApiError;

      if (!response.ok) {
        const errorData = data as VideoCallApiError;
        const missingFieldsText =
          errorData.missing_fields && errorData.missing_fields.length
            ? ` Missing: ${errorData.missing_fields.join(", ")}.`
            : "";
        const hintText = errorData.hint ? ` ${errorData.hint}` : "";
        throw new Error(
          `${errorData.error || "Failed to create video call session."}${missingFieldsText}${hintText}`,
        );
      }

      const bootstrap = data as MeetingBootstrapResponse;

      if (bootstrap.requires_jwt && !bootstrap.jwt) {
        throw new Error(
          "Server requires a signed video token, but no token was returned.",
        );
      }

      await ensureExternalApiScript(bootstrap.script_url);

      if (!window.JitsiMeetExternalAPI) {
        throw new Error("8x8 external API failed to initialize.");
      }

      const options: Record<string, unknown> = {
        roomName: bootstrap.room_name,
        parentNode: containerRef.current,
        width: "100%",
        height: "100%",
        userInfo: {
          displayName: bootstrap.display_name,
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

      if (bootstrap.jwt) {
        options.jwt = bootstrap.jwt;
      }

      const api = new window.JitsiMeetExternalAPI(bootstrap.domain, options);
      apiRef.current = api;
      setActiveRoomName(bootstrap.room_name);

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
  }, [
    API_BASE_URL,
    configStatus?.app_id,
    displayName,
    disposeConference,
    handleLeave,
    roomInput,
  ]);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setIsConfigLoading(false);
      return;
    }

    let cancelled = false;
    const query = FRONTEND_JAAS_APP_ID
      ? `?app_id=${encodeURIComponent(FRONTEND_JAAS_APP_ID)}`
      : "";

    const loadConfigStatus = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/accounts/video-call/config/${query}`,
          {
            headers: {
              Authorization: `Token ${token}`,
            },
          },
        );

        const data = (await response.json()) as VideoCallConfigResponse;
        if (cancelled) {
          return;
        }

        setConfigStatus(data);

        if (!data.token_endpoint_ready) {
          const missingText = data.missing_fields?.length
            ? ` Missing: ${data.missing_fields.join(", ")}.`
            : "";
          setError(
            `${data.error || "Video call backend is not ready."}${missingText} ${data.hint || "Configure backend env and restart server."}`,
          );
        }
      } catch {
        if (!cancelled) {
          setError(
            "Failed to verify video call configuration. Please check backend connectivity.",
          );
        }
      } finally {
        if (!cancelled) {
          setIsConfigLoading(false);
        }
      }
    };

    loadConfigStatus();

    return () => {
      cancelled = true;
    };
  }, [API_BASE_URL]);

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
    <div className="fixed inset-0 z-[1000] overflow-hidden bg-[#0B2F24] text-[#E8F4EF]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_18%,rgba(19,93,65,0.52),transparent_40%),radial-gradient(circle_at_88%_12%,rgba(63,164,123,0.28),transparent_36%),linear-gradient(180deg,#081C16_0%,#0B2F24_56%,#061C15_100%)]" />
        <div className="absolute -left-16 top-20 h-56 w-56 rounded-full bg-[#2C8B66]/20 blur-3xl" />
        <div className="absolute -right-20 bottom-10 h-64 w-64 rounded-full bg-[#1A7A55]/22 blur-3xl" />
      </div>

      <header className="relative z-10 flex h-16 items-center justify-between border-b border-[#2A7C5D]/45 bg-[#0E352A]/85 px-4 backdrop-blur-xl sm:px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 rounded-lg border border-[#2B7A5A] bg-[#114837]/70 px-3 py-1.5 text-sm text-[#DDF4EA] transition-colors hover:bg-[#135D41]">
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <div>
            <h1 className="text-base font-semibold tracking-wide text-[#F1FBF7] sm:text-lg">
              8x8 Video Call
            </h1>
            {activeRoomName ? (
              <p className="text-xs text-[#A9DCC7]">Room: {activeRoomName}</p>
            ) : (
              <p className="text-xs text-[#A9DCC7]">Ready to join</p>
            )}
          </div>
        </div>

        {activeRoomName && (
          <button
            onClick={handleLeave}
            className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-3 py-1.5 text-sm font-semibold text-white transition-colors hover:bg-red-700">
            <VideoOff className="h-4 w-4" />
            Leave
          </button>
        )}
      </header>

      <div className="relative z-10 h-[calc(100%-4rem)] w-full">
        <div
          ref={containerRef}
          id="jaas-container"
          className="h-full w-full bg-black/95"
        />

        {!activeRoomName && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#061C15]/80 p-4 backdrop-blur-sm">
            <div className="w-full max-w-2xl rounded-3xl border border-[#2B7A5A]/45 bg-[#0E352A]/88 p-6 shadow-[0_24px_80px_rgba(0,0,0,0.45)] backdrop-blur-xl sm:p-7">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#2D8A66]/60 bg-[#135D41]/35 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-[#C9F0DF]">
                Secure Live Session
              </div>

              <h2 className="text-xl font-bold text-[#F3FCF8] sm:text-2xl">
                Start a live class
              </h2>
              <p className="mt-2 text-sm text-[#B5E2CF]">
                Your call runs on 8x8 JaaS. Room access token is generated from
                backend for production safety.
              </p>

              {isConfigLoading && (
                <div className="mt-4 rounded-xl border border-[#2A7D5D]/50 bg-[#0F3A2D]/75 px-3 py-2 text-xs text-[#CDEFE0]">
                  Checking video service configuration...
                </div>
              )}

              {!isConfigLoading &&
                configStatus &&
                !configStatus.token_endpoint_ready && (
                  <div className="mt-4 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
                    Backend video setup is incomplete.
                    {configStatus.missing_fields?.length > 0
                      ? ` Missing: ${configStatus.missing_fields.join(", ")}.`
                      : ""}
                  </div>
                )}

              <div className="mt-5 space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium text-[#D2F2E4]">
                    Room name
                  </label>
                  <input
                    value={roomInput}
                    onChange={(event) => setRoomInput(event.target.value)}
                    placeholder="class-10-math"
                    className="w-full rounded-xl border border-[#2A7C5D] bg-[#0C2F24] px-3 py-2.5 text-sm text-white outline-none transition-colors focus:border-[#39A77A] focus:ring-2 focus:ring-[#39A77A]/35"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium text-[#D2F2E4]">
                    Display name
                  </label>
                  <input
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                    placeholder="Teacher Name"
                    className="w-full rounded-xl border border-[#2A7C5D] bg-[#0C2F24] px-3 py-2.5 text-sm text-white outline-none transition-colors focus:border-[#39A77A] focus:ring-2 focus:ring-[#39A77A]/35"
                  />
                </div>

                {error && (
                  <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                    {error}
                  </div>
                )}

                <button
                  onClick={joinConference}
                  disabled={
                    isJoining ||
                    !roomInput.trim() ||
                    (configStatus ? !configStatus.token_endpoint_ready : false)
                  }
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#135D41] to-[#1A7A55] px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-[#0A3A28]/45 transition-all hover:from-[#0F5138] hover:to-[#166A4B] disabled:cursor-not-allowed disabled:opacity-60">
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
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/40">
            <div className="inline-flex items-center gap-2 rounded-xl border border-[#2A7C5D]/55 bg-[#0E352A]/90 px-4 py-2 text-sm text-[#E8F6EF] shadow-xl backdrop-blur-md">
              <Loader2 className="h-4 w-4 animate-spin" />
              Connecting to meeting...
            </div>
          </div>
        )}

        {isConnected && (
          <div className="pointer-events-none absolute bottom-4 left-4 rounded-md border border-[#1C7A56]/70 bg-[#135D41]/92 px-3 py-1 text-xs font-semibold text-[#EAF8F2] shadow-lg">
            Connected
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoCall;
