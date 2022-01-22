const excel = require("exceljs");

exports.data_to_workbook = (sheetname, datalist) => {
  const workbook = new excel.Workbook();
  const worksheet = workbook.addWorksheet(sheetname);

  if (!datalist.length) {
    return null;
  }

  const keys = Object.keys(datalist[0]._doc);

  worksheet.columns = keys.map((key) => ({
    header: key,
    key,
    width: 20,
  }));

  // Add Array Rows
  worksheet.addRows(datalist);

  return workbook;
};
