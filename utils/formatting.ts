import type { ParsedRubric } from '../types';

export function robustFormatAIResponse(text: string): string {
    if (!text) return '<p>AI response is empty or invalid.</p>';
    let html = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>');

    const blocks = html.split(/\n{2,}/);
    return blocks.map(block => {
        block = block.trim();
        const lines = block.split('\n').map(l => l.trim());

        if (lines[0].startsWith('### ')) return `<h4>${lines[0].substring(4)}</h4><p>${lines.slice(1).join('<br>')}</p>`;
        if (lines[0].startsWith('## ')) return `<h3>${lines[0].substring(3)}</h3><p>${lines.slice(1).join('<br>')}</p>`;
        if (lines[0].startsWith('# ')) return `<h2>${lines[0].substring(2)}</h2><p>${lines.slice(1).join('<br>')}</p>`;
        
        if (lines.length > 1 && lines[0].includes('|') && lines[1].includes('-')) {
            let table = '<table>';
            const headers = lines[0].split('|').map(h => h.trim()).filter(Boolean);
            table += `<thead><tr>${headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>`;
            table += '<tbody>';
            for(let i = 2; i < lines.length; i++) {
                const cells = lines[i].split('|').map(c => c.trim()).filter(Boolean);
                if (cells.length === headers.length) {
                    table += `<tr>${cells.map(c => `<td>${c}</td>`).join('')}</tr>`;
                }
            }
            return table + '</tbody></table>';
        }

        if (lines.every(l => l.startsWith('* ') || l.startsWith('- '))) {
            return `<ul>${lines.map(l => `<li>${l.substring(2)}</li>`).join('')}</ul>`;
        }
        if (lines.every(l => /^\d+\.\s/.test(l))) {
            return `<ol>${lines.map(l => `<li>${l.replace(/^\d+\.\s/, '')}</li>`).join('')}</ol>`;
        }
        return `<p>${block.replace(/\n/g, '<br>')}</p>`;
    }).join('');
}


export function parseRubric(markdown: string): ParsedRubric | null {
    if (!markdown) return null;
    const lines = markdown.split('\n').filter(line => line.trim() && !line.includes('---'));
    if (lines.length < 2) return null;
    
    const headers = lines[0].split('|').map(h => h.trim()).filter(Boolean);
    const criteria = lines.slice(1).map(line => {
        const cells = line.split('|').map(c => c.trim()).filter(Boolean);
        if (cells.length === headers.length) {
            return { criterion: cells[0], levels: cells.slice(1) };
        }
        return null;
    }).filter(Boolean);

    if (!criteria.length) return null;

    return { headers: headers.slice(1), criteria: criteria as ParsedRubric['criteria'] };
}
