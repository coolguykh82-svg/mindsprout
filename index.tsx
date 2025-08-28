/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { GoogleGenAI } from "@google/genai";

const App = () => {
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [imageBase64, setImageBase64] = useState('');
    const [imagePreview, setImagePreview] = useState('');
    const [childName, setChildName] = useState('');
    const [childAge, setChildAge] = useState('');
    const [childTraits, setChildTraits] = useState('');
    const [analysisResult, setAnalysisResult] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('AI가 사진을 자세히 살펴보고 있어요...');
    const [error, setError] = useState('');

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    // Loading messages rotation
    useEffect(() => {
        let interval: number | undefined;
        if (isLoading) {
            const messages = [
                "AI가 사진을 자세히 살펴보고 있어요...",
                "놀라운 장점들을 찾아내고 있어요...",
                "특별한 메시지를 만들고 있어요...",
                "밝은 미래를 그리고 있어요...",
            ];
            let index = 0;
            interval = window.setInterval(() => {
                index = (index + 1) % messages.length;
                setLoadingMessage(messages[index]);
            }, 2500);
        }
        return () => clearInterval(interval);
    }, [isLoading]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith('image/')) {
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                if (typeof reader.result === 'string') {
                    const base64String = reader.result.split(',')[1];
                    setImageBase64(base64String);
                    setImagePreview(URL.createObjectURL(file));
                    setError('');
                }
            };
            reader.readAsDataURL(file);
        } else {
            setError('올바른 이미지 파일을 업로드해주세요.');
            resetFile();
        }
    };

    const resetFile = () => {
        setImageFile(null);
        setImageBase64('');
        setImagePreview('');
    };

    const generateAnalysis = async () => {
        if (!imageFile) {
            setError('먼저 이미지를 업로드해주세요.');
            return;
        }
        setIsLoading(true);
        setError('');
        setAnalysisResult('');

        try {
            const systemInstruction = "당신은 'MINDSPROUT'입니다. 선생님과 부모님을 위한 친절하고 격려하는 AI 어시스턴트입니다. 당신의 목적은 아이의 사진과 제공된 이름, 나이, 특징을 분석하여 긍정적이고, 힘을 북돋아 주며, 동기를 부여하는 개인화된 분석을 생성하는 것입니다. 당신의 어조는 현명하고 친절한 이야기꾼처럼 부드럽고, 창의적이며, 영감을 주어야 합니다. 절대로 부정적이거나 비판으로 오해될 수 있는 말은 하지 마세요. 잠재력, 창의성, 그리고 독특한 강점에 초점을 맞추세요. 관찰한 내용을 재미있고 상상력이 풍부한 해석으로 표현하세요. 짧고 긍정적이며 한두 문단 길이로 유지하세요.";
            
            const prompt = `이 아이의 이름은 '${childName || '제공되지 않음'}'이고, 나이는 '${childAge || '제공되지 않음'}'입니다. 아이의 특징은 '${childTraits || '제공된 특징 없음'}' 입니다. 이 정보와 사진을 바탕으로, 이 아이의 멋진 잠재력에 대한 재미있고 긍정적인 분석을 작성해주세요. 예를 들어, 아이의 눈이 반짝인다면 호기심의 불꽃을 가지고 있다고 말할 수 있습니다. 만약 아이가 웃고 있다면, 다른 사람에게도 전염되는 즐거움을 가지고 있다고 언급할 수 있습니다. 이름, 나이, 특징을 분석에 자연스럽게 녹여주세요.`;

            const imagePart = {
                inlineData: {
                    mimeType: imageFile.type,
                    data: imageBase64,
                },
            };

            const textPart = {
                text: prompt,
            };

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: { parts: [imagePart, textPart] },
                config: {
                    systemInstruction: systemInstruction,
                }
            });
            
            setAnalysisResult(response.text);

        } catch (err) {
            console.error(err);
            setError('앗! AI가 잠시 휴식 중이에요. 잠시 후 다시 시도해주세요.');
        } finally {
            setIsLoading(false);
        }
    };
    
    const downloadResult = async (format: 'png' | 'pdf') => {
        const element = document.getElementById('downloadable-result') as HTMLElement;
        if (!element) return;
        
        // Temporarily adjust styles for better capture
        element.style.backgroundColor = '#FFFFFF';
        
        const canvas = await html2canvas(element, { scale: 2, useCORS: true });
        
        // Revert styles
        element.style.backgroundColor = '';

        if (format === 'png') {
            const dataUrl = canvas.toDataURL('image/png');
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = 'mindsprout-analysis.png';
            link.click();
        } else if (format === 'pdf') {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'px',
                format: [canvas.width, canvas.height]
            });
            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
            pdf.save('mindsprout-analysis.pdf');
        }
    };
    
    const resetApp = () => {
        resetFile();
        setChildName('');
        setChildAge('');
        setChildTraits('');
        setAnalysisResult('');
        setError('');
        setIsLoading(false);
    };

    const renderInitialState = () => (
        <>
            <div className="header">
                <h1>MINDSPROUT</h1>
                <p>사진 한 장으로, 아이에게 따뜻한 동기부여와 미소를 선물하세요.</p>
            </div>
            <div className="upload-section">
                 {!imagePreview && (
                    <label htmlFor="file-upload" className="file-input-wrapper">
                        <div className="file-drop-zone">
                            <div className="upload-icon">📷</div>
                            <p>{imageFile ? imageFile.name : '클릭하거나 사진을 이곳으로 드래그하세요'}</p>
                        </div>
                    </label>
                )}
                <input id="file-upload" type="file" accept="image/*" onChange={handleFileChange} aria-label="사진 업로드"/>
                {imagePreview && <img src={imagePreview} alt="Child preview" className="image-preview" />}
                {!imagePreview && (
                    <div className="upload-guidance">
                        <p>더욱 자세한 분석을 위해 아이의 얼굴이 잘 나온 단독 사진을 업로드해주세요.</p>
                        <p>업로드된 사진은 분석에만 사용되며, 분석 직후 즉시 삭제되니 안심하세요.</p>
                    </div>
                )}
            </div>
            <div className="additional-info">
                <input
                    type="text"
                    className="info-input"
                    placeholder="이름 또는 닉네임"
                    value={childName}
                    onChange={(e) => setChildName(e.target.value)}
                    aria-label="이름 또는 닉네임"
                />
                 <input
                    type="text"
                    className="info-input"
                    placeholder="학년 또는 나이"
                    value={childAge}
                    onChange={(e) => setChildAge(e.target.value)}
                    aria-label="학년 또는 나이"
                />
            </div>
            <textarea
                className="traits-input"
                placeholder="아이의 어떤 점이 특별한가요? (예: '그림 그리기를 좋아해요', '호기심이 많아요')"
                value={childTraits}
                onChange={(e) => setChildTraits(e.target.value)}
                aria-label="아이의 특별한 점"
            ></textarea>
            {error && <p className="error-message">{error}</p>}
            <button className="btn" onClick={generateAnalysis} disabled={!imageFile || isLoading}>
                새싹 분석
            </button>
        </>
    );

    const renderLoadingState = () => (
        <div className="loader-container">
            <div className="loader"></div>
            <p>{loadingMessage}</p>
        </div>
    );
    
    const renderResultState = () => (
        <div className="result-section">
            <div id="downloadable-result">
                <img src={imagePreview} alt="Child" className="result-image" />
                <div className="result-text">
                    <h2>{childName || '아이'}의 멋진 가능성의 발견!</h2>
                    <div className="result-text-content">
                        {analysisResult.split('. ').filter(sentence => sentence.trim() !== '').map((sentence, index, arr) => (
                            <p key={index}>
                                {sentence.trim()}
                                {index < arr.length - 1 ? '.' : ''}
                            </p>
                        ))}
                    </div>
                </div>
            </div>
            <div className="result-actions">
                <div className="action-item" onClick={() => downloadResult('png')} role="button" tabIndex={0} aria-label="이미지로 다운로드">
                    <div className="action-icon">🖼️</div>
                    <span>이미지 저장</span>
                </div>
                <div className="action-item" onClick={() => downloadResult('pdf')} role="button" tabIndex={0} aria-label="PDF로 다운로드">
                    <div className="action-icon">📄</div>
                    <span>PDF 저장</span>
                </div>
                <div className="action-item" onClick={resetApp} role="button" tabIndex={0} aria-label="다시 시작하기">
                    <div className="action-icon">🔄</div>
                    <span>다시 시작</span>
                </div>
            </div>
        </div>
    );

    return (
        <div className="container">
            {isLoading ? renderLoadingState() : (analysisResult ? renderResultState() : renderInitialState())}
        </div>
    );
};

const container = document.getElementById('root');
if (container) {
    const root = ReactDOM.createRoot(container);
    root.render(<App />);
}
