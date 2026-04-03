import dotenv from "dotenv";
dotenv.config();

import app from "@http-backend";
import { setupWebSocket } from "@ws-backend";

const PORT = process.env.PORT || 10000;

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

setupWebSocket(server);
