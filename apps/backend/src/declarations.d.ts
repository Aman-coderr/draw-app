declare module "../http-backend/dist/index.js" {
  import { Express } from "express";
  const app: Express;
  export default app;
}

declare module "../ws-backend/dist/index.js" {
  export function setupWebSocket(server: any): void;
}
