-- AlterTable
ALTER TABLE "Producto" ADD COLUMN     "precioMayoreo" DOUBLE PRECISION;

-- Precio inicial para los productos que ya existen: 80 % del menudeo (el admin lo ajusta en /admin/productos).
UPDATE "Producto" SET "precioMayoreo" = ROUND(("precioMenudeo" * 0.8)::numeric, 1) WHERE "precioMayoreo" IS NULL;
