import { Router } from 'express';
import { getSaoVicenteGeoController } from '../controllers/geoController.js';

const router = Router();

router.get('/sao-vicente-de-minas', getSaoVicenteGeoController);

export default router;
