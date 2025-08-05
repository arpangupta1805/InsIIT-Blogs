/**
 * Simple Markdown Parser for Blog Content
 */

class MarkdownParser {
    constructor() {
        this.rules = [
            // Headers (must come before other rules)
            { regex: /^### (.*$)/gim, replacement: '<h3>$1</h3>' },
            { regex: /^## (.*$)/gim, replacement: '<h2>$1</h2>' },
            { regex: /^# (.*$)/gim, replacement: '<h1>$1</h1>' },
            
            // Horizontal rule
            { regex: /^---$/gim, replacement: '<hr>' },
            
            // Bold
            { regex: /\*\*(.*?)\*\*/g, replacement: '<strong>$1</strong>' },
            
            // Italic
            { regex: /\*(.*?)\*/g, replacement: '<em>$1</em>' },
            
            // Strikethrough
            { regex: /~~(.*?)~~/g, replacement: '<del>$1</del>' },
            
            // Inline code
            { regex: /`([^`]+)`/g, replacement: '<code>$1</code>' },
            
            // Code blocks
            { regex: /```([\s\S]*?)```/g, replacement: '<pre><code>$1</code></pre>' },
            
            // Links
            { regex: /\[([^\]]+)\]\(([^)]+)\)/g, replacement: '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>' },
            

            // Blockquotes
            { regex: /^> (.*$)/gim, replacement: '<blockquote>$1</blockquote>' },
            
            // Unordered lists
            { regex: /^\- (.*$)/gim, replacement: '<li>$1</li>' },
            
            // Ordered lists
            { regex: /^\d+\. (.*$)/gim, replacement: '<li>$1</li>' },
        ];
    }

    parse(markdown) {
        if (!markdown) return '';
        
        let html = markdown;
        
        // Apply basic rules
        this.rules.forEach(rule => {
            html = html.replace(rule.regex, rule.replacement);
        });
        
        // Handle paragraphs (split by double newlines)
        html = this.processParagraphs(html);
        
        // Handle lists
        html = this.processLists(html);
        
        // Handle blockquotes
        html = this.processBlockquotes(html);
        
        // Handle tables
        html = this.processTables(html);
        

        return html.trim();
    }
    
    processParagraphs(html) {
        // Split by double newlines to create paragraphs
        const blocks = html.split(/\n\s*\n/);
        
        return blocks.map(block => {
            block = block.trim();
            if (!block) return '';
            
            // Don't wrap certain elements in paragraphs
            if (block.match(/^<(h[1-6]|hr|blockquote|ul|ol|table|pre|div)/)) {
                return block;
            }
            
            // Single line breaks become <br>
            block = block.replace(/\n/g, '<br>');
            
            return `<p>${block}</p>`;
        }).join('\n');
    }
    
    processLists(html) {
        // Wrap consecutive <li> elements in <ul> or <ol>
        html = html.replace(/(<li>.*<\/li>)/gs, (match) => {
            return `<ul>${match}</ul>`;
        });
        
        return html;
    }
    
    processBlockquotes(html) {
        // Merge consecutive blockquotes
        return html.replace(/(<blockquote>.*?<\/blockquote>)(\s*<blockquote>.*?<\/blockquote>)*/gs, 
            (match) => {
                const content = match.replace(/<\/?blockquote>/g, '');
                return `<blockquote>${content}</blockquote>`;
            }
        );
    }
    
    processTables(html) {
        // Simple table processing
        const tableRegex = /(\|.*\|[\r\n]+)+/g;
        
        return html.replace(tableRegex, (match) => {
            const rows = match.trim().split('\n');
            if (rows.length < 2) return match;
            
            let tableHtml = '<table class="blog-table">';
            
            rows.forEach((row, index) => {
                if (index === 1 && row.match(/^\|[\s\-\|]+\|$/)) {
                    // Skip separator row
                    return;
                }
                
                const cells = row.split('|').slice(1, -1); // Remove empty first/last elements
                const tag = index === 0 ? 'th' : 'td';
                
                tableHtml += '<tr>';
                cells.forEach(cell => {
                    tableHtml += `<${tag}>${cell.trim()}</${tag}>`;
                });
                tableHtml += '</tr>';
            });
            
            tableHtml += '</table>';
            return tableHtml;
        });
    }

}

// Export for use in other files
window.MarkdownParser = MarkdownParser;
