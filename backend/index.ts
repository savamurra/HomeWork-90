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

interface CircleProps {
    x: number,
    y: number,
    radius: number,
    color: string,
}

const circles: CircleProps[] = [];

router.ws('/canvas', (ws, req) => {
    connectedClients.push(ws);
    console.log("Client connected. Client total -", connectedClients.length)

    ws.on("message", (message) => {
        try {
            const decodedMessage = JSON.parse(message.toString()) as Picture;

            if (decodedMessage.type === "DRAW_CIRCLE") {
                const circle = decodedMessage.payload as unknown as CircleProps;
                circles.push(circle);
                connectedClients.forEach(client => {
                    client.send(JSON.stringify({
                        type: "DRAW_CIRCLE",
                        payload: circle
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

