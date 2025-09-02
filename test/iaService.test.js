process.env.NODE_ENV = 'test';
process.env.GEMINI_API_KEY = 'MOCK_API_KEY';

jest.mock( 'fs/promises', () => ( {
    readFile: jest.fn()
} ) );

jest.mock( '@google/genai', () => {
    const mockGenerateContent = jest.fn();
    const mockGoogleGenAI = jest.fn( () => ( {
        models: {
            generateContent: mockGenerateContent,
        },
    } ) );
    
    return {
        GoogleGenAI: mockGoogleGenAI,
    };
} );

jest.mock( 'dotenv', () => ( {
    config: jest.fn()
} ) );

describe( 'iaService - Testes Unitários', () => {
    let generateMeetingSummary;
    let mockGenerateContent;
    let mockGoogleGenAI;
    let mockFs;

    beforeEach( () => {
        jest.clearAllMocks();
        
        process.env.GEMINI_API_KEY = 'MOCK_API_KEY';
        
        jest.resetModules();
        const iaService = require("../src/app/services/iaService");
        generateMeetingSummary = iaService.generateMeetingSummary;
        
        const { GoogleGenAI } = require('@google/genai');
        mockGoogleGenAI = GoogleGenAI;
        mockGenerateContent = GoogleGenAI().models.generateContent;
        
        mockFs = require('fs/promises');
    } );

    afterEach( () => {
        delete process.env.GEMINI_API_KEY;
    } );

    describe( 'Validação de Entrada', () => {
        test( 'should return null when transcriptFilePath is null', async () => {
            const consoleErrorSpy = jest.spyOn( console, 'error' ).mockImplementation( () => { } );

            const result = await generateMeetingSummary( null );

            expect( result ).toBeNull();
            expect( consoleErrorSpy ).toHaveBeenCalledWith( 'Erro: Caminho do arquivo de transcrição não fornecido.' );
            expect( mockFs.readFile ).not.toHaveBeenCalled();

            consoleErrorSpy.mockRestore();
        } );

        test( 'should return null when transcriptFilePath is undefined', async () => {
            const consoleErrorSpy = jest.spyOn( console, 'error' ).mockImplementation( () => { } );

            const result = await generateMeetingSummary( undefined );

            expect( result ).toBeNull();
            expect( consoleErrorSpy ).toHaveBeenCalledWith( 'Erro: Caminho do arquivo de transcrição não fornecido.' );
            expect( mockFs.readFile ).not.toHaveBeenCalled();

            consoleErrorSpy.mockRestore();
        } );

        test( 'should return null when transcriptFilePath is empty string', async () => {
            const consoleErrorSpy = jest.spyOn( console, 'error' ).mockImplementation( () => { } );

            const result = await generateMeetingSummary( '' );

            expect( result ).toBeNull();
            expect( consoleErrorSpy ).toHaveBeenCalledWith( 'Erro: Caminho do arquivo de transcrição não fornecido.' );
            expect( mockFs.readFile ).not.toHaveBeenCalled();

            consoleErrorSpy.mockRestore();
        } );
    } );

    describe( 'Validação de Configuração', () => {
        test( 'should return null when GEMINI_API_KEY is not set', async () => {
            const consoleErrorSpy = jest.spyOn( console, 'error' ).mockImplementation( () => { } );

            delete process.env.GEMINI_API_KEY;

            jest.resetModules();
            const iaService = require("../src/app/services/iaService");
            const generateMeetingSummaryWithoutKey = iaService.generateMeetingSummary;

            const result = await generateMeetingSummaryWithoutKey( 'test.txt' );

            expect( result ).toBeNull();
            expect( consoleErrorSpy ).toHaveBeenCalledWith( 'Erro: A variável de ambiente GEMINI_API_KEY não está configurada.' );

            consoleErrorSpy.mockRestore();
        } );

        test( 'should return null when GEMINI_API_KEY is empty', async () => {
            const consoleErrorSpy = jest.spyOn( console, 'error' ).mockImplementation( () => { } );

            process.env.GEMINI_API_KEY = '';
            
            jest.resetModules();
            const iaService = require("../src/app/services/iaService");
            const generateMeetingSummaryWithEmptyKey = iaService.generateMeetingSummary;

            const result = await generateMeetingSummaryWithEmptyKey( 'test.txt' );

            expect( result ).toBeNull();
            expect( consoleErrorSpy ).toHaveBeenCalledWith( 'Erro: A variável de ambiente GEMINI_API_KEY não está configurada.' );

            consoleErrorSpy.mockRestore();
        } );
    } );

    describe( 'Tratamento de Erros de Leitura de Arquivo', () => {
        test( 'should return null when file read fails with ENOENT error', async () => {
            const consoleErrorSpy = jest.spyOn( console, 'error' ).mockImplementation( () => { } );
            const fileError = new Error( 'ENOENT: no such file or directory' );
            fileError.code = 'ENOENT';
            mockFs.readFile.mockRejectedValue( fileError );

            const result = await generateMeetingSummary( 'nonexistent.txt' );

            expect( result ).toBeNull();
            expect( consoleErrorSpy ).toHaveBeenCalledWith(
                'Erro ao ler o arquivo de transcrição "nonexistent.txt":',
                fileError 
            );

            consoleErrorSpy.mockRestore();
        } );

        test( 'should return null when file read fails with permission error', async () => {
            const consoleErrorSpy = jest.spyOn( console, 'error' ).mockImplementation( () => { } );
            const fileError = new Error( 'EACCES: permission denied' );
            fileError.code = 'EACCES';
            mockFs.readFile.mockRejectedValue( fileError );

            const result = await generateMeetingSummary( 'protected.txt' );

            expect( result ).toBeNull();
            expect( consoleErrorSpy ).toHaveBeenCalledWith(
                'Erro ao ler o arquivo de transcrição "protected.txt":',
                fileError 
            );

            consoleErrorSpy.mockRestore();
        } );
    } );

    describe( 'Debug - Teste de Mock', () => {
        test( 'should debug mock structure', async () => {
            const mockTranscriptContent = 'João: Olá.';
            const mockGeneratedSummary = 'Resumo de teste.';
            
            mockFs.readFile.mockResolvedValue( mockTranscriptContent );
            
            mockGenerateContent.mockResolvedValue( { 
                text: mockGeneratedSummary 
            } );

            const mockResult = await mockGenerateContent();
            console.log('Mock result:', mockResult);
            console.log('Mock result.text:', mockResult.text);

            const result = await generateMeetingSummary( 'test.txt' );
            console.log('Actual result:', result);

            expect( result ).toBe( mockGeneratedSummary );
        } );
    } );

    describe( 'Fluxo de Sucesso', () => {
        test( 'should successfully generate summary with valid inputs', async () => {
            const mockTranscriptContent = 'João: Olá. Maria: Bom dia.';
            const mockGeneratedSummary = 'Resumo da reunião: Discussão sobre cumprimentos.';
            
            mockFs.readFile.mockResolvedValue( mockTranscriptContent );

            mockGenerateContent.mockResolvedValue({
                response: {
                    candidates: [{
                        content: {
                            parts: [{
                                text: mockGeneratedSummary
                            }]
                        }
                    }]
                }
            });

            const result = await generateMeetingSummary( 'transcript.txt' );

            expect( result ).toBe( mockGeneratedSummary );
            expect( mockFs.readFile ).toHaveBeenCalledWith( 'transcript.txt', { encoding: 'utf-8' } );
            expect( mockGoogleGenAI ).toHaveBeenCalledWith( {
                vertexai: false,
                apiKey: 'MOCK_API_KEY',
            } );
            expect( mockGenerateContent ).toHaveBeenCalledWith( {
                model: 'gemini-2.0-flash',
                contents: expect.any(String),
            });
        } );

        test( 'should handle empty transcript content', async () => {
            const mockTranscriptContent = '';
            const mockGeneratedSummary = 'Resumo: Reunião sem conteúdo.';
            
            mockFs.readFile.mockResolvedValue( mockTranscriptContent );

            mockGenerateContent.mockResolvedValue({
                response: {
                    candidates: [{
                        content: {
                            parts: [{
                                text: mockGeneratedSummary
                            }]
                        }
                    }]
                }
            });

            const result = await generateMeetingSummary( 'empty.txt' );

            expect( result ).toBe( mockGeneratedSummary );
            expect( mockFs.readFile ).toHaveBeenCalledWith( 'empty.txt', { encoding: 'utf-8' } );
            expect( mockGenerateContent ).toHaveBeenCalledWith( {
                model: 'gemini-2.0-flash',
                contents: expect.any(String),
            });
        } );
    } );

    describe( 'Tratamento de Erros da API', () => {
        test( 'should return null when API returns network error', async () => {
            const consoleErrorSpy = jest.spyOn( console, 'error' ).mockImplementation( () => { } );
            const mockTranscriptContent = 'João: Olá.';
            
            mockFs.readFile.mockResolvedValue( mockTranscriptContent );
            
            const networkError = new Error( 'Network Error' );
            mockGenerateContent.mockRejectedValue( networkError );

            const result = await generateMeetingSummary( 'transcript.txt' );

            expect( result ).toBeNull();
            expect( consoleErrorSpy ).toHaveBeenCalledWith( 'Erro ao chamar a API Gemini:', networkError );

            consoleErrorSpy.mockRestore();
        } );

        test( 'should return null when API returns rate limit error', async () => {
            const consoleErrorSpy = jest.spyOn( console, 'error' ).mockImplementation( () => { } );
            const mockTranscriptContent = 'João: Olá.';
            
            mockFs.readFile.mockResolvedValue( mockTranscriptContent );
            
            const rateLimitError = new Error( 'Rate limit exceeded' );
            rateLimitError.response = { data: { error: 'rate_limit_exceeded' } };
            mockGenerateContent.mockRejectedValue( rateLimitError );

            const result = await generateMeetingSummary( 'transcript.txt' );

            expect( result ).toBeNull();
            expect( consoleErrorSpy ).toHaveBeenCalledWith( 'Erro ao chamar a API Gemini:', rateLimitError );

            consoleErrorSpy.mockRestore();
        } );

        test( 'should return null when API returns invalid response structure', async () => {
            const consoleErrorSpy = jest.spyOn( console, 'error' ).mockImplementation( () => { } );
            const mockTranscriptContent = 'João: Olá.';
            
            mockFs.readFile.mockResolvedValue( mockTranscriptContent );
            
            mockGenerateContent.mockResolvedValue( {} );

            const result = await generateMeetingSummary( 'transcript.txt' );

            expect( result ).toBeNull();
            expect( consoleErrorSpy ).toHaveBeenCalledWith( 'Erro ao chamar a API Gemini:', expect.any(Error) );

            consoleErrorSpy.mockRestore();
        } );
    } );

    describe( 'Validação de Comportamento', () => {
        test( 'should not call API when file read fails', async () => {
            const consoleErrorSpy = jest.spyOn( console, 'error' ).mockImplementation( () => { } );
            const fileError = new Error( 'ENOENT: no such file or directory' );
            fileError.code = 'ENOENT';
            mockFs.readFile.mockRejectedValue( fileError );

            const result = await generateMeetingSummary( 'invalid.txt' );

            expect( result ).toBeNull();
            expect( mockGenerateContent ).not.toHaveBeenCalled();

            consoleErrorSpy.mockRestore();
        } );

        test( 'should not call file read when input is invalid', async () => {
            const consoleErrorSpy = jest.spyOn( console, 'error' ).mockImplementation( () => { } );

            const result = await generateMeetingSummary( null );

            expect( result ).toBeNull();
            expect( mockFs.readFile ).not.toHaveBeenCalled();

            consoleErrorSpy.mockRestore();
        } );
    } );
} );