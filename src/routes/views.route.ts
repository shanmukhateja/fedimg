import { Router } from "express";

export const viewsRouter = Router();

viewsRouter.get('', (req, res) => {
    res.render('landing.njk', {
        isAuthenticated: req.isAuthenticated()
    });
})
