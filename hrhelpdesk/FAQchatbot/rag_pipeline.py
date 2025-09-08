"""
RAG Pipeline for Egypt Labour Law Chatbot
Based on the RAG_Egypt_Labour_Law_Colab.ipynb implementation
"""

import os
import re
import time
import pickle
import pathlib
import logging
from typing import List, Dict, Tuple
import numpy as np
import faiss
import requests
from bs4 import BeautifulSoup
from readability import Document
import openai
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configuration
EMB_DIM = 1536  # OpenAI text-embedding-3-small dimension
URLS = [
    "https://eg.andersen.com/egypts-labour-law-14-2025/",
    "https://manshurat.org/content/qnwn-lml-ljdyd-2025",
]

INDEX_DIR = pathlib.Path("rag_index")
INDEX_DIR.mkdir(exist_ok=True)
FAISS_PATH = INDEX_DIR / "faiss.index"
META_PATH = INDEX_DIR / "metadata.pkl"

# Chunking / retrieval
MAX_CHARS = 350
OVERLAP = 60
TOP_K = 6
MAX_CONTEXT_CHARS = 8000

# Generation
OPENAI_MODEL = "gpt-4o-mini"
MAX_GEN_TOKENS = 512

# Set up logging
logging.basicConfig(level=logging.INFO,
                    format="%(asctime)s | %(levelname)s | %(message)s")

# Set OpenAI API key
OPENAI_API_KEY = os.getenv(
    "OPENAI_API_KEY", "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")
if OPENAI_API_KEY:
    openai.api_key = OPENAI_API_KEY
    print("✅ OpenAI API key set")
else:
    print("❌ No OpenAI API key found")


class TextProcessor:
    """Text processing utilities for web scraping and chunking"""

    @staticmethod
    def fetch_html(url: str, retries: int = 3, timeout: int = 30) -> str:
        """Fetch HTML content from URL with retries"""
        for i in range(retries):
            try:
                r = requests.get(url, timeout=timeout, headers={
                                 "User-Agent": "RAG/1.0"})
                r.raise_for_status()
                return r.text
            except Exception as e:
                logging.warning(f"Fetch failed ({i+1}/{retries}) {url}: {e}")
                time.sleep(1.5)
        raise RuntimeError(f"Could not fetch {url}")

    @staticmethod
    def readability_clean(html: str) -> str:
        """Clean HTML using readability"""
        try:
            return Document(html).summary(html_partial=True)
        except Exception:
            return html

    @staticmethod
    def html_to_text_keep_headers(html: str) -> str:
        """Convert HTML to text while preserving headers"""
        soup = BeautifulSoup(html, "html5lib")
        for tag in soup(["script", "style", "noscript"]):
            tag.decompose()

        lines = []
        ctx = soup.body if soup.body else soup
        for el in ctx.descendants:
            if getattr(el, "name", None) and re.fullmatch(r"h[1-6]", el.name, flags=re.I):
                txt = el.get_text(" ", strip=True)
                if txt:
                    level = int(el.name[1])
                    lines.append(f"\n{'#'*level} {txt}\n")
            elif getattr(el, "name", None) == "p":
                txt = el.get_text(" ", strip=True)
                if txt:
                    lines.append(txt)

        text = "\n".join(lines)
        text = re.sub(r"[ \t]+", " ", text)
        text = re.sub(r"\n{3,}", "\n\n", text).strip()
        return text

    @staticmethod
    def split_by_headers(text: str) -> List[Tuple[str, str]]:
        """Split text by markdown-style headers"""
        pat = re.compile(r"^(#{1,6})\s+(.*)$", flags=re.MULTILINE)
        sections, last, title = [], 0, "Document"
        for m in pat.finditer(text):
            start = m.start()
            if start > last:
                body = text[last:start].strip()
                if body:
                    sections.append((title, body))
            title = m.group(2).strip()
            last = m.end()
        tail = text[last:].strip()
        if tail:
            sections.append((title, tail))
        if not sections:
            sections = [("Document", text)]
        return sections

    @staticmethod
    def chunk_text(text: str, max_len: int = MAX_CHARS, overlap: int = OVERLAP) -> List[str]:
        """Split text into overlapping chunks"""
        text = text.strip()
        if len(text) <= max_len:
            return [text]
        out, start = [], 0
        while start < len(text):
            end = min(start + max_len, len(text))
            out.append(text[start:end].strip())
            if end == len(text):
                break
            start = max(0, end - overlap)
        return out

    @staticmethod
    def make_docs_from_url(url: str) -> List[Dict]:
        """Create document chunks from a URL"""
        html = TextProcessor.fetch_html(url)
        main = TextProcessor.readability_clean(html)
        text = TextProcessor.html_to_text_keep_headers(main)
        sections = TextProcessor.split_by_headers(text)

        docs, sec_id = [], 0
        for title, body in sections:
            body = re.sub(r"\n{3,}", "\n\n", body).strip()
            for i, chunk in enumerate(TextProcessor.chunk_text(body)):
                if len(chunk) < 30:
                    continue
                docs.append({
                    "id": f"{url}::sec{sec_id}::chunk{i}",
                    "url": url,
                    "section": title,
                    "chunk_id": i,
                    "text": chunk
                })
            sec_id += 1
        return docs


