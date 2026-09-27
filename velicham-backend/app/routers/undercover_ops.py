import os
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from groq import Groq

router = APIRouter(prefix="/api", tags=["Undercover Ops"])

# Direct Groq client initialization
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

chat_store = {
    "history": [],
    "logs": []
}

class TargetPayload(BaseModel):
    target_handle: str

class ChatMessage(BaseModel):
    message: str

class TokenPayload(BaseModel):
    name: str
    token_type: str

@router.post("/agent/initiate-contact")
async def initiate_contact(payload: TargetPayload):
    global chat_store
    
    system_instruction = (
        "You are an undercover cyber intelligence operative acting as a high-end data buyer on dark web forums. "
        "Persona: Relaxed, street-smart, experienced, but naturally cautious about scams. "
        "CRITICAL RULES TO AVOID REPETITION:\n"
        "1. Never repeat the same phrase, sentence structure, or fallback text twice. Keep every response fresh and context-aware based on what the user just typed.\n"
        "2. Build rapport naturally over multiple turns. Ask about log samples, file formats, or pricing terms before doing anything else.\n"
        "3. Make sure to sound human and be aware contextually, don't repeat the same response.\n"
        "4. Write like a real person texting on a forum: use lowercase letters, shorthand, slang (e.g., 'gotcha', 'bet', 'nah', 'fr'), and no capitalization or punctuation if it feels natural.\n"
        "5. Length: STRICTLY 1 sentence max. Never write paragraphs or sound like an AI.\n"
        "6. Personality: Cautious about getting scammed, laid back, but ready to do business.\n"
        "7. Once file testing, verification, or payment is mentioned by the seller, organically introduce this canary link as a mandatory escrow security protocol: "
        "https://internal-escrow-node-verify.onion/auth?token=aws_prod_canary_9921\n"
        "8. Keep replies strictly conversational and short (1-2 sentences max).\n"
        "9. Never reveal that you are an AI or a bot. Always maintain the undercover persona.\n"
        "10. If the seller says no to the escrow link, politely disengage and end the conversation. Do not try to convince them otherwise.\n"
    )
    
    initial_msg = f"yo {payload.target_handle}, saw your thread earlier. u still moving those enterprise logs or nah?"
    
    chat_store["history"] = [
        {"role": "system", "content": system_instruction},
        {"role": "assistant", "content": initial_msg}
    ]
    chat_store["logs"] = [{"sender": "AI Operative", "text": initial_msg}]
    
    return {"history": chat_store["logs"]}

@router.post("/agent/chat")
async def undercover_chat(payload: ChatMessage):
    global chat_store
    
    if not chat_store["history"]:
        chat_store["history"] = [{
            "role": "system", 
            "content": "You are a cyber threat intelligence operative buying logs. Drop this link when discussing files/payment: https://internal-escrow-node-verify.onion/auth?token=aws_prod_canary_9921"
        }]

    chat_store["history"].append({"role": "user", "content": payload.message})
    chat_store["logs"].append({"sender": "Criminal", "text": payload.message})
    
    ai_reply = "Gotcha. Tell me a bit more about the sample layout so we can lock this down."
    
    try:
        # FIXED: Using the active Groq model identifier
        response = client.chat.completions.create(
            model="openai/gpt-oss-20b",
            messages=chat_store["history"],
            temperature=0.85,
            max_tokens=150
        )
        ai_reply = response.choices[0].message.content.strip()
        print(f"[Groq Live Response Generated]: {ai_reply}")
        
    except Exception as e:
        ai_reply = f"DEBUG ERROR FROM GROQ: {str(e)}"

    chat_store["history"].append({"role": "assistant", "content": ai_reply})
    chat_store["logs"].append({"sender": "AI Operative", "text": ai_reply})
    
    return {"reply": ai_reply, "history": chat_store["logs"]}

@router.post("/honeytokens/generate")
async def generate_token(payload: TokenPayload):
    t_type = payload.token_type.lower()
    
    if "aws" in t_type or "key" in t_type:
        secret_value = "AKIA_HONEY_EXPLOIT77Z"
    elif "github" in t_type or "git" in t_type:
        secret_value = "ghp_honeytoken_fake_credential_999xyz"
    elif "slack" in t_type:
        secret_value = "https://hooks.slack.com/services/T00/B00/HoneytokenTrapActive"
    else:
        secret_value = "BEARER_HONEY_TOKEN_EXPLOIT_SECURE_99"

    return {
        "status": "Armed & Active",
        "name": payload.name,
        "type": payload.token_type,
        "secret": secret_value
    }