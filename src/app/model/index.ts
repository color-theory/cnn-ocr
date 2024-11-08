export const predictCharacters = async (images: any[]) => {
    const response = await fetch('http://localhost:5000/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ images }),
    });

    const data = await response.json();
    return data.prediction;
};