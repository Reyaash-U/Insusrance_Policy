import { format, formatDistanceToNow, isValid, parseISO } from "date-fns";

const toDate = (val) => {
  if (!val) return null;
  const d = val instanceof Date ? val : parseISO(val);
  return isValid(d) ? d : null;
};

export const formatDate      = (val, fmt = "MMM d, yyyy")       => { const d = toDate(val); return d ? format(d, fmt) : "—"; };
export const formatDateTime  = (val, fmt = "MMM d, yyyy HH:mm") => { const d = toDate(val); return d ? format(d, fmt) : "—"; };
export const fromNow         = (val)                             => { const d = toDate(val); return d ? formatDistanceToNow(d, { addSuffix: true }) : "—"; };
export const formatShort     = (val)                             => formatDate(val, "dd MMM yy");
