
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Theme } from '../themes';

interface ProfileReportData {
    name: string;
    totalBeads: number;
    totalRounds: number;
    streak: number;
    history: { date: string; rounds: number; beads: number }[];
    settings: { beadsPerRound: number; dailyGoal: string };
}

export const generateMalaReport = (data: ProfileReportData[], themeColors: Theme['colors']) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    
    // Helper for centering text
    const centerText = (text: string, y: number) => {
        const textWidth = doc.getTextWidth(text);
        doc.text(text, (pageWidth - textWidth) / 2, y);
    };

    // Header Background
    doc.setFillColor(255, 251, 235); // Light amber background for header
    doc.rect(0, 0, pageWidth, 40, 'F');

    // Title
    doc.setFontSize(24);
    doc.setTextColor(180, 83, 9); // Amber-700
    doc.setFont("helvetica", "bold");
    centerText("Jaap Progress Report", 20);

    // Subtitle/Date
    doc.setFontSize(10);
    doc.setTextColor(120, 113, 108);
    doc.setFont("helvetica", "normal");
    centerText(`Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}`, 28);

    let yPos = 50;

    data.forEach((profile, index) => {
        // Add page if needed
        if (yPos > 250) {
            doc.addPage();
            yPos = 20;
        }

        // Profile Section Header
        doc.setFontSize(18);
        doc.setTextColor(180, 83, 9); // Amber-700
        doc.setFont("helvetica", "bold");
        doc.text(profile.name, 14, yPos);
        
        // Separator line
        doc.setDrawColor(251, 191, 36); // Amber-400
        doc.setLineWidth(0.5);
        doc.line(14, yPos + 2, pageWidth - 14, yPos + 2);
        
        yPos += 12;

        // Summary Box
        doc.setFillColor(254, 252, 232); // Yellow-50
        doc.setDrawColor(253, 230, 138); // Yellow-200
        doc.roundedRect(14, yPos, pageWidth - 28, 25, 3, 3, 'FD');

        doc.setFontSize(11);
        doc.setTextColor(60);
        doc.setFont("helvetica", "normal");

        // Stats in Summary Box
        doc.text(`Total Lifetime Beads:`, 20, yPos + 8);
        doc.setFont("helvetica", "bold");
        doc.text(`${profile.totalBeads}`, 60, yPos + 8);
        
        doc.setFont("helvetica", "normal");
        doc.text(`Total Rounds:`, 20, yPos + 16);
        doc.setFont("helvetica", "bold");
        doc.text(`${profile.totalRounds}`, 60, yPos + 16);

        doc.setFont("helvetica", "normal");
        doc.text(`Current Streak:`, 100, yPos + 8);
        doc.setFont("helvetica", "bold");
        doc.text(`${profile.streak} Days`, 135, yPos + 8);

        doc.setFont("helvetica", "normal");
        doc.text(`Configuration:`, 100, yPos + 16);
        doc.setFont("helvetica", "bold");
        doc.text(`${profile.settings.beadsPerRound} beads/round`, 135, yPos + 16);

        yPos += 35;

        // History Table
        if (profile.history.length > 0) {
            doc.setFontSize(12);
            doc.setTextColor(0);
            doc.text("History Log", 14, yPos - 3);

            autoTable(doc, {
                startY: yPos,
                head: [['Date', 'Rounds Completed', 'Total Beads']],
                body: profile.history.map(h => [
                    h.date, 
                    h.rounds, 
                    h.beads
                ]),
                theme: 'grid',
                headStyles: { 
                    fillColor: [245, 158, 11], // Amber-500
                    textColor: 255,
                    fontStyle: 'bold'
                },
                alternateRowStyles: {
                    fillColor: [255, 251, 235] // Amber-50
                },
                styles: {
                    font: 'helvetica',
                    fontSize: 10
                },
                margin: { left: 14, right: 14 }
            });

            yPos = (doc as any).lastAutoTable.finalY + 20;
        } else {
            doc.setFontSize(10);
            doc.setTextColor(150);
            doc.text("No history recorded for this profile yet.", 14, yPos);
            yPos += 20;
        }
    });

    // Footer quote on every page
    const pageCount = (doc as any).internal.getNumberOfPages();
    for(let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        centerText("Sat Sahib - Bandi Chhod Satguru Rampal Ji Maharaj Ki Jai", pageHeight - 10);
    }

    doc.save(`Jaap_Report_${new Date().toISOString().slice(0,10)}.pdf`);
};
