import httpx
import asyncio

async def test():
    async with httpx.AsyncClient() as client:
        # Test admin login + panel access
        await client.post('http://localhost:8000/api/v1/admin/login', json={'correo': 'admin@uncp.edu.pe', 'password': 'admin123'})
        
        # Test nodos endpoint
        resp = await client.get('http://localhost:8000/api/v1/admin/nodos')
        print(f'Nodos status: {resp.status_code}')
        for n in resp.json():
            print(f'  {n["codigo"]} ({n["tipo"]}) - {n["contenido"][:50]}...')
        
        # Test opciones endpoint
        resp2 = await client.get('http://localhost:8000/api/v1/admin/opciones')
        print(f'\nOpciones status: {resp2.status_code}')
        for o in resp2.json():
            print(f'  {o["nodo_origen_id"][:8]} -> {o["nodo_destino_id"][:8]} | valor: {o["valor_entrada"]}')
        
        # Test validacion
        resp3 = await client.get('http://localhost:8000/api/v1/admin/nodos/validar')
        print(f'\nValidación: {resp3.json()}')

asyncio.run(test())