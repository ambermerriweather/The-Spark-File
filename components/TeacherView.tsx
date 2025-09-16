import React, { useState, useEffect, useMemo, useRef } from 'react';
import { promptsByGrade } from '../constants';
import type { AssignmentState, GenerationType, GradeBand } from '../types';
import { useToast } from '../hooks/useToast';
import { generateText } from '../services/geminiService';
import { robustFormatAIResponse } from '../utils/formatting';

interface TeacherViewProps {
    onOpenWorkspace: (state: AssignmentState) => void;
}

const Loader: React.FC<{ className?: string }> = ({ className = ''}) => <div className={`loader ${className}`}></div>;

const AiGeneratedContent: React.FC<{ htmlContent: string }> = ({ htmlContent }) => (
    <div className="ai-generated-content" dangerouslySetInnerHTML={{ __html: htmlContent }} />
);

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).replace(/([A-Z])/g, ' $1');

const LiteraryFocusMultiselect: React.FC<{ grade: GradeBand | 'any', selected: string[], onChange: (selected: string[]) => void }> = ({ grade, selected, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    const options = useMemo(() => {
        const focusGrade = (grade !== 'any' && promptsByGrade[grade]) ? grade : 'middleSchool';
        return promptsByGrade[focusGrade]?.literaryFocus || {};
    }, [grade]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    
    const handleCheckboxChange = (focusKey: string) => {
        const newSelected = selected.includes(focusKey)
            ? selected.filter(item => item !== focusKey)
            : [...selected, focusKey];
        onChange(newSelected);
    };

    const triggerText = selected.length > 0 ? selected.map(capitalize).join(', ') : 'Select...';

    return (
        <div className="relative" ref={containerRef}>
            <label className="block text-sm font-medium text-slate-700 mb-1">Literary Focus</label>
            <button onClick={() => setIsOpen(!isOpen)} className="w-full p-3 rounded-lg custom-select-trigger cursor-pointer text-slate-700 truncate text-left bg-slate-100 border border-slate-200">
                {triggerText}
            </button>
            {isOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-slate-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {Object.keys(options).map(key => (
                         <label key={key} className="flex items-center p-2 hover:bg-slate-100 cursor-pointer">
                            <input type="checkbox" className="form-checkbox h-4 w-4 text-indigo-600 rounded" checked={selected.includes(key)} onChange={() => handleCheckboxChange(key)} />
                            <span className="ml-2 text-sm text-slate-700">{capitalize(key)}</span>
                        </label>
                    ))}
                </div>
            )}
        </div>
    );
};

export const TeacherView: React.FC<TeacherViewProps> = ({ onOpenWorkspace }) => {
    const { addToast } = useToast();
    const [grade, setGrade] = useState<GradeBand | 'any'>('any');
    const [academicTopic, setAcademicTopic] = useState('any');
    const [genre, setGenre] = useState('any');
    const [literaryFocuses, setLiteraryFocuses] = useState<string[]>([]);
    const [formatType, setFormatType] = useState('any');
    
    const [isGenerating, setIsGenerating] = useState(false);
    const [generatedState, setGeneratedState] = useState<AssignmentState | null>(null);
    const [promptDisplayHtml, setPromptDisplayHtml] = useState('<div class="text-lg md:text-xl font-medium w-full">Select a grade band and generate a prompt to get started</div>');

    const currentGradeData = useMemo(() => grade !== 'any' ? promptsByGrade[grade] : null, [grade]);

    // Reset filters when grade changes
    useEffect(() => {
        setAcademicTopic('any');
        setGenre('any');
        setLiteraryFocuses([]);
        setFormatType('any');
    }, [grade]);

    const getPromptPool = (): string[] => {
        if (!currentGradeData) return [];
        let pool: string[] = [];

        if (literaryFocuses.length > 0) {
            literaryFocuses.forEach(focus => { pool.push(...(currentGradeData.literaryFocus[focus as keyof typeof currentGradeData.literaryFocus] || [])); });
        }
        // FIX: The `academic` topic keys are disjoint across grade levels, causing `keyof typeof currentGradeData.academic` to resolve to `never`.
        // Casting to `Record<string, string[]>` allows indexing with a string key safely.
        if (academicTopic !== 'any') pool.push(...((currentGradeData.academic as Record<string, string[]>)[academicTopic] || []));
        if (genre !== 'any') pool.push(...(currentGradeData.genre[genre as keyof typeof currentGradeData.genre] || []));
        if (formatType !== 'any') pool.push(...(currentGradeData.format[formatType as keyof typeof currentGradeData.format] || []));

        if (pool.length === 0) {
             // FIX: Similar to above, `Object.values` struggles with the union type for `academic`. Casting resolves this and improves type inference.
             Object.values((currentGradeData.academic as Record<string, string[]>) || {}).flat().forEach(p => pool.push(p));
             // FIX: Cast `p` to string to resolve TypeScript inference error on complex union types which was causing `p` to be inferred as `never`.
             Object.values(currentGradeData.genre || {}).flat().forEach(p => pool.push(p as string));
        }
        return [...new Set(pool.filter(p => p))];
    };
    
    const generateAndDisplayTeacherTools = async (state: AssignmentState) => {
        setIsGenerating(true);
        setGeneratedState(null);
        setPromptDisplayHtml(`<div class="flex flex-col items-center gap-2"><div class="loader !border-indigo-500 !border-b-transparent"></div><p>Generating AI teaching tools...</p></div>`);

        const { grade, prompt, requirements } = state;
        const gradeLevelMap = { elementary: '5th', middleSchool: '8th', highSchool: '11th' };
        const commonCorePrompt = `Referencing Common Core Standards for English Language Arts (Writing) for a ${gradeLevelMap[grade]}-grade student...`;
        const studentFacingPrompt = `You are a friendly writing coach for a ${gradeLevelMap[grade]} grade student. Your tone is encouraging and easy to understand.`;

        try {
            const [scaffolding, miniLesson, rubric] = await Promise.all([
                generateText(`${studentFacingPrompt} The student's prompt is: "${prompt}". Generate 3-4 guiding questions to get them started. Speak to the student.`),
                generateText(`${studentFacingPrompt} The student needs a mini-lesson on: ${requirements?.join(', ') || 'creative writing'}. Write a short, simple explanation (~100 words).`),
                generateText(`${commonCorePrompt} create a 4-level rubric in a markdown table for: "${prompt}". Levels: Beginning, Developing, Proficient, Exemplary. Criteria should focus on: ${requirements?.join(', ') || 'general writing skills'}.`),
            ]);

            const finalState = { ...state, scaffolding, miniLesson, rubric };
            setGeneratedState(finalState);

            let promptHTML = `<p>${finalState.prompt}</p>`;
            if (finalState.type === 'visual') {
                 promptHTML = `<img src="${finalState.img}" alt="Visual prompt" class="rounded-lg shadow-md w-full max-w-lg aspect-video object-cover mb-4"/><p>${finalState.prompt}</p>`;
            } else if (finalState.type === 'assignment') {
                promptHTML = `<div class="text-left space-y-4 w-full"><div><h3 class="text-xl font-bold text-purple-700 font-display">Writing Assignment</h3><p class="mt-1">${finalState.prompt}</p></div><div><h4 class="font-semibold text-slate-800 font-display">Requirements</h4><ul class="list-disc list-inside text-slate-700 mt-1">${finalState.requirements.map(r => `<li>${r}</li>`).join('')}</ul></div></div>`;
            }
            setPromptDisplayHtml(promptHTML);

        } catch (error) {
            addToast('Failed to generate AI tools.', 'error');
            console.error(error);
            setPromptDisplayHtml('<p class="text-red-500">Error generating content. Please try again.</p>')
        } finally {
            setIsGenerating(false);
        }
    };

    const handleGeneration = async (type: GenerationType) => {
        if (grade === 'any') { addToast('Please select a grade band.', 'warning'); return; }
        if (!currentGradeData) return;

        let state: Omit<AssignmentState, 'scaffolding' | 'miniLesson' | 'rubric'> = { grade, type, prompt: '', requirements: [] };
        
        if (type === 'visual') {
            const visual = currentGradeData.visual[Math.floor(Math.random() * currentGradeData.visual.length)];
            state.prompt = visual.prompt;
            state.img = visual.img;
        } else if (type === 'starter') {
            state.prompt = currentGradeData.storyStarters[Math.floor(Math.random() * currentGradeData.storyStarters.length)];
        } else if (type === 'subverter') {
            state.prompt = currentGradeData.subverters[Math.floor(Math.random() * currentGradeData.subverters.length)];
        } else if (type === 'choice') {
            const pool = getPromptPool(); if (pool.length < 3) { addToast('Not enough prompts for a choice board.', 'warning'); return; }
            let choices = new Set<string>();
            while(choices.size < 3 && choices.size < pool.length) { choices.add(pool[Math.floor(Math.random() * pool.length)]) }
            const promptHTML = `<h3 class="font-bold text-lg mb-2 font-display">Choose an Adventure</h3><div class="space-y-2 text-left">${Array.from(choices).map(c => `<button class="choice-btn w-full text-left p-3 bg-white hover:bg-indigo-50 border rounded-lg transition" data-prompt="${c}">${c}</button>`).join('')}</div>`;
            setPromptDisplayHtml(promptHTML);
            setGeneratedState(null);
            return;
        } else { // 'filtered' or 'assignment'
            const pool = getPromptPool(); if (pool.length === 0) { addToast('No prompts match your filter.', 'warning'); return; }
            state.prompt = pool[Math.floor(Math.random() * pool.length)];
            if(type === 'assignment') {
                const literaryFocusRequirements: Record<string, string> = { character: "Show personality through actions/dialogue.", setting: "Use sensory details for setting.", plot: "Ensure a clear beginning, middle, and end.", conflict: "Establish the main problem clearly.", characterArc: "Show how the main character changes." };
                if (literaryFocuses.length > 0) {
                     state.requirements = literaryFocuses.map(f => literaryFocusRequirements[f]).filter(Boolean);
                }
                if(state.requirements.length === 0) state.requirements.push("Develop a central message or idea.");
            }
        }
        await generateAndDisplayTeacherTools(state as AssignmentState);
    };
    
    const handleChoiceClick = (e: React.MouseEvent) => {
        const target = e.target as HTMLElement;
        const button = target.closest('.choice-btn');
        if (button && grade !== 'any') {
            const chosenPrompt = button.getAttribute('data-prompt');
            if (chosenPrompt) {
                generateAndDisplayTeacherTools({ grade, prompt: chosenPrompt, requirements: [], type: 'choice-selection' } as AssignmentState);
            }
        }
    };

    return (
        <>
            <header className="text-center">
                <h1 className="text-4xl md:text-5xl font-bold tracking-tight">The Spark File 🔥</h1>
                <p className="mt-3 text-lg">AI‑assisted prompts and teacher tools for creative writing</p>
            </header>

            <div className="space-y-6">
                <div className="p-4 border border-slate-200 rounded-lg bg-slate-50/50 space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        <div><label className="block text-sm font-medium text-slate-700 mb-1">Grade Band</label><select value={grade} onChange={e => setGrade(e.target.value as GradeBand | 'any')} className="w-full p-3 rounded-lg bg-slate-100 border-slate-200"><option value="any">Select Grade...</option>{Object.keys(promptsByGrade).filter(k => k !== 'all').map(g => <option key={g} value={g}>{capitalize(g)}</option>)}</select></div>
                        <div><label className="block text-sm font-medium text-slate-700 mb-1">Academic Topic</label><select value={academicTopic} onChange={e => setAcademicTopic(e.target.value)} disabled={grade === 'any'} className="w-full p-3 rounded-lg bg-slate-100 border-slate-200"><option value="any">Any Topic</option>{currentGradeData && Object.keys(currentGradeData.academic).map(t => <option key={t} value={t}>{capitalize(t)}</option>)}</select></div>
                        <div><label className="block text-sm font-medium text-slate-700 mb-1">Genre</label><select value={genre} onChange={e => setGenre(e.target.value)} disabled={grade === 'any'} className="w-full p-3 rounded-lg bg-slate-100 border-slate-200"><option value="any">Any Genre</option>{currentGradeData && Object.keys(currentGradeData.genre).map(g => <option key={g} value={g}>{capitalize(g)}</option>)}</select></div>
                        <LiteraryFocusMultiselect grade={grade} selected={literaryFocuses} onChange={setLiteraryFocuses} />
                        <div><label className="block text-sm font-medium text-slate-700 mb-1">Format</label><select value={formatType} onChange={e => setFormatType(e.target.value)} disabled={grade === 'any'} className="w-full p-3 rounded-lg bg-slate-100 border-slate-200"><option value="any">Any Format</option>{currentGradeData && Object.keys(currentGradeData.format).map(f => <option key={f} value={f}>{capitalize(f)}</option>)}</select></div>
                    </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                    <button onClick={() => handleGeneration('filtered')} disabled={isGenerating} className="action-btn bg-indigo-600 hover:bg-indigo-700">Prompt</button>
                    <button onClick={() => handleGeneration('choice')} disabled={isGenerating} className="action-btn bg-teal-600 hover:bg-teal-700">Choice Board</button>
                    <button onClick={() => handleGeneration('visual')} disabled={isGenerating} className="action-btn bg-sky-600 hover:bg-sky-700">Visual</button>
                    <button onClick={() => handleGeneration('starter')} disabled={isGenerating} className="action-btn bg-green-600 hover:bg-green-700">Starter</button>
                    <button onClick={() => handleGeneration('subverter')} disabled={isGenerating} className="action-btn bg-rose-600 hover:bg-rose-700">Subverter</button>
                    <button onClick={() => handleGeneration('assignment')} disabled={isGenerating} className="action-btn bg-purple-600 hover:bg-purple-700">Assignment</button>
                </div>
                <div className="space-y-6">
                    <div onClick={handleChoiceClick} className="min-h-[150px] p-6 rounded-xl flex flex-col items-center justify-center text-center relative bg-slate-50/50 border border-slate-200">
                        <AiGeneratedContent htmlContent={promptDisplayHtml} />
                    </div>
                    {generatedState && (
                        <>
                            <div className="w-full text-left space-y-6 p-6 border border-slate-200 rounded-lg bg-slate-50/50">
                                <h2>AI-Generated Teaching Tools</h2>
                                {generatedState.scaffolding && <div><h3>Scaffolding Questions</h3><AiGeneratedContent htmlContent={robustFormatAIResponse(generatedState.scaffolding)} /></div>}
                                {generatedState.miniLesson && <div><h3>Mini-Lesson</h3><AiGeneratedContent htmlContent={robustFormatAIResponse(generatedState.miniLesson)} /></div>}
                                {generatedState.rubric && <div><h3>Grading Rubric</h3><AiGeneratedContent htmlContent={robustFormatAIResponse(generatedState.rubric)} /></div>}
                            </div>
                            <div className="flex justify-center gap-4">
                                <button onClick={() => onOpenWorkspace(generatedState)} className="action-btn bg-indigo-600 hover:bg-indigo-700">🚀 Open Student Workspace</button>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </>
    );
};