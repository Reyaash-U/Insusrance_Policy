const INR = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", minimumFractionDigits: 2 });
const compact = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", notation: "compact", maximumFractionDigits: 1 });

export const formatCurrency        = (val) => (val == null ? "₹—" : INR.format(val));
export const formatCurrencyCompact = (val) => (val == null ? "₹—" : compact.format(val));
export const formatNumber          = (val) => (val == null ? "—"  : new Intl.NumberFormat("en-IN").format(val));
