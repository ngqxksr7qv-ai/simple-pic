export interface CSVData {
    headers: string[];
    rows: string[][];
}

export const parseCSV = (content: string): CSVData => {
    const lines = content.split('\n').filter(line => line.trim());

    if (lines.length === 0) {
        return { headers: [], rows: [] };
    }

    // Parse CSV handling quoted fields
    const parseLine = (line: string): string[] => {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            const nextChar = line[i + 1];

            if (char === '"') {
                if (inQuotes && nextChar === '"') {
                    current += '"';
                    i++; // Skip next quote
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current.trim());

        return result;
    };

    const headers = parseLine(lines[0]);
    const rows = lines.slice(1).map(line => parseLine(line));

    return { headers, rows };
};

export const readCSVFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target?.result as string;
            resolve(content);
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsText(file);
    });
};
