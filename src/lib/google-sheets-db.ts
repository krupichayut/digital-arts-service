import { google, sheets_v4 } from "googleapis";

interface SheetRecord {
  id: string;
  [key: string]: string;
}

interface SheetConfig {
  sheetName: string;
  headers: string[];
}

const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;

export const isGoogleSheetsConfigured = () => {
  return Boolean(
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
      process.env.GOOGLE_PRIVATE_KEY &&
      spreadsheetId
  );
};

const getSheetsService = () => {
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!clientEmail || !privateKey || !spreadsheetId) {
    throw new Error("Google Sheets configuration is incomplete.");
  }

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey,
    },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });

  return google.sheets({ version: "v4", auth });
};

const columnName = (columnNumber: number) => {
  let name = "";
  let remaining = columnNumber;

  while (remaining > 0) {
    const modulo = (remaining - 1) % 26;
    name = String.fromCharCode(65 + modulo) + name;
    remaining = Math.floor((remaining - modulo) / 26);
  }

  return name;
};

const getSheetProperties = async (
  sheets: sheets_v4.Sheets,
  sheetName: string
) => {
  const spreadsheet = await sheets.spreadsheets.get({
    spreadsheetId,
    fields: "sheets(properties(sheetId,title))",
  });

  return spreadsheet.data.sheets?.find(
    (sheet) => sheet.properties?.title === sheetName
  )?.properties;
};

const ensureSheet = async (sheets: sheets_v4.Sheets, config: SheetConfig) => {
  let properties = await getSheetProperties(sheets, config.sheetName);

  if (!properties) {
    const response = await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: {
        requests: [
          {
            addSheet: {
              properties: {
                title: config.sheetName,
              },
            },
          },
        ],
      },
    });

    properties =
      response.data.replies?.[0]?.addSheet?.properties ||
      (await getSheetProperties(sheets, config.sheetName));
  }

  const lastColumn = columnName(config.headers.length);
  const headerRange = `${config.sheetName}!A1:${lastColumn}1`;
  const headerResponse = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: headerRange,
  });

  const currentHeaders = headerResponse.data.values?.[0] || [];
  const hasValidHeaders = config.headers.every(
    (header, index) => currentHeaders[index] === header
  );

  if (!hasValidHeaders) {
    await sheets.spreadsheets.values.update({
      spreadsheetId,
      range: headerRange,
      valueInputOption: "RAW",
      requestBody: {
        values: [config.headers],
      },
    });
  }

  return properties;
};

export const readSheetRecords = async (
  config: SheetConfig
): Promise<SheetRecord[]> => {
  const sheets = getSheetsService();
  await ensureSheet(sheets, config);

  const lastColumn = columnName(config.headers.length);
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range: `${config.sheetName}!A2:${lastColumn}`,
  });

  const rows = response.data.values || [];
  return rows
    .map((row) =>
      Object.fromEntries(
        config.headers.map((header, index) => [header, row[index] || ""])
      )
    )
    .filter((record): record is SheetRecord => Boolean(record.id));
};

export const appendSheetRecord = async (
  config: SheetConfig,
  record: SheetRecord
) => {
  const sheets = getSheetsService();
  await ensureSheet(sheets, config);

  const lastColumn = columnName(config.headers.length);
  const row = config.headers.map((header) => record[header] || "");

  await sheets.spreadsheets.values.append({
    spreadsheetId,
    range: `${config.sheetName}!A:${lastColumn}`,
    valueInputOption: "RAW",
    insertDataOption: "INSERT_ROWS",
    requestBody: {
      values: [row],
    },
  });
};

export const updateSheetRecord = async (
  config: SheetConfig,
  id: string,
  updatedRecord: SheetRecord
) => {
  const sheets = getSheetsService();
  await ensureSheet(sheets, config);

  const records = await readSheetRecords(config);
  const index = records.findIndex((record) => record.id === id);

  if (index === -1) {
    throw new Error("Record not found.");
  }

  const rowNumber = index + 2;
  const lastColumn = columnName(config.headers.length);
  const row = config.headers.map((header) => updatedRecord[header] || "");

  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range: `${config.sheetName}!A${rowNumber}:${lastColumn}${rowNumber}`,
    valueInputOption: "RAW",
    requestBody: {
      values: [row],
    },
  });
};

export const deleteSheetRecord = async (config: SheetConfig, id: string) => {
  const sheets = getSheetsService();
  const properties = await ensureSheet(sheets, config);

  const records = await readSheetRecords(config);
  const index = records.findIndex((record) => record.id === id);

  if (index === -1) {
    throw new Error("Record not found.");
  }

  if (properties?.sheetId === undefined || properties.sheetId === null) {
    throw new Error("Sheet ID not found.");
  }

  const rowIndex = index + 1;
  await sheets.spreadsheets.batchUpdate({
    spreadsheetId,
    requestBody: {
      requests: [
        {
          deleteDimension: {
            range: {
              sheetId: properties.sheetId,
              dimension: "ROWS",
              startIndex: rowIndex,
              endIndex: rowIndex + 1,
            },
          },
        },
      ],
    },
  });
};
