import * as tf from '@tensorflow/tfjs';
import * as path from 'path';

const labelMap = require(path.resolve(__dirname,'../../data/label_mapping.json'));

export const loadModel = async () => {
    try {
        const model = await tf.loadGraphModel('http://localhost:8000/model.json');
        console.log('Model loaded successfully');
        return model;
    } catch (error) {
        console.error(error);
        console.log('Error loading the model.');
    }
};

export const predictCharacter = async (model: any, image: any) => {
    const inputTensor = tf.tensor4d(image, [1, 50, 50, 1]);
    const prediction = model.predict(inputTensor);
    const predictionData = await prediction.array();
    const predictedIndex = predictionData[0].indexOf(Math.max(...predictionData[0]));
    return labelMap[predictedIndex];
}