import { useEffect, useRef, useState } from "react";
import "./App.css";

interface Line {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    color: string;
}

const App = () => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [lastPos, setLastPos] = useState<{ x: number; y: number } | null>(null);

    const ws = useRef<WebSocket | null>(null);

    useEffect(() => {
        ws.current = new WebSocket("ws://localhost:8000/canvas");


        ws.current.onmessage = (event) => {
            const data = JSON.parse(event.data);


            if (data.type === "DRAW_LINE") {
                drawLine(data.payload);
            }
        };

        ws.current.onclose = () => console.log("Disconnected from WebSocket server");

        return () => {
            if (ws.current) {
                ws.current.close();
                console.log("Connection closed");
            }
        }
    }, []);

    const drawLine = (line: Line) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.beginPath();
        ctx.strokeStyle = line.color;
        ctx.lineWidth = 3;
        ctx.moveTo(line.x1, line.y1);
        ctx.lineTo(line.x2, line.y2);
        ctx.stroke();
    };

    const MouseStop = (event: React.MouseEvent<HTMLCanvasElement>) => {
        setIsDrawing(true);
        setLastPos({ x: event.nativeEvent.offsetX, y: event.nativeEvent.offsetY });
    };

    const MouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing || !lastPos) return;

        const newLine = {
            x1: lastPos.x,
            y1: lastPos.y,
            x2: event.nativeEvent.offsetX,
            y2: event.nativeEvent.offsetY,
            color: "black",
        };

        drawLine(newLine);

        if (!ws.current) return;

        ws.current.send(JSON.stringify({ type: "DRAW_LINE", payload: newLine }));
        setLastPos({ x: newLine.x2, y: newLine.y2 });
    };

    const MouseUp = () => {
        setIsDrawing(false);
        setLastPos(null);
    };

    return (
        <div style={{ textAlign: "center", marginTop: "20px" }}>
            <canvas
                ref={canvasRef}
                id="canvas"
                width="550"
                height="550"
                style={{ border: "1px solid black", cursor: "crosshair" }}
                onMouseDown={MouseStop}
                onMouseMove={MouseMove}
                onMouseUp={MouseUp}
            />
        </div>
    );
};

export default App;
