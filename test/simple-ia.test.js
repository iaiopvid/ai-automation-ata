process.env.NODE_ENV = 'test';
process.env.GEMINI_API_KEY = 'MOCK_API_KEY';

jest.mock('fs/promises', () => ({
    readFile: jest.fn()
}));

jest.mock('@google/genai', () => {
    const mockGenerateContent = jest.fn();
    const mockGoogleGenAI = jest.fn(() => ({
        models: {
            generateContent: mockGenerateContent,
        },
    }));
    
    return {
        GoogleGenAI: mockGoogleGenAI,
    };
});

describe('Teste Simples do iaService', () => {
    let generateMeetingSummary;

    beforeEach(() => {
        jest.clearAllMocks();
        process.env.GEMINI_API_KEY = 'MOCK_API_KEY';
        
        jest.resetModules();
        const iaService = require('../src/app/services/iaService.js');
        generateMeetingSummary = iaService.generateMeetingSummary;
    });

    test('should generate summary successfully', async () => {
        const fs = require('fs/promises');
        const { GoogleGenAI } = require('@google/genai');

        fs.readFile.mockResolvedValue('João: Olá. Maria: Bom dia.');
        GoogleGenAI().models.generateContent.mockResolvedValue({
            text: 'Resumo da reunião'
        });

        const result = await generateMeetingSummary('test.txt');

        expect(result).toBe('Resumo da reunião');
        expect(fs.readFile).toHaveBeenCalledWith('test.txt', { encoding: 'utf-8' });
    });
}); 