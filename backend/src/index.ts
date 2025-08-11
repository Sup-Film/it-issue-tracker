import express, { Request, Response } from "express";

const app = express();
const port = process.env.PORT || 8080;

app.get("/", (req: Request, res: Response) => {
  res.send("IT Issue Tracker Backend is running!");
});

app.listen(port, () => {
  console.log(`Backend server is listening on port ${port}`);
});

export default app;
