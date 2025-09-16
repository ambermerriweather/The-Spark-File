import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { AssignmentState, ParsedRubric } from '../types';
import { studentModeData, promptsByGrade } from '../constants';
import { useToast } from '../hooks/useToast';
import { generateText, generateImage } from '../services/geminiService';
import { robustFormatAIResponse, parseRubric } from '../utils/formatting';

// IMPORTANT: Replace this with your actual Google Cloud Client ID for the "Save to Google Docs" feature to work.
const GOOGLE_CLIENT_ID = 'YOUR_GOOGLE_CLIENT_ID_HERE.apps.googleusercontent.com';
const DOCS_DISCOVERY_URI = 'https://docs.googleapis.com/$discovery/rest?version=v1';
const DOCS_SCOPE = 'https://www.googleapis.com/auth/documents';


interface StudentWorkspaceProps {
    assignment: AssignmentState;
    onClose: () => void;
}

const Loader: React.FC = () => <div className="loader"></div>;

const AiGeneratedContent: React.FC<{ htmlContent: string | React.ReactNode }> = ({ htmlContent }) => (
    typeof htmlContent === 'string' ? 
        <div className="ai-generated-content" dangerouslySetInnerHTML={{ __html: htmlContent }} /> :
        <div className="ai-generated-content">{htmlContent}</div>
);

