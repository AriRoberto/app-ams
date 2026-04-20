import { importLogradourosFromFile, listLogradouros } from '../services/logradouroImportService.js';

export async function importLogradourosController(req, res, next) {
  try {
    const filePath = String(req.body?.filePath || 'Logradouros_Zonas Valendo.xls').trim();
    const dryRun = Boolean(req.body?.dryRun);
    const replaceExisting = Boolean(req.body?.replaceExisting);

    const report = await importLogradourosFromFile({ filePath, dryRun, replaceExisting });

    return res.status(201).json({
      success: true,
      message: dryRun ? 'Simulação de importação concluída.' : 'Importação de logradouros concluída.',
      data: report
    });
  } catch (error) {
    return next(error);
  }
}

export async function listLogradourosController(req, res, next) {
  try {
    const bairro = req.query?.bairro ? String(req.query.bairro).trim() : undefined;
    const data = await listLogradouros({ bairro });

    return res.json({ success: true, total: data.length, data });
  } catch (error) {
    return next(error);
  }
}
