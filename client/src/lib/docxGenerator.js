import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, ExternalHyperlink } from 'docx'
import { trackEvent, ANALYTICS_EVENTS } from './analytics';

import { saveAs } from 'file-saver';

export const generateDocxBlob = async (result) => {
    if (!result) return null;
    const lines = result.optimizedCv.split('\n');
    const docChildren = [];
    const fontName = result.uiSuggestions?.selectedFont || "Arial";
    const themeColor = "2E74B5"; // Word Blue

    docChildren.push(new Paragraph({ children: [new TextRun({ text: result.contactInfo?.name || "Name", bold: true, font: fontName, size: 32, color: "000000" })], alignment: AlignmentType.CENTER, spacing: { after: 100 } }));

    const contactParts = [];
    if (result.contactInfo?.location) contactParts.push(new TextRun({ text: `${result.contactInfo.location} | `, font: fontName, size: 20, color: "666666" }));
    if (result.contactInfo?.email) contactParts.push(new TextRun({ text: `${result.contactInfo.email} | `, font: fontName, size: 20, color: "666666" }));
    if (result.contactInfo?.phone) contactParts.push(new TextRun({ text: `${result.contactInfo.phone} | `, font: fontName, size: 20, color: "666666" }));
    if (result.contactInfo?.linkedin) {
        contactParts.push(new ExternalHyperlink({ children: [new TextRun({ text: "LinkedIn", style: "Hyperlink", font: fontName, size: 20, color: themeColor })], link: result.contactInfo.linkedin }));
    }
    docChildren.push(new Paragraph({ children: contactParts, alignment: AlignmentType.CENTER, spacing: { after: 300 } }));

    lines.forEach(line => {
        const cleanLine = line.replace(/<[^>]*>/g, '').trim();
        if (!cleanLine) return;

        if (cleanLine.startsWith('## ')) {
            docChildren.push(new Paragraph({
                children: [new TextRun({ text: cleanLine.replace('## ', '').toUpperCase(), bold: true, font: fontName, size: 24, color: themeColor })],
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 240, after: 120 },
                border: { bottom: { color: themeColor, space: 1, value: "single", size: 6 } }
            }));
        } else if (cleanLine.startsWith('### ')) {
            docChildren.push(new Paragraph({
                children: [new TextRun({ text: cleanLine.replace('### ', ''), bold: true, font: fontName, size: 22 })],
                heading: HeadingLevel.HEADING_3,
                spacing: { before: 200, after: 100 }
            }));
        } else if (cleanLine.startsWith('#### ')) {
            docChildren.push(new Paragraph({
                children: [new TextRun({ text: cleanLine.replace('#### ', ''), bold: true, font: fontName, size: 20, italics: true })],
                heading: HeadingLevel.HEADING_4,
                spacing: { before: 160, after: 80 }
            }));
        } else {
            // Bullet point kontrolü: Hem '* ' hem de '- ' ile başlayanları yakala
            const isBullet = cleanLine.startsWith('* ') || cleanLine.startsWith('- ') || cleanLine.startsWith('• ');

            // Bullet işaretini metinden temizle
            let content = cleanLine;
            if (isBullet) {
                content = cleanLine.replace(/^[\*\-\•]\s+/, '');
            }

            const textRuns = [];
            const parts = content.split(/(\*\*.*?\*\*)/g);

            parts.forEach(part => {
                if (part.startsWith('**') && part.endsWith('**')) {
                    // Bold parts remain bold
                    textRuns.push(new TextRun({ text: part.slice(2, -2), bold: true, font: fontName, size: 22 }));
                } else if (part) {
                    // Regular text, ensure no bold
                    textRuns.push(new TextRun({ text: part, font: fontName, size: 22, bold: false }));
                }
            });

            docChildren.push(new Paragraph({
                children: textRuns,
                bullet: isBullet ? { level: 0 } : undefined,
                spacing: { after: 100 }
            }));
        }
    });

    const doc = new Document({ sections: [{ children: docChildren }], styles: { default: { document: { run: { font: fontName } } } } });

    const blob = await Packer.toBlob(doc);
    const mimeType = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    return new Blob([blob], { type: mimeType });
};

