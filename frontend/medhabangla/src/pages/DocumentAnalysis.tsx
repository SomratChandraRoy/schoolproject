import React, { useState } from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';

const DocumentAnalysis: React.FC = () => {
    const [file, setFile] = useState<File | null>(null);
    const [instruction, setInstruction] = useState('');
    const [preview, setPreview] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [analysisResult, setAnalysisResult] = useState('');
    const [error, setError] = useState('');

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setError('');
            setAnalysisResult('');
            
            if (selectedFile.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onloadend = () => setPreview(reader.result as string);
                reader.readAsDataURL(selectedFile);
            } else if (selectedFile.type === 'application/pdf') {
                setPreview(null);
            } else {
                setError('Please upload a PDF or an Image (JPG/PNG).');
                setFile(null);
            }
        }
    };

    const analyzeDocument = async () => {
        if (!file) {
            setError('Please select a file first.');
            return;
        }

        setIsAnalyzing(true);
        setError('');
        
        try {
            const formData = new FormData();
            formData.append('file', file);
            if (instruction) {
                formData.append('instruction', instruction);
            }
            
            const token = localStorage.getItem('token');
            const res = await axios.post('/api/ai/document/analyze/', formData, {
                headers: { 
                    'Content-Type': 'multipart/form-data',
                    Authorization: \Token \\
                }
            });
            
            setAnalysisResult(res.data.analysis || 'Analysis complete, but no result generated.');
        } catch (err: any) {
            console.error('Doc Analysis Error:', err);
            setError(err.response?.data?.error || 'Failed to analyze document.');
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto p-6 md:flex gap-8 min-h-[85vh]">
            <div className="md:w-1/3 space-y-6 mb-6 md:mb-0 h-full flex flex-col">
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700">
                    <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-white">?? AI Doc Vision</h2>
                    <p className="text-sm text-gray-500 mb-6">Upload study notes, diagrams, mathematical equations, or book pages for AI analysis.</p>

                    <label className="block mb-4">
                        <span className="sr-only">Choose profile photo</span>
                        <input type="file" onChange={handleFileChange} accept="application/pdf,image/png,image/jpeg,image/webp" className="block w-full text-sm text-gray-500
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-full file:border-0
                          file:text-sm file:font-semibold
                          file:bg-blue-50 file:text-blue-700
                          hover:file:bg-blue-100
                          dark:text-gray-400 dark:file:bg-gray-700 dark:file:text-gray-200
                        "/>
                    </label>

                    {preview && (
                        <div className="mb-4 bg-gray-100 dark:bg-gray-900 rounded-xl overflow-hidden shadow-inner flex items-center justify-center min-h-48 max-h-64">
                            <img src={preview} alt="Preview" className="max-h-64 object-contain" />
                        </div>
                    )}
                    
                    {!preview && file && file.type === 'application/pdf' && (
                        <div className="mb-4 bg-blue-50 dark:bg-blue-900/30 p-8 rounded-xl flex items-center justify-center border border-blue-100 dark:border-blue-800">
                            <span className="text-4xl">??</span>
                            <span className="ml-3 font-medium text-blue-700 dark:text-blue-300">PDF Selection Ready</span>
                        </div>
                    )}

                    <textarea 
                        className="w-full p-3 border rounded-xl bg-gray-50 dark:bg-gray-900 dark:border-gray-700 dark:text-white mb-4 focus:ring-2 ring-blue-500 outline-none transition-all" 
                        rows={3}
                        placeholder="What do you want to learn from this document? (e.g. 'Explain the formula in this image')"
                        value={instruction}
                        onChange={(e) => setInstruction(e.target.value)}
                    ></textarea>

                    {error && <div className="p-3 mb-4 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg">{error}</div>}

                    <button 
                        onClick={analyzeDocument}
                        disabled={isAnalyzing || !file}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl disabled:opacity-50 transition-colors shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                    >
                        {isAnalyzing ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                                Analyzing...
                            </>
                        ) : '?? Analyze Document'}
                    </button>
                </div>
            </div>

            <div className="md:w-2/3 bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-y-auto max-h-[85vh]">
                <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-6 border-b pb-4 dark:border-gray-700">Analysis Result</h3>
                
                {analysisResult ? (
                    <div className="prose dark:prose-invert max-w-none prose-blue">
                        <ReactMarkdown>{analysisResult}</ReactMarkdown>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-400 dark:text-gray-500">
                        <span className="text-6xl mb-4">?</span>
                        <p className="text-lg">Upload a document and click 'Analyze' to view AI insights.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DocumentAnalysis;
