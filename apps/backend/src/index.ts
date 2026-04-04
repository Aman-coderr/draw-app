import dotenv from "dotenv";
dotenv.config();

import app from "../../http-backend/dist/index.js";
import { setupWebSocket } from "../../ws-backend/dist/index.js";

const PORT = process.env.PORT || 10000;

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

setupWebSocket(server);