export const generateWordDoc = async (result) => {
    if (!result) return;
    trackEvent(ANALYTICS_EVENTS.DOWNLOAD_WORD);

    const newBlob = await generateDocxBlob(result);
    if (!newBlob) return;

    // Sanitize filename
    const safeName = (result.contactInfo?.name || "CV").replace(/[^a-zA-Z0-9-_]/g, '_');
    const fileName = `${safeName}_Optimized.docx`;

    saveAs(newBlob, fileName);
};

export const generateCoverLetterDoc = async (coverLetterText) => {
    if (!coverLetterText) return;

    const lines = coverLetterText.split('\n');
    const docChildren = [];
    const fontName = "Arial"; // Default font

    lines.forEach(line => {
        const cleanLine = line.trim();
        if (!cleanLine) {
            docChildren.push(new Paragraph({ text: "", spacing: { after: 200 } })); // Empty line
            return;
        }

        docChildren.push(new Paragraph({
            children: [new TextRun({ text: cleanLine, font: fontName, size: 24 })], // 12pt font
            spacing: { after: 120 }
        }));
    });

    const doc = new Document({
        sections: [{
            children: docChildren
        }],
        styles: {
            default: {
                document: {
                    run: {
                        font: fontName,
                    }
                }
            }
        }
    });

    const blob = await Packer.toBlob(doc);
    const fileName = `Cover_Letter.docx`;
    saveAs(blob, fileName);
};

export const generateInterviewPrepDoc = async (prepData) => {
    if (!prepData || !prepData.categories) return;

    const docChildren = [];
    const fontName = "Arial";

    // Title
    docChildren.push(new Paragraph({
        children: [new TextRun({ text: "Interview Preparation Kit", font: fontName, size: 32, bold: true })],
        spacing: { after: 400 }
    }));

    prepData.categories.forEach(cat => {
        // Category Title
        docChildren.push(new Paragraph({
            children: [new TextRun({ text: cat.title, font: fontName, size: 28, bold: true, color: "2E75B6" })],
            spacing: { before: 400, after: 100 }
        }));

        // Category Description
        docChildren.push(new Paragraph({
            children: [new TextRun({ text: cat.description, font: fontName, size: 20, italics: true })],
            spacing: { after: 300 }
        }));

        cat.questions.forEach((q, i) => {
            // Question
            docChildren.push(new Paragraph({
                children: [new TextRun({ text: `Q${i + 1}: ${q.question}`, font: fontName, size: 24, bold: true })],
                spacing: { after: 120 }
            }));

            // Answer Outline - handle both string and array types
            const answerText = typeof q.answerOutline === 'string'
                ? q.answerOutline
                : Array.isArray(q.answerOutline)
                    ? q.answerOutline.join('\n')
                    : JSON.stringify(q.answerOutline);

            const outlineLines = answerText.split('\n');
            outlineLines.forEach(line => {
                if (!line.trim()) return; // Skip empty lines
                docChildren.push(new Paragraph({
                    children: [new TextRun({ text: line.trim(), font: fontName, size: 22 })],
                    bullet: { level: 0 }
                }));
            });

            // Tips
            if (q.tips) {
                docChildren.push(new Paragraph({
                    children: [new TextRun({ text: `💡 Tip: ${q.tips}`, font: fontName, size: 20, color: "D97706", italics: true })],
                    spacing: { before: 100, after: 300 }
                }));
            } else {
                docChildren.push(new Paragraph({ text: "", spacing: { after: 300 } }));
            }
        });
    });

    const doc = new Document({
        sections: [{
            children: docChildren
        }],
        styles: {
            default: {
                document: {
                    run: {
                        font: fontName,
                    }
                }
            }
        }
    });

    const blob = await Packer.toBlob(doc);
    const fileName = `Interview_Prep_Kit.docx`;
    saveAs(blob, fileName);
};
