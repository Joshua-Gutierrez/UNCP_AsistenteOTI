import asyncio
import csv
import sys
from sqlmodel import select
from sqlmodel.ext.asyncio.session import AsyncSession
from app.db.database import get_session
from app.models.usuario import Usuario

async def importar_desde_csv(ruta_csv: str):
    print(f"Leyendo archivo: {ruta_csv}")
    
    # Abrimos la sesión a la base de datos
    async for db in get_session():
        # Leemos el archivo CSV
        try:
            with open(ruta_csv, mode="r", encoding="utf-8-sig") as file:
                reader = csv.DictReader(file, delimiter=";")
                # Si el archivo usa comas en lugar de punto y coma, puedes cambiar delimiter=","

                agregados = 0
                actualizados = 0

                for row in reader:
                    dni = str(row.get("DNI", "")).strip()
                    if not dni:
                        continue
                        
                    nombre = str(row.get("Nombre completo", "")).strip()
                    codigo = str(row.get("Código", "")).strip()
                    facultad = str(row.get("Facultad", "")).strip()
                    escuela = str(row.get("Escuela Profesional", "")).strip()
                    programa = str(row.get("Programa Académico", "")).strip()
                    plan = str(row.get("Plan", "")).strip()
                    ciclo = str(row.get("Ciclo", "")).strip()
                    
                    try:
                        creditos = float(row.get("Créditos", 0))
                    except ValueError:
                        creditos = 0.0
                        
                    sexo = str(row.get("Sexo", "")).strip()
                    
                    try:
                        edad = int(row.get("Edad", 0))
                    except ValueError:
                        edad = 0
                        
                    departamento = str(row.get("Departamento", "")).strip()
                    provincia = str(row.get("Provincia", "")).strip()
                    distrito = str(row.get("Distrito", "")).strip()

                    # Verificar si el estudiante ya existe
                    existente = (await db.exec(select(Usuario).where(Usuario.dni == dni))).first()

                    if existente:
                        # Si ya existe, le actualizamos los datos extra
                        existente.codigo = codigo
                        existente.facultad = facultad
                        existente.escuela = escuela
                        existente.programa = programa
                        existente.plan = plan
                        existente.ciclo = ciclo
                        existente.creditos = creditos
                        existente.sexo = sexo
                        existente.edad = edad
                        existente.departamento = departamento
                        existente.provincia = provincia
                        existente.distrito = distrito
                        db.add(existente)
                        actualizados += 1
                    else:
                        # Si no existe, creamos uno nuevo
                        nuevo_usuario = Usuario(
                            dni=dni,
                            nombre=nombre,
                            rol="estudiante",
                            codigo=codigo,
                            facultad=facultad,
                            escuela=escuela,
                            programa=programa,
                            plan=plan,
                            ciclo=ciclo,
                            creditos=creditos,
                            sexo=sexo,
                            edad=edad,
                            departamento=departamento,
                            provincia=provincia,
                            distrito=distrito
                        )
                        db.add(nuevo_usuario)
                        agregados += 1
                
                # Guardamos todos los cambios juntos
                await db.commit()
                print(f"¡Importación exitosa! {agregados} alumnos nuevos, {actualizados} actualizados.")

        except Exception as e:
            print(f"Error al procesar el archivo: {e}")
        
        break # Solo necesitamos una sesión

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Uso: python -m app.importar_estudiantes <ruta_al_archivo.csv>")
        sys.exit(1)
        
    ruta = sys.argv[1]
    asyncio.run(importar_desde_csv(ruta))
