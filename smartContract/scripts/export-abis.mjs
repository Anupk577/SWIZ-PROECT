import fs from "node:fs";
const names = ["SZToken", "USDTcWrapper", "SourceDepositAdapter"];
const abis = Object.fromEntries(
  names.map((name) => [
    name,
    JSON.parse(fs.readFileSync(`artifacts/contracts/${name}.sol/${name}.json`))
      .abi,
  ])
);
fs.writeFileSync(
  "../frontEnd/src/constants/abis.json",
  JSON.stringify(abis, null, 2) + "\n"
);
