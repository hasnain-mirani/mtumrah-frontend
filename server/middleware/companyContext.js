// middleware/companyContext.js
export const extractCompanyId = (req) =>
  req.headers["x-company-id"] ||
  req.query.companyId ||
  req.user?.company?._id ||
  req.user?.company ||
  process.env.DEFAULT_COMPANY_ID || // optional fallback for single-tenant
  null;

// require=true => 400 if missing
export const ensureCompany = (require = true) => (req, res, next) => {
  const companyId = extractCompanyId(req);
  if (!companyId && require) {
    return res.status(400).json({
      message:
        "Company context missing. Send 'x-company-id' header or include companyId query, or attach company to the user.",
    });
  }
  req.companyId = companyId; // make it available to controllers
  next();
};