class Embedder:
    """OpenAI embeddings API"""

    def __init__(self):
        logging.info("Using OpenAI embeddings API")
        if not OPENAI_API_KEY:
            raise RuntimeError("OpenAI API key not found")

    def encode(self, texts: List[str]) -> np.ndarray:
        """Encode texts to embeddings using OpenAI API"""
        try:
            # Process texts in batches to avoid API limits
            batch_size = 100
            all_embeddings = []

            for i in range(0, len(texts), batch_size):
                batch = texts[i:i + batch_size]

                response = openai.embeddings.create(
                    model="text-embedding-3-small",
                    input=batch
                )

                batch_embeddings = [data.embedding for data in response.data]
                all_embeddings.extend(batch_embeddings)

                # Small delay to respect rate limits
                time.sleep(0.1)

            embeddings_array = np.array(all_embeddings, dtype=np.float32)

            # Normalize embeddings for cosine similarity
            norms = np.linalg.norm(embeddings_array, axis=1, keepdims=True)
            normalized_embeddings = embeddings_array / norms

            return normalized_embeddings

        except Exception as e:
            logging.error(f"Error getting embeddings from OpenAI: {e}")
            raise


class FaissIndex:
    """FAISS vector index for similarity search"""

    def __init__(self, dim: int, index_path: pathlib.Path, meta_path: pathlib.Path):
        self.dim = dim
        self.index_path = index_path
        self.meta_path = meta_path
        self.index = None
        self.metadata: List[Dict] = []

    def build(self, embeddings: np.ndarray, metadata: List[Dict]):
        """Build FAISS index from embeddings"""
        index = faiss.IndexFlatIP(
            self.dim)  # cosine similarity for normalized embeddings
        index.add(embeddings)
        self.index = index
        self.metadata = metadata

    def save(self):
        """Save index and metadata to disk"""
        if self.index is None:
            raise RuntimeError("No index to save")
        faiss.write_index(self.index, str(self.index_path))
        with open(self.meta_path, "wb") as f:
            pickle.dump(self.metadata, f)
        logging.info(
            f"Saved index to {self.index_path} and metadata to {self.meta_path}")

    def load(self):
        """Load index and metadata from disk"""
        self.index = faiss.read_index(str(self.index_path))
        with open(self.meta_path, "rb") as f:
            self.metadata = pickle.load(f)
        logging.info("Loaded FAISS index & metadata")

    def search(self, query_emb: np.ndarray, top_k: int = TOP_K) -> List[Tuple[float, Dict]]:
        """Search for similar documents"""
        if self.index is None:
            raise RuntimeError("Index not loaded")
        D, I = self.index.search(query_emb.astype(np.float32), top_k)
        hits = []
        for score, idx in zip(D[0], I[0]):
            if idx == -1:
                continue
            hits.append((float(score), self.metadata[idx]))
        return hits


class AnswerGenerator:
    """OpenAI-based answer generation"""

    def __init__(self):
        if not OPENAI_API_KEY:
            raise RuntimeError("OpenAI API key not found")
        logging.info("Using OpenAI for generation.")

    def generate(self, prompt: str) -> str:
        """Generate answer using OpenAI API"""
        try:
            response = openai.chat.completions.create(
                model=OPENAI_MODEL,
                temperature=0.2,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=MAX_GEN_TOKENS,
            )
            return response.choices[0].message.content.strip()
        except Exception as e:
            logging.error(f"OpenAI API error: {e}")
            return "I apologize, but I'm having trouble generating an answer right now. Please try again later."


