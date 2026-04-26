import * as XLSX from 'xlsx';

const ws = XLSX.utils.json_to_sheet([
  { B1_Soru_1: "Örnek Soru 1.1", B1_Soru_2: "Örnek Soru 2.1", B1_Soru_3: "Örnek Soru 3.1", B3_Konu: "Örnek Konu", B3_Lehine: "Lehine 1\nLehine 2", B3_Aleyhine: "Aleyhine 1\nAleyhine 2" }
]);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, "Soru Havuzu");
const data = XLSX.utils.sheet_to_json(ws);
console.log(data);
