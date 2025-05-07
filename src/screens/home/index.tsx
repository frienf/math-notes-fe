import { ColorSwatch, Group } from '@mantine/core';
import { Button } from '@/components/ui/button';
import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import Draggable from 'react-draggable';
import { SWATCHES } from '@/constants';
import { Menu, X, RotateCcw, RotateCw, History, Play, Palette } from 'lucide-react';

interface GeneratedResult {
    expression: string;
    answer: string;
}

interface Response {
    expr: string;
    result: string;
    assign: boolean;
}

export default function Home() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [canvasPosition, setCanvasPosition] = useState({ x: 0, y: 0 });
    const [canvasSize, setCanvasSize] = useState({ width: window.innerWidth, height: window.innerHeight });
    const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
    const [color, setColor] = useState('rgb(255, 255, 255)');
    const [reset, setReset] = useState(false);
    const [dictOfVars, setDictOfVars] = useState<Record<string, string>>({});
    const [result, setResult] = useState<GeneratedResult>();
    const [latexPosition, setLatexPosition] = useState({ x: 10, y: 200 });
    const [latexExpression, setLatexExpression] = useState<Array<string>>([]);
    const [history, setHistory] = useState<ImageData[]>([]);
    const [historyIndex, setHistoryIndex] = useState(-1);
    const [calculationHistory, setCalculationHistory] = useState<GeneratedResult[]>([]);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);

    // Load calculation history from localStorage on mount
    useEffect(() => {
        try {
            const savedHistory = localStorage.getItem('calculationHistory');
            if (savedHistory) {
                setCalculationHistory(JSON.parse(savedHistory));
            }
        } catch (error) {
            console.error('Failed to load calculation history from localStorage:', error);
        }
    }, []);

    // Save calculation history to localStorage whenever it changes
    useEffect(() => {
        try {
            localStorage.setItem('calculationHistory', JSON.stringify(calculationHistory));
        } catch (error) {
            console.error('Failed to save calculation history to localStorage:', error);
        }
    }, [calculationHistory]);

    // Handle MathJax typesetting
    useEffect(() => {
        if (latexExpression.length > 0 && window.MathJax) {
            setTimeout(() => {
                window.MathJax.Hub.Queue(["Typeset", window.MathJax.Hub]);
            }, 0);
        }
    }, [latexExpression]);

    // Render LaTeX when result changes
    useEffect(() => {
        if (result) {
            renderLatexToCanvas(result.expression, result.answer);
        }
    }, [result]);

    // Handle reset
    useEffect(() => {
        if (reset) {
            resetCanvas();
            setLatexExpression([]);
            setResult(undefined);
            setDictOfVars({});
            setHistory([]);
            setHistoryIndex(-1);
            setIsHistoryOpen(false);
            setCanvasPosition({ x: 0, y: 0 });
            setCanvasSize({ width: window.innerWidth, height: window.innerHeight });
            setReset(false);
            // Note: calculationHistory is NOT reset to preserve history panel entries
        }
    }, [reset]);

    // Keyboard shortcut for toggling history panel (Ctrl+H)
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.ctrlKey && e.key === 'h') {
                e.preventDefault();
                setIsHistoryOpen((prev) => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Initialize canvas and MathJax
    useEffect(() => {
        const canvas = canvasRef.current;
    
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight - canvas.offsetTop;
                setCanvasSize({ width: canvas.width, height: canvas.height });
                ctx.lineCap = 'round';
                ctx.lineWidth = 3;
                const initialState = ctx.getImageData(0, 0, canvas.width, canvas.height);
                setHistory([initialState]);
                setHistoryIndex(0);
            }
        }
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.9/MathJax.js?config=TeX-MML-AM_CHTML';
        script.async = true;
        document.head.appendChild(script);

        script.onload = () => {
            window.MathJax.Hub.Config({
                tex2jax: { inlineMath: [['$', '$'], ['\\(', '\\)']] },
            });
        };

        return () => {
            document.head.removeChild(script);
        };
    }, []);

    const renderLatexToCanvas = (expression: string, answer: string) => {
        const latex = `\\(\\LARGE{${expression} = ${answer}}\\)`;
        setLatexExpression([...latexExpression, latex]);

        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                if (history[historyIndex]) {
                    ctx.putImageData(history[historyIndex], 0, 0);
                }
            }
        }
    };

    const resetCanvas = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                const initialState = ctx.getImageData(0, 0, canvas.width, canvas.height);
                setHistory([initialState]);
                setHistoryIndex(0);
            }
        }
    };

    const startDragging = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (e.shiftKey) {
            setIsDragging(true);
            setLastMousePos({ x: e.clientX, y: e.clientY });
            e.preventDefault();
        }
    };

    const dragCanvas = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (isDragging) {
            const canvas = canvasRef.current;
            if (!canvas) return;

            const deltaX = e.clientX - lastMousePos.x;
            const deltaY = e.clientY - lastMousePos.y;

            let newWidth = canvasSize.width;
            let newHeight = canvasSize.height;
            let newCanvasX = canvasPosition.x;
            let newCanvasY = canvasPosition.y;

            // Extend canvas at double the mouse movement
            if (deltaX < 0) {
                // Dragging left: extend left side by 2x the drag distance
                const extension = Math.abs(deltaX) * 2;
                newWidth += extension;
                newCanvasX += extension; // Shift content right to keep it in place
            } else if (canvasPosition.x + deltaX + canvasSize.width > canvasSize.width) {
                // Dragging right: extend right side by 2x the drag distance
                const extension = Math.max(0, (canvasPosition.x + deltaX + canvasSize.width - newWidth)) * 2;
                newWidth += extension;
            }

            if (deltaY < 0) {
                // Dragging up: extend top side by 2x the drag distance
                const extension = Math.abs(deltaY) * 2;
                newHeight += extension;
                newCanvasY += extension; // Shift content down to keep it in place
            } else if (canvasPosition.y + deltaY + canvasSize.height > canvasSize.height) {
                // Dragging down: extend bottom side by 2x the drag distance
                const extension = Math.max(0, (canvasPosition.y + deltaY + canvasSize.height - newHeight)) * 2;
                newHeight += extension;
            }

            // Update canvas size if needed
            if (newWidth !== canvasSize.width || newHeight !== canvasSize.height) {
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    // Save current content
                    const currentContent = ctx.getImageData(0, 0, canvasSize.width, canvasSize.height);
                    canvas.width = newWidth;
                    canvas.height = newHeight;
                    setCanvasSize({ width: newWidth, height: newHeight });

                    // Restore content, adjusting for new position
                    ctx.lineCap = 'round';
                    ctx.lineWidth = 3;
                    ctx.putImageData(currentContent, newCanvasX - canvasPosition.x, newCanvasY - canvasPosition.y);

                    // Update history with new size
                    const newHistory = history.slice(0, historyIndex + 1);
                    const newImageData = ctx.getImageData(0, 0, newWidth, newHeight);
                    setHistory([...newHistory, newImageData]);
                    setHistoryIndex(newHistory.length);
                }
            }

            // Update position
            setCanvasPosition({ x: newCanvasX + deltaX, y: newCanvasY + deltaY });
            setLastMousePos({ x: e.clientX, y: e.clientY });
        }
    };

    const stopDragging = () => {
        setIsDragging(false);
    };

    const saveCanvasState = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const newHistory = history.slice(0, historyIndex + 1);
                setHistory([...newHistory, imageData]);
                setHistoryIndex(newHistory.length);
            }
        }
    };

    const undo = () => {
        if (historyIndex > 0) {
            const canvas = canvasRef.current;
            if (canvas) {
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    setHistoryIndex(historyIndex - 1);
                    const prevState = history[historyIndex - 1];
                    canvas.width = prevState.width;
                    canvas.height = prevState.height;
                    setCanvasSize({ width: prevState.width, height: prevState.height });
                    ctx.putImageData(prevState, 0, 0);
                }
            }
        }
    };

    const redo = () => {
        if (historyIndex < history.length - 1) {
            const canvas = canvasRef.current;
            if (canvas) {
                const ctx = canvas.getContext('2d');
                if (ctx) {
                    setHistoryIndex(historyIndex + 1);
                    const nextState = history[historyIndex + 1];
                    canvas.width = nextState.width;
                    canvas.height = nextState.height;
                    setCanvasSize({ width: nextState.width, height: nextState.height });
                    ctx.putImageData(nextState, 0, 0);
                }
            }
        }
    };

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (e.shiftKey) return;
        const canvas = canvasRef.current;
        if (canvas) {
            canvas.style.background = 'black';
            const ctx = canvas.getContext('2d');
            if (ctx) {
                const rect = canvas.getBoundingClientRect();
                const adjustedX = e.clientX - rect.left - canvasPosition.x;
                const adjustedY = e.clientY - rect.top - canvasPosition.y;
                ctx.beginPath();
                ctx.moveTo(adjustedX, adjustedY);
                setIsDrawing(true);
            }
        }
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                const rect = canvas.getBoundingClientRect();
                const adjustedX = e.clientX - rect.left - canvasPosition.x;
                const adjustedY = e.clientY - rect.top - canvasPosition.y;
                ctx.strokeStyle = color;
                ctx.lineTo(adjustedX, adjustedY);
                ctx.stroke();
            }
        }
    };

    const stopDrawing = () => {
        if (isDrawing) {
            setIsDrawing(false);
            saveCanvasState();
        }
    };

    const runRoute = async () => {
        const canvas = canvasRef.current;
    
        if (canvas) {
            try {
                const response = await axios({
                    method: 'post',
                    url: `${import.meta.env.VITE_API_URL}/calculate`,
                    data: {
                        image: canvas.toDataURL('image/png'),
                        dict_of_vars: dictOfVars
                    }
                });

                const resp = await response.data;
                console.log('Response', resp);
                const newCalculations: GeneratedResult[] = [];
                resp.data.forEach((data: Response) => {
                    if (data.assign === true) {
                        setDictOfVars({
                            ...dictOfVars,
                            [data.expr]: data.result
                        });
                    }
                    newCalculations.push({
                        expression: data.expr,
                        answer: data.result
                    });
                });
                setCalculationHistory([...calculationHistory, ...newCalculations]);

                const ctx = canvas.getContext('2d');
                const imageData = ctx!.getImageData(0, 0, canvas.width, canvas.height);
                let minX = canvas.width, minY = canvas.height, maxX = 0, maxY = 0;
                let hasDrawnContent = false;

                for (let y = 0; y < canvas.height; y++) {
                    for (let x = 0; x < canvas.width; x++) {
                        const i = (y * canvas.width + x) * 4;
                        if (imageData.data[i + 3] > 0) {
                            minX = Math.min(minX, x);
                            minY = Math.min(minY, y);
                            maxX = Math.max(maxX, x);
                            maxY = Math.max(maxY, y);
                            hasDrawnContent = true;
                        }
                    }
                }

                const centerX = (hasDrawnContent ? (minX + maxX) / 2 : canvas.width / 2) + canvasPosition.x;
                const centerY = (hasDrawnContent ? (minY + maxY) / 2 : canvas.height / 2) + canvasPosition.y;

                setLatexPosition({ x: centerX, y: centerY });
                resp.data.forEach((data: Response) => {
                    setTimeout(() => {
                        setResult({
                            expression: data.expr,
                            answer: data.result
                        });
                    }, 1000);
                });
            } catch (error) {
                console.error('Failed to process calculation:', error);
            }
        }
    };

    const handleHistoryClick = (calc: GeneratedResult) => {
        setResult(calc);
    };

    const clearHistory = () => {
        setCalculationHistory([]);
        console.log('Calculation history cleared');
    };

    return (
        <>
            {/* Sidebar */}
            <div
                className={`fixed top-0 left-0 h-full bg-card text-card-foreground shadow-lg z-30 transition-opacity duration-300 ease-in-out ${
                    isSidebarOpen ? 'opacity-100 w-16' : 'opacity-0 w-0'
                }`}
            >
                <div className="flex flex-col items-center p-4 space-y-4">
                    <Button
                        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                        className="bg-blue-600 text-white hover:bg-blue-700 rounded-md border border-blue-700"
                        variant="default"
                        size="icon"
                        title="Toggle Sidebar"
                    >
                        {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
                    </Button>
                    <Button
                        onClick={() => setReset(true)}
                        className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md border border-primary/50"
                        variant="default"
                        size="icon"
                        title="Reset"
                    >
                        <RotateCcw size={20} />
                    </Button>
                    <Button
                        onClick={undo}
                        className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md border border-primary/50"
                        variant="default"
                        size="icon"
                        disabled={historyIndex <= 0}
                        title="Undo"
                    >
                        <RotateCw size={20} />
                    </Button>
                    <Button
                        onClick={redo}
                        className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md border border-primary/50"
                        variant="default"
                        size="icon"
                        disabled={historyIndex >= history.length - 1}
                        title="Redo"
                    >
                        <RotateCw size={20} />
                    </Button>
                    <Button
                        onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                        className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md border border-primary/50"
                        variant="default"
                        size="icon"
                        title={isHistoryOpen ? 'Hide History' : 'Show History'}
                    >
                        <History size={20} />
                    </Button>
                    <div className="flex flex-col items-center space-y-2">
                        <Button
                            className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md border border-primary/50"
                            variant="default"
                            size="icon"
                            title="Select Color"
                        >
                            <Palette size={20} />
                        </Button>
                        <Group className="flex flex-col space-y-2">
                            {SWATCHES.map((swatch) => (
                                <ColorSwatch
                                    key={swatch}
                                    color={swatch}
                                    onClick={() => setColor(swatch)}
                                    className="cursor-pointer"
                                />
                            ))}
                        </Group>
                    </div>
                    <Button
                        onClick={runRoute}
                        className="bg-green-600 text-white hover:bg-green-700 rounded-md border border-green-700"
                        variant="default"
                        size="lg"
                        title="Run"
                    >
                        <Play size={24} />
                    </Button>
                </div>
            </div>

            {/* Floating Run Button (when sidebar is collapsed) */}
            {!isSidebarOpen && (
                <Button
                    onClick={runRoute}
                    className="fixed bottom-4 right-4 bg-green-600 text-white hover:bg-green-700 rounded-full border border-green-700 z-30"
                    variant="default"
                    size="lg"
                    title="Run"
                >
                    <Play size={24} />
                </Button>
            )}

            {/* Canvas */}
            <canvas
                ref={canvasRef}
                id="canvas"
                className={`absolute top-0 left-0 z-10 ${isSidebarOpen ? 'pl-16' : ''}`}
                style={{ transform: `translate(${canvasPosition.x}px, ${canvasPosition.y}px)` }}
                onMouseDown={(e) => {
                    startDragging(e);
                    startDrawing(e);
                }}
                onMouseMove={(e) => {
                    dragCanvas(e);
                    draw(e);
                }}
                onMouseUp={() => {
                    stopDragging();
                    stopDrawing();
                }}
                onMouseOut={() => {
                    stopDragging();
                    stopDrawing();
                }}
            />

            {/* History Panel */}
            {isHistoryOpen && (
                <div
                    className="fixed top-0 right-0 w-80 h-full bg-card text-card-foreground p-4 shadow-lg z-30 overflow-y-auto transition-transform duration-300 ease-in-out"
                    style={{ transform: isHistoryOpen ? 'translateX(0)' : 'translateX(100%)' }}
                >
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-semibold">Calculation History</h2>
                        <Button
                            onClick={clearHistory}
                            className="bg-destructive text-destructive-foreground rounded-md"
                            variant="default"
                            size="sm"
                            disabled={calculationHistory.length === 0}
                        >
                            Clear History
                        </Button>
                    </div>
                    {calculationHistory.length === 0 ? (
                        <p className="text-muted-foreground">No calculations yet.</p>
                    ) : (
                        <ul className="space-y-2">
                            {calculationHistory.map((calc, index) => (
                                <li
                                    key={index}
                                    className="p-3 bg-muted rounded-md border border-border shadow-sm cursor-pointer hover:bg-accent transition-colors"
                                    onClick={() => handleHistoryClick(calc)}
                                >
                                    <div className="font-medium">{calc.expression}</div>
                                    <div className="text-sm text-muted-foreground">= {calc.answer}</div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}

            {/* LaTeX Output */}
            {latexExpression &&
                latexExpression.map((latex, index) => (
                    <Draggable
                        key={index}
                        defaultPosition={latexPosition}
                        onStop={(e, data) => setLatexPosition({ x: data.x, y: data.y })}
                    >
                        <div className="absolute p-2 bg-card text-card-foreground rounded-md shadow-md z-20">
                            <div className="latex-content">{latex}</div>
                        </div>
                    </Draggable>
                ))}
        </>
    );
}