import expressWs from "express-ws";
import express from "express";
import cors from "cors";
import {WebSocket} from "ws";


const app = express();
expressWs(app);

const port = 8000;

app.use(cors());

const router = express.Router();

const connectedClients: WebSocket[] = [];

interface Picture {
    type: string;
    payload: string;
}

interface LinesProps {
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    color: string
}

const lines: LinesProps[] = [];

router.ws('/canvas', (ws, req) => {
    connectedClients.push(ws);
    console.log("Client connected. Client total -", connectedClients.length);
    ws.send(JSON.stringify({type: "PICTURE", payload: lines}));

    ws.on("message", (message) => {
        try {
            const decodedMessage = JSON.parse(message.toString()) as Picture;

            if (decodedMessage.type === "DRAW_LINE") {
                const line = decodedMessage.payload as unknown as LinesProps;
                lines.push(line);
                connectedClients.forEach(client => {
                    client.send(JSON.stringify({
                        type: "DRAW_LINE",
                        payload: line

                    }));
                })
            }
        } catch (error) {
            ws.send(JSON.stringify({error: "Invalid message format"}))
        }
    })

    ws.on("close", () => {
        console.log("Client disconnected");
        const index = connectedClients.indexOf(ws);
        connectedClients.splice(index, 1);
        console.log("Client total -", connectedClients.length);
    });
});

app.use(router);

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});