class RAGPipeline:
    """Main RAG pipeline for question answering"""

    def __init__(self, urls: List[str], embedder: Embedder, index: FaissIndex, generator: AnswerGenerator):
        self.urls = urls
        self.embedder = embedder
        self.index = index
        self.generator = generator

    def ingest(self, force_rebuild: bool = False):
        """Build or load the knowledge base"""
        if FAISS_PATH.exists() and META_PATH.exists() and not force_rebuild:
            logging.info("Index exists—loading from disk.")
            self.index.load()
            return

        logging.info("Building new index...")
        all_docs: List[Dict] = []
        for url in self.urls:
            docs = TextProcessor.make_docs_from_url(url)
            logging.info(f"{url} → {len(docs)} chunks")
            all_docs.extend(docs)

        if not all_docs:
            raise RuntimeError("No documents found to index")

        embeddings = self.embedder.encode([d["text"] for d in all_docs])
        self.index.build(embeddings, all_docs)
        self.index.save()

    def _build_prompt(self, query: str, retrieved: List[Tuple[float, Dict]]) -> str:
        """Build prompt for OpenAI with retrieved context"""
        parts, total = [], 0
        for score, m in retrieved:
            block = f"\n[Source: {m['url']} | Section: {m.get('section','')}] Score={score:.3f}\n{m['text']}\n"
            if total + len(block) > MAX_CONTEXT_CHARS:
                break
            parts.append(block)
            total += len(block)

        context = "\n".join(parts).strip()
        instructions = (
            "You are a legal assistant answering questions about Egypt's Labour Law 14/2025.\n"
            "Ground your answers ONLY in the context provided below (Arabic or English). If you're unsure, say so.\n"
            "Where relevant, cite the URL in-line as (Source: <url>). Use bullets when helpful.\n"
            "Provide accurate, specific information based on the Egyptian Labour Law."
        )

        return f"""{instructions}

Question:
{query}

Context:
{context}

Answer (concise and specific):
"""

    def retrieve(self, query: str) -> List[Tuple[float, Dict]]:
        """Retrieve relevant documents for a query"""
        q_emb = self.embedder.encode([query])
        return self.index.search(q_emb, top_k=TOP_K)

    def answer(self, query: str) -> Dict:
        """Generate answer for a query using RAG"""
        hits = self.retrieve(query)
        if not hits:
            return {
                "query": query,
                "answer": "I couldn't find relevant information to answer your question about Egypt's Labour Law.",
                "retrieved": [],
                "confidence": 0.0
            }

        prompt = self._build_prompt(query, hits)
        text = self.generator.generate(prompt)

        # Calculate confidence based on top retrieval score
        confidence = hits[0][0] if hits else 0.0

        return {
            "query": query,
            "answer": text,
            "retrieved": hits,
            "confidence": confidence
        }


# Global RAG pipeline instance
_rag_pipeline = None


def get_rag_pipeline() -> RAGPipeline:
    """Get or create the global RAG pipeline instance"""
    global _rag_pipeline
    if _rag_pipeline is None:
        try:
            embedder = Embedder()
            index = FaissIndex(EMB_DIM, FAISS_PATH, META_PATH)
            generator = AnswerGenerator()
            _rag_pipeline = RAGPipeline(URLS, embedder, index, generator)
            _rag_pipeline.ingest(force_rebuild=False)
            logging.info("✅ RAG pipeline initialized successfully with OpenAI")
        except Exception as e:
            logging.error(f"❌ Failed to initialize RAG pipeline: {e}")
            raise
    return _rag_pipeline


def answer_question(question: str) -> Dict:
    """Answer a question using the RAG pipeline"""
    try:
        rag = get_rag_pipeline()
        return rag.answer(question)
    except Exception as e:
        logging.error(f"Error answering question: {e}")
        return {
            "query": question,
            "answer": "I apologize, but I'm having trouble processing your question right now. Please try again later.",
            "retrieved": [],
            "confidence": 0.0
        }


if __name__ == "__main__":
    # Test the RAG pipeline
    print("🧪 Testing RAG Pipeline...")

    test_questions = [
        "What are the key changes in Egypt's Labour Law 14/2025?",
        "What are the rules for maternity leave in Egypt?",
        "What are the working hours regulations?"
    ]

    for question in test_questions:
        print(f"\n{'='*80}")
        print(f"Q: {question}")
        print("-" * 80)

        result = answer_question(question)
        print(f"A: {result['answer']}")
        print(f"Confidence: {result['confidence']:.3f}")

        if result['retrieved']:
            print("\nTop sources:")
            for score, doc in result['retrieved'][:3]:
                print(
                    f"  - {doc['url']} | {doc.get('section', 'N/A')} | Score: {score:.3f}")

        print("=" * 80)
