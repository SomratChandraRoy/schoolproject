import { useEffect, useState } from "react";
import { Button } from "../components/ui/button";
import { Card } from "../components/ui/card";
import { Separator } from "../components/ui/separator";

type Provider =
  | "gemini"
  | "groq"
  | "alibaba"
  | "elevenlabs"
  | "ollama"
  | "auto";

interface AIProviderSettings {
  id: number;
  provider: Provider;
  provider_display: string;
  voice_ai_provider: Provider;
  study_plan_provider: Provider;
  quiz_flashcard_provider: Provider;
  doc_vision_provider: Provider;
  general_chat_provider: Provider;
  chat_page_provider: Provider;
  ollama_base_url: string;
  ollama_username: string;
  ollama_model: string;
  updated_at: string;
  updated_by_username: string | null;
}

const providerOptions: Array<{ value: Provider; label: string }> = [
  { value: "auto", label: "Auto (recommended)" },
  { value: "groq", label: "Groq" },
  { value: "gemini", label: "Gemini" },
  { value: "alibaba", label: "Alibaba (Qwen)" },
  { value: "elevenlabs", label: "ElevenLabs" },
  { value: "ollama", label: "Ollama" },
];

function ProviderSelect({
  value,
  onChange,
}: {
  value: Provider;
  onChange: (v: Provider) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value as Provider)}
      className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm">
      {providerOptions.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

function AdminSettings() {
  const [settings, setSettings] = useState<AIProviderSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    source?: string;
    error?: string;
  } | null>(null);

  const [provider, setProvider] = useState<Provider>("auto");
  const [voiceProvider, setVoiceProvider] = useState<Provider>("auto");
  const [studyProvider, setStudyProvider] = useState<Provider>("auto");
  const [quizProvider, setQuizProvider] = useState<Provider>("auto");
  const [visionProvider, setVisionProvider] = useState<Provider>("gemini");
  const [chatProvider, setChatProvider] = useState<Provider>("auto");
  const [chatPageProvider, setChatPageProvider] = useState<Provider>("auto");

  const [geminiApiKey, setGeminiApiKey] = useState("");
  const [groqApiKey, setGroqApiKey] = useState("");
  const [alibabaApiKey, setAlibabaApiKey] = useState("");
  const [elevenlabsApiKey, setElevenlabsApiKey] = useState("");

  const [ollamaUrl, setOllamaUrl] = useState("http://51.21.208.44");
  const [ollamaUsername, setOllamaUsername] = useState("bipul");
  const [ollamaPassword, setOllamaPassword] = useState("");
  const [ollamaModel, setOllamaModel] = useState("llama3");

  useEffect(() => {
    void fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/ai/admin/provider-settings/", {
        headers: {
          Authorization: `Token ${token}`,
        },
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to load AI settings");
      }

      setSettings(data);
      setProvider(data.provider);
      setVoiceProvider(data.voice_ai_provider);
      setStudyProvider(data.study_plan_provider);
      setQuizProvider(data.quiz_flashcard_provider);
      setVisionProvider(data.doc_vision_provider);
      setChatProvider(data.general_chat_provider);
      setChatPageProvider(
        data.chat_page_provider || data.general_chat_provider,
      );
      setOllamaUrl(data.ollama_base_url);
      setOllamaUsername(data.ollama_username);
      setOllamaModel(data.ollama_model);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load AI settings",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    setNotice(null);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/ai/admin/provider-settings/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify({
          provider,
          voice_ai_provider: voiceProvider,
          study_plan_provider: studyProvider,
          quiz_flashcard_provider: quizProvider,
          doc_vision_provider: visionProvider,
          general_chat_provider: chatProvider,
          chat_page_provider: chatPageProvider,
          gemini_api_key: geminiApiKey || undefined,
          groq_api_key: groqApiKey || undefined,
          alibaba_api_key: alibabaApiKey || undefined,
          elevenlabs_api_key: elevenlabsApiKey || undefined,
          ollama_base_url: ollamaUrl,
          ollama_username: ollamaUsername,
          ollama_password: ollamaPassword || undefined,
          ollama_model: ollamaModel,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to save AI settings");
      }

      setSettings(data.settings);
      setNotice("Settings saved.");
      setGeminiApiKey("");
      setGroqApiKey("");
      setAlibabaApiKey("");
      setElevenlabsApiKey("");
      setOllamaPassword("");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to save AI settings",
      );
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    setError(null);
    setTestResult(null);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/ai/admin/test-provider/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Token ${token}`,
        },
        body: JSON.stringify({ provider }),
      });
      const data = await response.json();
      setTestResult(data);
    } catch {
      setTestResult({ success: false, message: "Provider test failed" });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading AI settings...</div>;
  }

  return (
    <div className="mx-auto w-full max-w-5xl space-y-4 p-4 md:p-8">
      <Card className="space-y-5 p-5">
        <div>
          <h1 className="text-2xl font-semibold">AI Provider Settings</h1>
          <p className="text-sm text-muted-foreground">
            Configure model routing, API keys, and ElevenLabs voice synthesis.
          </p>
        </div>

        {error && (
          <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {notice && (
          <div className="rounded-md border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-300">
            {notice}
          </div>
        )}

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Global provider</label>
            <ProviderSelect value={provider} onChange={setProvider} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Voice conversation provider
            </label>
            <ProviderSelect value={voiceProvider} onChange={setVoiceProvider} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">General chat provider</label>
            <ProviderSelect value={chatProvider} onChange={setChatProvider} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">/chat page provider</label>
            <ProviderSelect
              value={chatPageProvider}
              onChange={setChatPageProvider}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Study plan provider</label>
            <ProviderSelect value={studyProvider} onChange={setStudyProvider} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Quiz/flashcard provider
            </label>
            <ProviderSelect value={quizProvider} onChange={setQuizProvider} />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Document vision provider
            </label>
            <ProviderSelect
              value={visionProvider}
              onChange={setVisionProvider}
            />
          </div>
        </div>

        <Separator />

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Gemini API key</label>
            <input
              type="password"
              value={geminiApiKey}
              onChange={(e) => setGeminiApiKey(e.target.value)}
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
              placeholder="Leave empty to keep current"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Groq API key</label>
            <input
              type="password"
              value={groqApiKey}
              onChange={(e) => setGroqApiKey(e.target.value)}
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
              placeholder="Leave empty to keep current"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Alibaba DashScope API key
            </label>
            <input
              type="password"
              value={alibabaApiKey}
              onChange={(e) => setAlibabaApiKey(e.target.value)}
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
              placeholder="Leave empty to keep current"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">ElevenLabs API key</label>
            <input
              type="password"
              value={elevenlabsApiKey}
              onChange={(e) => setElevenlabsApiKey(e.target.value)}
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
              placeholder="Leave empty to keep current"
            />
          </div>
        </div>

        <Separator />

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium">Ollama URL</label>
            <input
              type="text"
              value={ollamaUrl}
              onChange={(e) => setOllamaUrl(e.target.value)}
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Ollama username</label>
            <input
              type="text"
              value={ollamaUsername}
              onChange={(e) => setOllamaUsername(e.target.value)}
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Ollama password</label>
            <input
              type="password"
              value={ollamaPassword}
              onChange={(e) => setOllamaPassword(e.target.value)}
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
              placeholder="Leave empty to keep current"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Ollama model</label>
            <input
              type="text"
              value={ollamaModel}
              onChange={(e) => setOllamaModel(e.target.value)}
              className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
            />
          </div>
        </div>

        {testResult && (
          <div
            className={`rounded-md border p-3 text-sm ${
              testResult.success
                ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                : "border-destructive/40 bg-destructive/10 text-destructive"
            }`}>
            <div>{testResult.message}</div>
            {testResult.error && <div>{testResult.error}</div>}
            {testResult.source && <div>Source: {testResult.source}</div>}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={handleTest} variant="outline" disabled={testing}>
            {testing ? "Testing..." : "Test Provider"}
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </Card>

      {settings && (
        <Card className="p-5 text-sm text-muted-foreground">
          <div>Current provider: {settings.provider_display}</div>
          <div>
            Last updated: {new Date(settings.updated_at).toLocaleString()}
          </div>
          {settings.updated_by_username && (
            <div>Updated by: {settings.updated_by_username}</div>
          )}
        </Card>
      )}
    </div>
  );
}

export default AdminSettings;
