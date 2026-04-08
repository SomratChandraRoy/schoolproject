import * as React from 'react';
import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';

interface AIProviderSettings {
    id: number;
    provider: 'gemini' | 'ollama' | 'auto';
    provider_display: string;
    ollama_base_url: string;
    ollama_username: string;
    ollama_model: string;
    updated_at: string;
    updated_by_username: string | null;
}

function AdminSettings() {
    const [settings, setSettings] = useState<AIProviderSettings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [testing, setTesting] = useState(false);
    const [testResult, setTestResult] = useState<{ success: boolean; message: string; source?: string } | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Form state
    const [provider, setProvider] = useState<'gemini' | 'ollama' | 'auto'>('auto');
    const [ollamaUrl, setOllamaUrl] = useState('http://51.21.208.44');
    const [ollamaUsername, setOllamaUsername] = useState('bipul');
    const [ollamaPassword, setOllamaPassword] = useState('');
    const [ollamaModel, setOllamaModel] = useState('llama3');

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/ai/admin/provider-settings/', {
                headers: {
                    'Authorization': `Token ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setSettings(data);
                setProvider(data.provider);
                setOllamaUrl(data.ollama_base_url);
                setOllamaUsername(data.ollama_username);
                setOllamaModel(data.ollama_model);
            } else {
                setError('Failed to load settings');
            }
        } catch (err) {
            setError('Error loading settings');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        setError(null);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/ai/admin/provider-settings/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${token}`
                },
                body: JSON.stringify({
                    provider,
                    ollama_base_url: ollamaUrl,
                    ollama_username: ollamaUsername,
                    ollama_password: ollamaPassword || undefined,
                    ollama_model: ollamaModel
                })
            });

            if (response.ok) {
                const data = await response.json();
                setSettings(data.settings);
                alert('✅ Settings saved successfully!');
                setOllamaPassword(''); // Clear password field
            } else {
                const errorData = await response.json();
                setError(errorData.error || 'Failed to save settings');
            }
        } catch (err) {
            setError('Error saving settings');
        } finally {
            setSaving(false);
        }
    };

    const handleTest = async () => {
        setTesting(true);
        setTestResult(null);
        setError(null);

        try {
            const token = localStorage.getItem('token');
            const response = await fetch('/api/ai/admin/test-provider/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Token ${token}`
                },
                body: JSON.stringify({ provider })
            });

            const data = await response.json();
            setTestResult(data);
        } catch (err) {
            setTestResult({
                success: false,
                message: 'Error testing provider'
            });
        } finally {
            setTesting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
                <Navbar />
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <Navbar />
            <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                    {/* Header */}
                    <div className="px-6 py-8 border-b border-gray-200 dark:border-gray-700">
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                            🤖 AI Provider Settings
                        </h1>
                        <p className="text-gray-600 dark:text-gray-400">
                            Configure which AI provider to use for all AI features
                        </p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mx-6 mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                            <p className="text-red-800 dark:text-red-200">{error}</p>
                        </div>
                    )}

                    {/* Settings Form */}
                    <div className="px-6 py-8 space-y-6">
                        {/* Provider Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                                AI Provider
                            </label>
                            <div className="space-y-3">
                                {/* Gemini Option */}
                                <div
                                    onClick={() => setProvider('gemini')}
                                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${provider === 'gemini'
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                                        }`}
                                >
                                    <div className="flex items-start">
                                        <input
                                            type="radio"
                                            checked={provider === 'gemini'}
                                            onChange={() => setProvider('gemini')}
                                            className="mt-1 mr-3"
                                        />
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-gray-900 dark:text-white">
                                                🌟 Gemini API Only
                                            </h3>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                Use Google Gemini API for all AI features. Fast and reliable, but has quota limits.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Ollama Option */}
                                <div
                                    onClick={() => setProvider('ollama')}
                                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${provider === 'ollama'
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                                        }`}
                                >
                                    <div className="flex items-start">
                                        <input
                                            type="radio"
                                            checked={provider === 'ollama'}
                                            onChange={() => setProvider('ollama')}
                                            className="mt-1 mr-3"
                                        />
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-gray-900 dark:text-white">
                                                🦙 Ollama (AWS) Only
                                            </h3>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                Use your AWS-hosted Ollama server. Unlimited requests, but requires EC2 instance running.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Auto Option */}
                                <div
                                    onClick={() => setProvider('auto')}
                                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${provider === 'auto'
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                            : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
                                        }`}
                                >
                                    <div className="flex items-start">
                                        <input
                                            type="radio"
                                            checked={provider === 'auto'}
                                            onChange={() => setProvider('auto')}
                                            className="mt-1 mr-3"
                                        />
                                        <div className="flex-1">
                                            <h3 className="font-semibold text-gray-900 dark:text-white">
                                                ⚡ Auto (Recommended)
                                            </h3>
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                Try Groq first, then fallback to Gemini. Ollama remains available for direct use.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Ollama Configuration */}
                        {(provider === 'ollama' || provider === 'auto') && (
                            <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                                    Ollama Configuration
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Server URL
                                        </label>
                                        <input
                                            type="text"
                                            value={ollamaUrl}
                                            onChange={(e) => setOllamaUrl(e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                            placeholder="http://51.21.208.44"
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Username
                                            </label>
                                            <input
                                                type="text"
                                                value={ollamaUsername}
                                                onChange={(e) => setOllamaUsername(e.target.value)}
                                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                                Password
                                            </label>
                                            <input
                                                type="password"
                                                value={ollamaPassword}
                                                onChange={(e) => setOllamaPassword(e.target.value)}
                                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                                placeholder="Leave empty to keep current"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                            Model
                                        </label>
                                        <input
                                            type="text"
                                            value={ollamaModel}
                                            onChange={(e) => setOllamaModel(e.target.value)}
                                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Test Result */}
                        {testResult && (
                            <div className={`p-4 rounded-lg ${testResult.success
                                    ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                                    : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                                }`}>
                                <p className={testResult.success ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'}>
                                    {testResult.success ? '✅' : '❌'} {testResult.message}
                                </p>
                                {testResult.source && (
                                    <p className="text-sm mt-1 text-gray-600 dark:text-gray-400">
                                        Source: {testResult.source.toUpperCase()}
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Current Settings Info */}
                        {settings && (
                            <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
                                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                                    Current Settings
                                </h4>
                                <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                                    <p>Provider: <span className="font-medium">{settings.provider_display}</span></p>
                                    <p>Last updated: {new Date(settings.updated_at).toLocaleString()}</p>
                                    {settings.updated_by_username && (
                                        <p>Updated by: {settings.updated_by_username}</p>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700 flex justify-between">
                        <button
                            onClick={handleTest}
                            disabled={testing}
                            className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors disabled:opacity-50"
                        >
                            {testing ? 'Testing...' : 'Test Connection'}
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50"
                        >
                            {saving ? 'Saving...' : 'Save Settings'}
                        </button>
                    </div>
                </div>

                {/* Info Box */}
                <div className="mt-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
                    <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-3">
                        ℹ️ How It Works
                    </h3>
                    <ul className="text-sm text-blue-800 dark:text-blue-300 space-y-2">
                        <li>• <strong>Gemini Only:</strong> All AI features use Gemini API (fast, but has quota limits)</li>
                        <li>• <strong>Ollama Only:</strong> All AI features use your AWS Ollama server (unlimited, but requires EC2 running)</li>
                        <li>• <strong>Auto Mode:</strong> Tries Groq first, then Gemini. Ollama stays available for direct testing.</li>
                        <li>• <strong>Note:</strong> The /ollama page always uses Ollama directly regardless of this setting</li>
                    </ul>
                </div>
            </div>
        </div>
    );
}

export default AdminSettings;