const InteractiveRubric: React.FC<{ rubricData: ParsedRubric | null }> = ({ rubricData }) => {
    const [selections, setSelections] = useState<Record<number, number>>({});
    
    if (!rubricData || !rubricData.criteria) return <p>Rubric not available.</p>;

    const criteriaCount = rubricData.criteria.length;
    const selectedCount = Object.keys(selections).length;
    const progress = criteriaCount > 0 ? (selectedCount / criteriaCount) * 100 : 0;
    
    const handleSelection = (rowIndex: number, levelIndex: number) => {
        setSelections(prev => ({ ...prev, [rowIndex]: levelIndex + 1 }));
    };

    return (
        <div className="space-y-4">
            <h3 className="text-lg font-bold font-display">Self-Assessment Rubric</h3>
            <div id="interactive-rubric" className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr>
                            <th className="!text-left !p-2">Criterion</th>
                            {rubricData.headers.map(header => <th key={header} className="!text-left !p-2">{header}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {rubricData.criteria.map((row, rowIndex) => (
                            <tr key={rowIndex}>
                                <td className="!p-2 font-semibold">{row.criterion}</td>
                                {row.levels.map((level, levelIndex) => (
                                    <td key={levelIndex} className="!p-2">
                                        <label className="flex items-start cursor-pointer">
                                            <input 
                                                type="radio" 
                                                name={`rubric-row-${rowIndex}`} 
                                                value={levelIndex + 1} 
                                                className="mt-1 mr-2"
                                                onChange={() => handleSelection(rowIndex, levelIndex)}
                                            />
                                            <span>{level}</span>
                                        </label>
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div>
                <h4 className="font-bold">Rubric Progress</h4>
                <div className="w-full h-8 bg-gray-200 rounded-full mt-1">
                    <div 
                        className="h-full bg-green-500 rounded-full text-white text-xs flex items-center justify-center transition-all duration-500" 
                        style={{ width: `${progress}%` }}
                    >
                        {Math.round(progress)}%
                    </div>
                </div>
            </div>
        </div>
    );
};

export const StudentWorkspace: React.FC<StudentWorkspaceProps> = ({ assignment, onClose }) => {
    const { addToast } = useToast();
    const draftRef = useRef<HTMLDivElement>(null);
    
    const [draftHtml, setDraftHtml] = useState<string>('');
    const [wordCount, setWordCount] = useState(0);
    const [readingTime, setReadingTime] = useState(0);
    const [activeTab, setActiveTab] = useState<'writing' | 'assignment' | 'feedback'>('writing');

    const [isImageModalOpen, setImageModalOpen] = useState(false);
    const [isSubmissionModalOpen, setSubmissionModalOpen] = useState(false);
    
    const [isGenerating, setIsGenerating] = useState<Record<string, boolean>>({});
    const [unstuckTip, setUnstuckTip] = useState<string | null>(null);
    const [aiFeedback, setAiFeedback] = useState<string | null>(null);
    const [selectedFeedbackCriteria, setSelectedFeedbackCriteria] = useState<string[]>([]);
    const [imagePrompt, setImagePrompt] = useState('');
    const [imageStyle, setImageStyle] = useState('digital art');
    const [lastGeneratedImageHTML, setLastGeneratedImageHTML] = useState('');
    
    const [studentName, setStudentName] = useState('');
    const [teacherEmail, setTeacherEmail] = useState('');
    
    const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

    // Google Auth State
    const [gapiReady, setGapiReady] = useState(false);
    const [gisReady, setGisReady] = useState(false);
    const [tokenClient, setTokenClient] = useState<any>(null);
    const [isSignedIn, setIsSignedIn] = useState(false);


    const rubricData = useMemo(() => parseRubric(assignment.rubric || ''), [assignment.rubric]);

    const targetWordCount = useMemo(() => {
        const gradeTargets = studentModeData.wordCountTargets[assignment.grade];
        // A default length is assumed if not specified.
        return gradeTargets['any'];
    }, [assignment.grade]);

    // Google API Initialization
    useEffect(() => {
        const gapiScript = document.querySelector('script[src="https://apis.google.com/js/api.js"]');
        gapiScript?.addEventListener('load', () => {
             (window as any).gapi.load('client', async () => {
                await (window as any).gapi.client.init({
                    apiKey: process.env.API_KEY,
                    discoveryDocs: [DOCS_DISCOVERY_URI],
                });
                setGapiReady(true);
            });
        });

        const gisScript = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
        gisScript?.addEventListener('load', () => {
            const client = (window as any).google.accounts.oauth2.initTokenClient({
                client_id: GOOGLE_CLIENT_ID,
                scope: DOCS_SCOPE,
                callback: (tokenResponse: any) => {
                     if (tokenResponse && tokenResponse.access_token) {
                        (window as any).gapi.client.setToken(tokenResponse);
                        setIsSignedIn(true);
                        addToast('Signed in to Google successfully!', 'success');
                    }
                },
            });
            setTokenClient(client);
            setGisReady(true);
        });
    }, [addToast]);

    // Load draft from localStorage on initial mount
    useEffect(() => {
        const savedDraft = localStorage.getItem(`spark-file-draft-${assignment.prompt.slice(0, 50)}`);
        if (savedDraft && draftRef.current) {
            draftRef.current.innerHTML = savedDraft;
            setDraftHtml(savedDraft);
            addToast('Draft loaded from a previous session.', 'info');
        }
    }, [assignment.prompt, addToast]);


    // Autosave draft with debouncing
    useEffect(() => {
        if (autoSaveStatus === 'idle') return;
        const handler = setTimeout(() => {
            localStorage.setItem(`spark-file-draft-${assignment.prompt.slice(0, 50)}`, draftHtml);
            setAutoSaveStatus('saved');
        }, 1500);
        
        return () => { clearTimeout(handler); };
    }, [draftHtml, assignment.prompt, autoSaveStatus]);
    
    // Reset auto-save status indicator after a delay
    useEffect(() => {
      if (autoSaveStatus === 'saved') {
        const statusTimeout = setTimeout(() => setAutoSaveStatus('idle'), 3000);
        return () => clearTimeout(statusTimeout);
      }
    }, [autoSaveStatus]);

    useEffect(() => {
        const draftArea = draftRef.current;
        if (!draftArea) return;
        const text = draftArea.innerText || "";
        const words = text.trim() ? (text.trim().match(/\s+/g) || []).length + 1 : 0;
        setWordCount(words);
        setReadingTime(Math.ceil(words / 200));
    }, [draftHtml]);

    const setLoading = (key: string, value: boolean) => setIsGenerating(prev => ({...prev, [key]: value }));
    const handleFormat = (command: string) => {
        if (draftRef.current) {
            draftRef.current.focus();
            document.execCommand(command, false);
            setDraftHtml(draftRef.current.innerHTML);
            setAutoSaveStatus('saving');
        }
    };
    
    const handleGoogleAuth = () => {
        if (GOOGLE_CLIENT_ID.startsWith('YOUR_GOOGLE_CLIENT_ID')) {
            addToast(<>Please replace the placeholder <strong>GOOGLE_CLIENT_ID</strong> in the code to enable this feature.</>, 'warning');
            return;
        }
        if (tokenClient) tokenClient.requestAccessToken();
        else addToast('Google authentication is not ready yet.', 'warning');
    };
    
    const handleSaveToGoogleDocs = async () => {
        if (GOOGLE_CLIENT_ID.startsWith('YOUR_GOOGLE_CLIENT_ID')) {
            addToast(<>Please replace the placeholder <strong>GOOGLE_CLIENT_ID</strong> in the code to enable this feature.</>, 'warning');
            return;
        }
        if (!isSignedIn) { addToast('Please sign in with Google first.', 'warning'); return; }
        if (!studentName) { addToast('Please enter your name.', 'warning'); return; }
        setLoading('gdocs', true);
        try {
            const doc = await (window as any).gapi.client.docs.documents.create({
                title: `${studentName}'s Draft: ${assignment.prompt.slice(0, 40)}...`
            });
            const documentId = doc.result.documentId;
            const content = `Assignment:\n${assignment.prompt}\n\n---\n\n${studentName}'s Draft:\n\n${draftRef.current?.innerText}`;
            await (window as any).gapi.client.docs.documents.batchUpdate({
                documentId: documentId,
                resource: {
                    requests: [{ insertText: { location: { index: 1 }, text: content } }]
                }
            });
            const docUrl = `https://docs.google.com/document/d/${documentId}/edit`;
            const toastMessage = <p>Saved! <a href={docUrl} target="_blank" rel="noopener noreferrer" className="underline font-bold">Open Google Doc</a></p>;
            addToast(toastMessage, 'success');

        } catch (error) {
            console.error('Google Docs API error:', error);
            addToast('Error saving to Google Docs.', 'error');
            if((error as any)?.result?.error?.message.includes("API key not valid")) {
                addToast("The provided API key is not valid for Google Docs.", "error");
            }
        } finally {
            setLoading('gdocs', false);
        }
    };


    const handleGetUnstuck = async () => {
        setLoading('unstuck', true); setUnstuckTip(null);
        const prompt = `A student is stuck writing. Their prompt is "${assignment.prompt}". Their draft so far is: "${draftRef.current?.innerText}". Give them one creative, inspiring question to get them unstuck.`;
        const tip = await generateText(prompt);
        if (tip) setUnstuckTip(tip); else addToast('Could not get a tip from the AI.', 'error');
        setLoading('unstuck', false);
    };

    const handleGetAIFeedback = async () => {
        if (wordCount < 50) { addToast("Write at least 50 words to get feedback.", "warning"); return; }
        setLoading('feedback', true); setAiFeedback(null);
        
        const baseReqs = assignment.requirements.join(', ') || 'clarity, creativity, and structure';
        const focusedReqs = selectedFeedbackCriteria.length > 0 
            ? selectedFeedbackCriteria.join(', ')
            : baseReqs;

        const prompt = `You are a helpful writing coach. Provide feedback on the following draft. Focus specifically on these criteria: **${focusedReqs}**. The draft is: "${draftRef.current?.innerText}". Keep feedback concise and encouraging, in 2-3 bullet points.`;
        
        const feedback = await generateText(prompt);
        if (feedback) setAiFeedback(robustFormatAIResponse(feedback)); else addToast('Could not get feedback from the AI.', 'error');
        setLoading('feedback', false);
    };

    const handleCriterionSelection = (criterion: string) => {
        setSelectedFeedbackCriteria(prev =>
            prev.includes(criterion)
                ? prev.filter(c => c !== criterion)
                : [...prev, criterion]
        );
    };

    const handleGenerateImage = async () => {
        if (!imagePrompt) { addToast('Please enter an image description.', 'warning'); return; }
        setLoading('image', true); setLastGeneratedImageHTML('');
        const base64Data = await generateImage(imagePrompt, imageStyle, assignment.prompt);
        if (base64Data) {
            const imageUrl = `data:image/png;base64,${base64Data}`;
            setLastGeneratedImageHTML(`<img src="${imageUrl}" alt="${imagePrompt}" style="max-width: 100%; height: auto; border-radius: 0.5rem; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);">`);
        } else {
            addToast('Could not generate image.', 'error');
            setLastGeneratedImageHTML('<p class="text-red-500">Image generation failed.</p>');
        }
        setLoading('image', false);
    };

    const handleInsertImage = () => {
        if (draftRef.current) {
            draftRef.current.focus();
            document.execCommand('insertHTML', false, `<p>${lastGeneratedImageHTML}</p>`);
            const newHtml = draftRef.current.innerHTML;
            setDraftHtml(newHtml);
            setAutoSaveStatus('saving');
        }
        setImageModalOpen(false);
    };
    
    const handleSubmit = () => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!studentName || !teacherEmail) { addToast('Please enter your name and teacher email.', 'warning'); return; }
        if (!emailRegex.test(teacherEmail)) { addToast('Please enter a valid email address.', 'warning'); return; }
        const subject = `Writing Submission from ${studentName}`;
        const body = `<h1>Assignment</h1><p>${assignment.prompt}</p><hr><h1>${studentName}'s Draft</h1>${draftHtml}`;
        window.location.href = `mailto:${teacherEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        setSubmissionModalOpen(false);
    };
    
    const handleWordClick = (word: string) => {
        const editor = draftRef.current; if (!editor) return;
        editor.focus(); document.execCommand('insertText', false, word + ' ');
        const newHtml = editor.innerHTML;
        setDraftHtml(newHtml);
        setAutoSaveStatus('saving');
    };

    const handleDraftInput = (e: React.FormEvent<HTMLDivElement>) => {
        setDraftHtml(e.currentTarget.innerHTML);
        setAutoSaveStatus('saving');
    };

    return (
        <div className="fixed inset-0 bg-white p-4 sm:p-6 md:p-8 z-50">
            <div className="w-full h-full max-w-screen-2xl mx-auto flex flex-col md:flex-row gap-6">
                {/* Main Content */}
                <main className="flex-grow flex flex-col h-full bg-white rounded-lg border">
                    <div className="p-4 border-b">
                        <h2 className="text-lg font-bold text-indigo-600 font-display">Your Assignment</h2>
                        <div className="mt-1 text-sm"><AiGeneratedContent htmlContent={assignment.prompt} /></div>
                    </div>
                     <div className="p-2 border-b flex items-center gap-2 bg-slate-50">
                        <button onClick={() => handleFormat('bold')} className="px-3 py-1 text-sm font-bold rounded hover:bg-slate-200">B</button>
                        <button onClick={() => handleFormat('italic')} className="px-3 py-1 text-sm italic rounded hover:bg-slate-200">I</button>
                        <button onClick={() => handleFormat('underline')} className="px-3 py-1 text-sm underline rounded hover:bg-slate-200">U</button>
                        <div className="h-5 border-l mx-2"></div>
                        <button onClick={() => handleFormat('insertUnorderedList')} className="px-3 py-1 text-sm rounded hover:bg-slate-200">● List</button>
                        <button onClick={() => handleFormat('insertOrderedList')} className="px-3 py-1 text-sm rounded hover:bg-slate-200">1. List</button>
                    </div>
                    <div
                        ref={draftRef}
                        contentEditable="true"
                        className="draft-area w-full h-full p-4 text-base bg-transparent overflow-y-auto"
                        onInput={handleDraftInput}
                        suppressContentEditableWarning
                    />
                    <div className="p-3 border-t flex items-center justify-between text-xs">
                        <div className="flex items-center gap-4"><span>Words: <strong>{wordCount}</strong></span><span>Reading time: <strong>{readingTime} min</strong></span></div>
                        <div className="w-1/3">
                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: `${Math.min(100, (wordCount / targetWordCount) * 100)}%` }}></div>
                            </div>
                            <p className="text-center text-gray-500 mt-1">Target: {targetWordCount} words</p>
                        </div>
                    </div>
                </main>
                
                {/* Sidebar */}
                <aside className="w-full md:w-96 flex-shrink-0 flex flex-col gap-4">
                    <div className="p-4 rounded-lg bg-slate-100 border">
                        <div className="flex items-center justify-between"><h3 className="font-bold text-lg font-display">Student Tools</h3><button onClick={onClose} className="text-gray-500 hover:text-red-500 text-2xl">&times;</button></div>
                         <div className="mt-4 space-y-2">
                            <div><label htmlFor="student-name" className="text-sm font-medium text-slate-600">Your Name</label><input type="text" id="student-name" value={studentName} onChange={e => setStudentName(e.target.value)} className="mt-1 w-full p-2 bg-white border border-slate-300 rounded-md" placeholder="Enter your name"/></div>
                            {!isSignedIn ? (
                                <button onClick={handleGoogleAuth} disabled={!gapiReady || !gisReady} className="action-btn text-sm !py-2 w-full bg-gray-700 hover:bg-gray-800 disabled:bg-gray-400">Sign in with Google</button>
                            ) : (
                                <button onClick={handleSaveToGoogleDocs} disabled={isGenerating['gdocs']} className="action-btn text-sm !py-2 w-full bg-blue-600 hover:bg-blue-700">{isGenerating['gdocs'] ? <Loader /> : 'Save to Google Docs'}</button>
                            )}
                            <button onClick={() => setSubmissionModalOpen(true)} className="action-btn text-sm !py-2 w-full bg-green-600">Submit via Email</button>
                        </div>
                         <div className="text-center text-xs text-slate-500 h-4 mt-1 transition-opacity duration-300"><span>{autoSaveStatus === 'saving' && 'Saving...'}{autoSaveStatus === 'saved' && '✓ All changes saved'}</span></div>
                    </div>
                    <div className="flex-grow flex flex-col rounded-lg bg-slate-100 border overflow-hidden">
                        <div className="flex items-center border-b bg-slate-200 text-sm">
                            <button onClick={() => setActiveTab('writing')} className={`p-2 px-4 ${activeTab === 'writing' ? 'bg-slate-100 font-semibold' : 'bg-slate-200'}`}>Writing</button>
                            <button onClick={() => setActiveTab('assignment')} className={`p-2 px-4 ${activeTab === 'assignment' ? 'bg-slate-100 font-semibold' : 'bg-slate-200'}`}>Assignment</button>
                            <button onClick={() => setActiveTab('feedback')} className={`p-2 px-4 ${activeTab === 'feedback' ? 'bg-slate-100 font-semibold' : 'bg-slate-200'}`}>Feedback</button>
                        </div>
                        <div className="p-4 overflow-y-auto">
                            {activeTab === 'writing' && (
                                <div className="space-y-4">
                                    {unstuckTip && (<div className="p-3 border rounded-lg text-sm bg-yellow-50 border-yellow-200 relative"><button onClick={() => setUnstuckTip(null)} className="absolute top-1 right-2 text-yellow-600 hover:text-yellow-800">&times;</button><p className="font-semibold text-yellow-800">💡 Stuck? Try this:</p><p className="mt-1 text-yellow-700">{unstuckTip}</p></div>)}
                                    <div className="grid grid-cols-2 gap-2">
                                        <button onClick={handleGetUnstuck} disabled={isGenerating['unstuck']} className="action-btn w-full text-sm !py-2 bg-rose-600">{isGenerating['unstuck'] ? <Loader /> : '✨ Get Unstuck'}</button>
                                        <button onClick={() => setImageModalOpen(true)} className="action-btn w-full text-sm !py-2 bg-orange-500">🖼️ Generate Image</button>
                                    </div>
                                    <details open><summary className="font-bold cursor-pointer font-display">Word Bank</summary><div className="flex flex-wrap gap-1 text-xs mt-2">{promptsByGrade.all.wordBanks[assignment.grade].map(word => <button key={word} onClick={() => handleWordClick(word)} className="p-1 bg-gray-200 hover:bg-indigo-100 rounded">{word}</button>)}</div></details>
                                    <details open><summary className="font-bold cursor-pointer font-display">Sentence Starters</summary><ul className="text-xs list-disc list-inside mt-2 space-y-1">{promptsByGrade.all.sentenceStarters[assignment.grade].map(starter => <li key={starter}>{starter}</li>)}</ul></details>
                                </div>
                            )}
                             {activeTab === 'assignment' && (<div className="space-y-4"><details open><summary className="font-bold cursor-pointer font-display">Scaffolding Questions</summary><div className="p-2 text-sm bg-white rounded-md mt-1"><AiGeneratedContent htmlContent={robustFormatAIResponse(assignment.scaffolding || '')} /></div></details><details open><summary className="font-bold cursor-pointer font-display">Mini-Lesson</summary><div className="p-2 text-sm bg-white rounded-md mt-1"><AiGeneratedContent htmlContent={robustFormatAIResponse(assignment.miniLesson || '')} /></div></details></div>)}
                             {activeTab === 'feedback' && (
                                <div className="space-y-4">
                                    <InteractiveRubric rubricData={rubricData} />
                                    {rubricData && rubricData.criteria.length > 0 && (
                                        <div className="p-3 border rounded-lg bg-white">
                                            <h4 className="font-bold font-display">Focus Your Feedback</h4>
                                            <p className="text-xs text-slate-600 mb-2">Select rubric criteria for the AI to focus on.</p>
                                            <div className="space-y-1">
                                                {rubricData.criteria.map((item) => (
                                                    <label key={item.criterion} className="flex items-center text-sm cursor-pointer">
                                                        <input
                                                            type="checkbox"
                                                            className="mr-2 h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500"
                                                            checked={selectedFeedbackCriteria.includes(item.criterion)}
                                                            onChange={() => handleCriterionSelection(item.criterion)}
                                                        />
                                                        {item.criterion}
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    <button onClick={handleGetAIFeedback} disabled={isGenerating['feedback']} className="action-btn w-full text-sm !py-2 bg-teal-600">{isGenerating['feedback'] ? <Loader /> : '🤖 Get AI Feedback'}</button>
                                    {aiFeedback && <div className="p-3 border rounded-lg text-sm bg-blue-50 border-blue-200"><AiGeneratedContent htmlContent={aiFeedback}/></div>}
                                </div>
                            )}
                        </div>
                    </div>
                </aside>
            </div>

            {isImageModalOpen && (<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60]"><div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg text-center relative"><button onClick={() => setImageModalOpen(false)} className="absolute top-2 right-2 text-gray-500 hover:text-red-500 text-2xl">&times;</button><h3 className="text-xl font-bold font-display">✨ AI Image Generator</h3><p className="text-slate-600 my-2">Describe the image and choose a style.</p><div className="flex justify-center flex-wrap gap-2 mb-4">{['digital art', 'photorealistic', 'watercolor', 'pixel art'].map(style => (<button key={style} onClick={() => setImageStyle(style)} className={`px-3 py-1 text-sm rounded-full border transition-colors ${imageStyle === style ? 'bg-rose-600 text-white border-rose-600' : 'bg-white text-slate-700 hover:bg-slate-100'}`}>{style.charAt(0).toUpperCase() + style.slice(1).replace(/-/g, ' ')}</button>))}</div><div className="flex gap-2 mb-4"><input value={imagePrompt} onChange={e => setImagePrompt(e.target.value)} type="text" className="w-full p-2 bg-slate-100 border border-slate-300 rounded-md" placeholder="e.g., a friendly green dragon drinking tea"/><button onClick={handleGenerateImage} disabled={isGenerating['image']} className="action-btn !py-2 !px-4 bg-rose-600">{isGenerating['image'] ? <Loader /> : 'Generate'}</button></div><div className="min-h-[256px] bg-slate-100 rounded-md flex items-center justify-center">{isGenerating['image'] ? <Loader /> : lastGeneratedImageHTML ? <AiGeneratedContent htmlContent={lastGeneratedImageHTML}/> : <span className="text-slate-500">Image will appear here</span>}</div>{lastGeneratedImageHTML && !lastGeneratedImageHTML.includes('failed') && <button onClick={handleInsertImage} className="action-btn w-full mt-4 bg-green-600">Insert Image</button>}</div></div>)}
            {isSubmissionModalOpen && (<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[70]"><div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md relative"><button onClick={() => setSubmissionModalOpen(false)} className="absolute top-2 right-2 text-gray-500 hover:text-red-500 text-2xl">&times;</button><h3 className="text-xl font-bold mb-4 font-display text-center">Submit Your Work</h3><div className="space-y-4"><div><label htmlFor="teacher-email-input" className="block text-sm font-medium text-slate-700">Teacher's Email</label><input type="email" id="teacher-email-input" value={teacherEmail} onChange={e => setTeacherEmail(e.target.value)} className="mt-1 w-full p-2 bg-slate-100 border border-slate-300 rounded-md" placeholder="teacher@school.com"/></div><button onClick={handleSubmit} className="action-btn w-full bg-indigo-600 hover:bg-indigo-700">Submit via Email</button></div></div></div>)}
        </div>
    );
};