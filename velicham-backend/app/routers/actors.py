import hashlib
from fastapi import APIRouter, HTTPException

router = APIRouter(prefix="/api/actors", tags=["Threat Actors"])

# Pre-populated OSINT Database
ACTOR_DATABASE = {
    "darkknight": {
        "handle": "DarkKnight",
        "aliases": ["DK_Ransom", "ShadowKnight"],
        "pgp_key_id": "0x4F8A9B12",
        "wallet": "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
        "risk_score": 92.5,
        "status": "Active Threat",
        "primary_forum": "Exploit.in",
        "stylometry_lead_confidence": "58% (Low-Medium)",
        "hard_proofs": ["PGP Signed Message #482", "Crypto Transfer Hop #3"]
    },
    "zero_cool": {
        "handle": "Zero_Cool",
        "aliases": ["ZC_Lulz", "CrashOverride"],
        "pgp_key_id": "0x9E7A31C4",
        "wallet": "3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy",
        "risk_score": 78.0,
        "status": "Under Investigation",
        "primary_forum": "XSS.is",
        "stylometry_lead_confidence": "42% (Low)",
        "hard_proofs": ["Neo4j Co-location Hop"]
    }
}

@router.get("/{handle}")
def get_actor_intelligence(handle: str):
    clean_handle = handle.strip().lower()
    
    # 1. Check if actor exists in mock database
    if clean_handle in ACTOR_DATABASE:
        return ACTOR_DATABASE[clean_handle]
    
    # 2. Dynamic generator for any new/unknown handle searched
    handle_hash = hashlib.sha256(clean_handle.encode()).hexdigest()
    
    return {
        "handle": handle,
        "aliases": [f"{handle}_dark", f"{handle}_root"],
        "pgp_key_id": f"0x{handle_hash[:8].upper()}",
        "wallet": f"bc1q{handle_hash[8:38].lower()}",
        "risk_score": round((int(handle_hash[:2], 16) / 255) * 100, 1),
        "status": "Unverified Target",
        "primary_forum": "Dread / BreachForums",
        "stylometry_lead_confidence": "45% (Unvalidated Lead)",
        "hard_proofs": ["Pending Cryptographic Verification"]
    }