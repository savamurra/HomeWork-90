import {useEffect, useRef, useState} from "react";
import "./App.css";
import * as React from "react";


interface Circle {
    x: number,
    y: number,
    radius: number,
    color: string,
}


const App = () => {
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [lastPos, setLastPos] = useState<{ x: number; y: number } | null>(null);
    const [color, setColor] = useState<{ [key: string]: string }>({});

    const ws = useRef<WebSocket | null>(null);

    useEffect(() => {
        ws.current = new WebSocket("ws://localhost:8000/canvas");


        ws.current.onmessage = (event) => {
            const data = JSON.parse(event.data);

            if (data.type === "DRAW_CIRCLE") {
                drawCircle(data.payload);
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

    const drawCircle = (circle: Circle) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.beginPath();
        ctx.arc(circle.x, circle.y, circle.radius, 0, 2 * Math.PI);
        ctx.fillStyle = circle.color;
        ctx.fill();
    };

    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const {name, value} = e.target;
        setColor((prevState) => ({...prevState, [name]: value}));
    }


    const MouseStop = (event: React.MouseEvent<HTMLCanvasElement>) => {
        const newCircle = {
            x: event.nativeEvent.offsetX,
            y: event.nativeEvent.offsetY,
            radius: 10,
            color: color.color,
        };

        drawCircle(newCircle);

        if (ws.current) {
            ws.current.send(JSON.stringify({type: "DRAW_CIRCLE", payload: newCircle}));
        }

        setIsDrawing(true);
        setLastPos({x: event.nativeEvent.offsetX, y: event.nativeEvent.offsetY});
    };


    const MouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDrawing || !lastPos) return;

        const newCircle = {
            x: event.nativeEvent.offsetX,
            y: event.nativeEvent.offsetY,
            radius: 10,
            color: color.color,
        };

        drawCircle(newCircle);

        if (!ws.current) return;

        ws.current.send(JSON.stringify({type: "DRAW_CIRCLE", payload: newCircle}));
        setLastPos({x: newCircle.x, y: newCircle.y});
    };

    const MouseUp = () => {
        setIsDrawing(false);
        setLastPos(null);
    };

    return (
        <div style={{textAlign: "center", marginTop: "20px"}}>
            <canvas
                ref={canvasRef}
                id="canvas"
                width="550"
                height="550"
                style={{border: "1px solid black", cursor: "crosshair"}}
                onMouseDown={MouseStop}
                onMouseMove={MouseMove}
                onMouseUp={MouseUp}
            />
            <form>
                <label>Выберите цвет заливки</label>
                <input name="color" type="color" onChange={onChange} />
            </form>
        </div>
    );
};

export default App;
