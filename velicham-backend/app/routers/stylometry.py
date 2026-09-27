import re
import math
from typing import Dict
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/api/stylometry", tags=["AI Stylometry Engine"])

class StylometryRequest(BaseModel):
    sample_a: str
    sample_b: str

def extract_features(text: str) -> Dict:
    words = re.findall(r'\b\w+\b', text.lower())
    sentences = [s.strip() for s in re.split(r'[.!?]+', text) if s.strip()]
    
    total_words = len(words) or 1
    total_sentences = len(sentences) or 1
    
    unique_words = set(words)
    ttr = len(unique_words) / total_words
    avg_sentence_len = total_words / total_sentences
    
    punct_counts = {
        "commas": len(re.findall(r',', text)),
        "exclamations": len(re.findall(r'!', text)),
        "questions": len(re.findall(r'\?', text)),
        "semicolons": len(re.findall(r';', text)),
    }
    punct_density = [round((v / total_words) * 100, 2) for v in punct_counts.values()]
    
    return {
        "words": total_words,
        "ttr": ttr,
        "avg_sentence_len": avg_sentence_len,
        "punct_density": punct_density,
        "vocab_set": unique_words
    }

@router.post("/analyze")
def analyze_stylometry(payload: StylometryRequest):
    f_a = extract_features(payload.sample_a)
    f_b = extract_features(payload.sample_b)
    
    # 1. Vocabulary Jaccard Overlap
    intersection = len(f_a["vocab_set"].intersection(f_b["vocab_set"]))
    union = len(f_a["vocab_set"].union(f_b["vocab_set"])) or 1
    vocab_sim = intersection / union
    
    # 2. Sentence Length Delta
    len_delta = abs(f_a["avg_sentence_len"] - f_b["avg_sentence_len"])
    sentence_sim = math.exp(-0.05 * len_delta)
    
    # 3. Punctuation Similarity
    punct_diff = sum(abs(a - b) for a, b in zip(f_a["punct_density"], f_b["punct_density"]))
    punct_sim = math.exp(-0.1 * punct_diff)
    
    # Raw Score capped between 40% and 60% per Velicham Adversarial Defense Rules
    raw_score = (0.4 * vocab_sim) + (0.3 * sentence_sim) + (0.3 * punct_sim)
    capped_confidence = round(40.0 + (raw_score * 20.0), 1)
    
    return {
        "confidence": f"{capped_confidence}%",
        "punctuation_match": f"{round(punct_sim * 100, 1)}%",
        "sentence_length_diff": f"{round(len_delta, 1)} words",
        "vocab_richness": f"{round(vocab_sim * 100, 1)}% Overlap (TTR: {round(f_a['ttr'], 2)} vs {round(f_b['ttr'], 2)})",
        "adversarial_warning": "Stylometry is susceptible to LLM obfuscation. Treat result as an unvalidated lead only. Hard cryptographic proof (PGP/Crypto Wallet) is required for legal compliance."
    }