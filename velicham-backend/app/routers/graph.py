from fastapi import APIRouter, HTTPException
from neo4j import GraphDatabase

router = APIRouter(prefix="/api/graph", tags=["Graph"])

# Replace with your actual URI and Password saved from Neo4j Aura
NEO4J_URI = "neo4j+s://YOUR_INSTANCE_ID.databases.neo4j.io"
NEO4J_USER = "neo4j"
NEO4J_PASSWORD = "YOUR_SAVED_PASSWORD"

try:
    driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))
except Exception as e:
    driver = None

@router.post("/seed")
def seed_graph_data():
    """Populates Neo4j with initial threat actor entity links."""
    if not driver:
        raise HTTPException(status_code=500, detail="Neo4j driver not initialized.")
        
    query = """
    MERGE (a1:Actor {handle: 'DarkKnight', risk: 'HIGH'})
    MERGE (a2:Actor {handle: 'Nomad', risk: 'MEDIUM'})
    MERGE (p1:PGP {key_id: '0x4F8A9B12'})
    MERGE (w1:Wallet {address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', currency: 'BTC'})
    MERGE (i1:IP {address: '185.220.101.5', type: 'Tor Exit Node'})

    MERGE (a1)-[:USES_PGP]->(p1)
    MERGE (a1)-[:TRANSFERS_TO]->(w1)
    MERGE (a2)-[:ASSOCIATED_WITH]->(p1)
    MERGE (a1)-[:CONNECTED_FROM]->(i1)
    RETURN a1
    """
    with driver.session() as session:
        session.run(query)
    return {"status": "Success", "message": "Sample threat network seeded into Neo4j!"}

@router.get("/actor/{handle}")
def get_actor_graph(handle: str):
    """Fetches nodes and relationships for a specific actor."""
    if not driver:
        raise HTTPException(status_code=500, detail="Neo4j driver not initialized.")

    query = """
    MATCH (a:Actor {handle: $handle})-[r]-(connected)
    RETURN a.handle as source, type(r) as relationship, 
           coalesce(connected.handle, connected.address, connected.key_id) as target,
           labels(connected)[0] as target_type
    """
    nodes = [{"id": handle, "group": "Actor"}]
    links = []
    seen_nodes = {handle}

    with driver.session() as session:
        results = session.run(query, handle=handle)
        for record in results:
            target_id = record["target"]
            if target_id not in seen_nodes:
                nodes.append({"id": target_id, "group": record["target_type"]})
                seen_nodes.add(target_id)
            
            links.append({
                "source": record["source"],
                "target": target_id,
                "label": record["relationship"]
            })

    return {"nodes": nodes, "links": links}