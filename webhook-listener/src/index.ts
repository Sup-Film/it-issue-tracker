import express, { Request, Response } from 'express';

const app = express();
const port = process.env.PORT || 4000;

app.get('/', (req: Request, res: Response) => {
  res.send('Webhook Listener is running!');
});

app.post('/webhook', (req: Request, res: Response) => {
    console.log("Webhook received!");
    res.status(200).send("OK");
});


app.listen(port, () => {
  console.log(`Webhook listener is listening on port ${port}`);
});