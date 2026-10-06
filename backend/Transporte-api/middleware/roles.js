export const requireNivel = (nivelMinimo) => (req, res, next) => {
  const nivel = req.user?.nivel_permiso ?? 0;
  if (nivel < nivelMinimo) {
    return res.status(403).json({ error: 'No tienes permiso suficiente para esta acción' });
  }
  next();
};


export const requireRol = (...rolesPermitidos) => (req, res, next) => {
  if (!req.user || !rolesPermitidos.includes(req.user.id_rol)) {
    return res.status(403).json({ error: 'No tienes permiso para esta acción' });
  }
  next();
};