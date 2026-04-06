import { getSaoVicenteGeo } from '../services/geoService.js';

export async function getSaoVicenteGeoController(_req, res, next) {
  try {
    const data = await getSaoVicenteGeo();
    res.json(data);
  } catch (error) {
    next(error);
  }
}
