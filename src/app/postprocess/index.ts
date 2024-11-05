export const quickFilter = (text: string): string => {
    text = text.replace(/(?<=\w)!/g, "t");
    text = text.replace(/(?<=\w)1/g, "t");
    text = text.replace(/(?<=\w)0/g, "o");
    text = text.replace(/(?<=\w)5/g, "s");
    text = text.replace(/(?<=\D)\$/g, "s");
    text = text.replace(/(?<=\w)4/g, "a");
    text = text.replace(/(?<=\w) m /g, " in ");
    text = text.replace(/(?<=\w) n /g, " in ");
    text = text.replace(/fh/g, "th");
    text = text.replace(/hls/g, "his");
    text = text.replace(/(?<=\w)qht/g, "ght");
    text = text.replace(/(?<=\w)TI(?=\w)/g, "Ti");
    text = text.replace(/(?<=\w)I(?=\w)/g, "l");
    text = text.replace(/(?<=\w)ln/g, "in");
    text = text.replace(/(?<=\w) ho /g, " no ");
    text = text.replace(/(?<=\s)!/g, "I");
    text = text.replace(/(?<=\w)Ih/g, "Th");
    text = text.replace(/(?<=\d)S/g, "5");
    text = text.replace(/ctas/g, "clas");
    text = text.replace(/Cta/g, "Cla");
    text = text.replace(/Cti/g, "Cli");
    text = text.replace(/(?<=\s)lt(?=\w)/g, "it");
    text = text.replace(/1h/g, "th");
    text = text.replace(/(?<=[a-z])[A-Z](?=\s)/g, (match) => match.toLowerCase());
    text = text.replace(/(?<=[a-z])[A-Z][A-Z]/g, (match) => match.toLowerCase());

    return text;
}

export const getCorrectedText = async (ocrText: string): Promise<string> => {

    const response = await fetch("http://localhost:8080/spellcheck", {
        method: "POST",
        headers: {
            "Content-Type": "text/plain"
        },
        body: ocrText
    });

    if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
    }

    return await response.text();
}