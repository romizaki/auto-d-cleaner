import { CSVRow, AuditEntry, ColumnSchema } from "@/types";
import { removeDuplicates } from "./duplicates";
import { standardizePhones } from "./phones";
import { standardizeDates } from "./dates";
import { fixCapitalization } from "./capitalization";
import { removeEmptyRows } from "./emptyRows";
import { validateEmails } from "./emails";
import { trimWhitespace } from "./whitespace";
import { standardizeAddresses } from "./addresses";
import { cleanWithAI } from "../ai";

export interface EngineResult {
  cleanedData: CSVRow[];
  auditLog: AuditEntry[];
  aiUsed: boolean;
}

export async function runCleaningPipeline(
  data: CSVRow[],
  columns: ColumnSchema[]
): Promise<EngineResult> {
  const auditLog: AuditEntry[] = [];
  let current = [...data];

  const trimResult = trimWhitespace(current);
  current = trimResult.cleaned;
  auditLog.push(trimResult.audit);

  const emptyResult = removeEmptyRows(current);
  current = emptyResult.cleaned;
  auditLog.push(emptyResult.audit);

  const dupResult = removeDuplicates(current);
  current = dupResult.cleaned;
  auditLog.push(dupResult.audit);

  const phoneResult = standardizePhones(current, columns);
  current = phoneResult.cleaned;
  auditLog.push(phoneResult.audit);

  const dateResult = standardizeDates(current, columns);
  current = dateResult.cleaned;
  auditLog.push(dateResult.audit);

  const capResult = fixCapitalization(current, columns);
  current = capResult.cleaned;
  auditLog.push(capResult.audit);

  const addrResult = standardizeAddresses(current, columns);
  current = addrResult.cleaned;
  auditLog.push(addrResult.audit);

  let aiUsed = false;
  try {
    const aiResult = await cleanWithAI(current, columns);
    if (aiResult.cleanedRows.length > 0) {
      current = aiResult.cleanedRows;
      auditLog.push(...aiResult.auditEntries);
      aiUsed = true;
    }
  } catch {
    const emailResult = validateEmails(current, columns);
    current = emailResult.cleaned;
    auditLog.push(emailResult.audit);
  }

  if (!aiUsed) {
    const emailResult = validateEmails(current, columns);
    current = emailResult.cleaned;
    auditLog.push(emailResult.audit);
  }

  return { cleanedData: current, auditLog, aiUsed };
}
