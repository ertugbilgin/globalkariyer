import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, ExternalHyperlink } from 'docx'
import { saveAs } from 'file-saver'
import { trackEvent, ANALYTICS_EVENTS } from './analytics';

export const generateWordDoc = (result) => {
    if (!result) return;
    trackEvent(ANALYTICS_EVENTS.DOWNLOAD_WORD);
    const lines = result.optimizedCv.split('\n');
    const docChildren = [];
    const fontName = "Arial"; // Word için en güvenli font

    docChildren.push(new Paragraph({ children: [new TextRun({ text: result.contactInfo?.name || "Name", bold: true, font: fontName, size: 32 })], alignment: AlignmentType.CENTER, spacing: { after: 100 } }));

    const contactParts = [];
    if (result.contactInfo?.location) contactParts.push(new TextRun({ text: `${result.contactInfo.location} | `, font: fontName, size: 20 }));
    if (result.contactInfo?.email) contactParts.push(new TextRun({ text: `${result.contactInfo.email} | `, font: fontName, size: 20 }));
    if (result.contactInfo?.phone) contactParts.push(new TextRun({ text: `${result.contactInfo.phone} | `, font: fontName, size: 20 }));
    if (result.contactInfo?.linkedin) {
        contactParts.push(new ExternalHyperlink({ children: [new TextRun({ text: "LinkedIn Profile", style: "Hyperlink", font: fontName, size: 20 })], link: result.contactInfo.linkedin }));
    }
    docChildren.push(new Paragraph({ children: contactParts, alignment: AlignmentType.CENTER, spacing: { after: 300 } }));

    lines.forEach(line => {
        const cleanLine = line.replace(/<[^>]*>/g, '').trim();
        if (!cleanLine) return;

        if (cleanLine.startsWith('## ')) {
            docChildren.push(new Paragraph({
                children: [new TextRun({ text: cleanLine.replace('## ', '').toUpperCase(), bold: true, font: fontName, size: 24 })],
                heading: HeadingLevel.HEADING_2,
                spacing: { before: 240, after: 120 },
                border: { bottom: { color: "000000", space: 1, value: "single", size: 6 } }
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
                    textRuns.push(new TextRun({ text: part.slice(2, -2), bold: true, font: fontName, size: 22 }));
                } else if (part) {
                    textRuns.push(new TextRun({ text: part, font: fontName, size: 22 }));
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
    Packer.toBlob(doc).then((blob) => saveAs(blob, `${result.contactInfo?.name?.replace(/\s+/g, '_')}_Optimized.docx`));
};
