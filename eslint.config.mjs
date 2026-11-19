import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // [RNF-SEC-03] Prohibido SQL crudo sin parámetros (SQL injection).
      "no-restricted-properties": [
        "error",
        { property: "$queryRawUnsafe", message: "Prohibido (SQL injection). Usa Prisma o $queryRaw con template." },
        { property: "$executeRawUnsafe", message: "Prohibido (SQL injection). Usa Prisma o $executeRaw con template." },
      ],
      // [RNF-10] Entre módulos solo se importa desde su index.ts.
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: ["@/modules/*/*"],
              message: "Importa solo desde el index del módulo: @/modules/<modulo>",
            },
          ],
        },
      ],
    },
  },
];

export default eslintConfig;
