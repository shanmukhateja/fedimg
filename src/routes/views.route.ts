import { Router } from "express";

export const viewsRouter = Router();

viewsRouter.get('', (req, res) => {
    res.render('landing.njk');
})

viewsRouter.get('/login', (req, res) => {
    res.render('login.njk');
})

viewsRouter.get('/register', (req, res) => {
    res.render('register.njk');
})