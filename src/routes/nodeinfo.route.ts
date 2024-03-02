import { Router } from "express";
import { NodeInfoService } from "../services/node-info.service";

export const nodeInfoRouter = Router();

nodeInfoRouter.get('/2.0', async (req, res) => {
    
    const usage = await NodeInfoService.getStatistics();

    res.json({
      version: "2.0",
      software: {
        name: "fedIMG",
        version: "0.0.1",
      },
      protocols: ["activitypub"],
      services: { outbound: [], inbound: [] },
      usage,
      openRegistrations: true,
      metadata: {},
    });
})