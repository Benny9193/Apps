import express, { type Request, type Response } from "express";

const app = express();
app.use(express.json());

app.get("/health", (_req: Request, res: Response) => {
  res.json({ ok: true });
});

app.get("/", (_req: Request, res: Response) => {
  res.json({ message: "node-api template" });
});

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => {
  console.log(`listening on http://localhost:${port}`);
});
