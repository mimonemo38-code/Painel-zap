import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import whatsappRouter from "./whatsapp.js";
import whitelistRouter from "./whitelist.js";
import historyRouter from "./history.js";
import configRouter from "./config.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(whatsappRouter);
router.use(whitelistRouter);
router.use(historyRouter);
router.use(configRouter);

export default router;
