import os
import json
import re
import uuid
from typing import Any, TypedDict
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.agents import initialize_agent, AgentType
from langchain.tools import Tool
from langgraph.graph import StateGraph
from pymongo import MongoClient
from dotenv import load_dotenv
import chromadb
from chromadb.utils.embedding_functions import DefaultEmbeddingFunction
from flask_cors import CORS
from fastapi.middleware.cors import CORSMiddleware
from bson import ObjectId

# Load environment variables
load_dotenv()
llm = ChatGoogleGenerativeAI(
    model="gemini-1.5-flash",
    temperature=0.3,
    google_api_key=os.getenv("GEMINI_API_KEY")
)
# === MongoDB setup ===
client = MongoClient(
    os.getenv("MONGODB_URI"),
    serverSelectionTimeoutMS=50000,  # 50 seconds
    connectTimeoutMS=30000
)
db = client["ui_blocks"]
base_col = db["templates"]
user_col = db["user_templates"]

# === ChromaDB setup ===
chroma_client = chromadb.Client()
collection = chroma_client.get_or_create_collection(name="ui_templates")
# embedding_function = embedding_functions.DefaultEmbeddingFunction()
embedding_function = DefaultEmbeddingFunction()



# === FastAPI app ===
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Or ["http://localhost:3000"] for more security
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# === Pydantic models for API requests ===
class GenerateUIRequest(BaseModel):
    command: str

class SaveUIRequest(BaseModel):
    html: str
    parent_template_id: str
    user: str

# === Tool: RAG UI retriever ===
# def retrieve_ui_templates(input_str: str) -> dict:
#     try:
#         # Extract structured intent using LLM
#         intent_prompt = f"""
#         Extract structured intent from: "{input_str}".
#         Return JSON with: component, fields[], purpose, style.
#        Only return **valid JSON**. Do not include explanations or markdown.
#         """
#         intent_json = llm.invoke(intent_prompt).content
#         intent = json.loads(intent_json)
#         print("LLM intent_json:", repr(intent_json))  # Debug print
#         if not intent_json or not intent_json.strip().startswith("{"):
#             raise HTTPException(status_code=500, detail=f"LLM did not return valid JSON: {intent_json}")

#         try:
#             intent = json.loads(intent_json)
#         except Exception as e:
#             raise HTTPException(status_code=500, detail=f"Could not parse LLM JSON: {intent_json} | Error: {str(e)}")
#         # Create query for ChromaDB
#         query_text = f"{intent['component']} {intent['purpose']} {','.join(intent['fields'])}"
#         query_embedding = embedding_function([query_text])[0]

#         # Search ChromaDB for matching templates
#         results = collection.query(
#             query_embeddings=[query_embedding],
#             n_results=1,
#             where={
#                 "component": intent["component"],
#                 "purpose": intent.get("purpose", "general")
#             }
#         )

#         template_id = str(uuid.uuid4())

#         # Check if a matching template is found
#         if results["documents"] and results["metadatas"][0]["component"] == intent["component"]:
#             return {
#                 "html": results["metadatas"][0]["html"],
#                 "template_id": results["metadatas"][0].get("template_id", template_id)
#             }

#         # Fallback: Generate new component
#         generate_prompt = f"""
#         Generate a responsive {intent['component']} for {intent['purpose']} purpose,
#         using {intent['style']} CSS. Fields: {', '.join(intent['fields'])}.
#         Return only raw HTML.
#         """
#         html = llm.invoke(generate_prompt).content
#         clean_html = re.sub(r"^```html\s*|```$", "", html).strip()

#         # Store new template in MongoDB and ChromaDB
#         doc = {
#             "template_id": template_id,
#             "component": intent["component"],
#             "fields": intent["fields"],
#             "purpose": intent["purpose"],
#             "style": intent["style"],
#             "html": clean_html,
#             "source": "gemini"
#         }
#         base_col.insert_one(doc)

#         # Store in ChromaDB
#         collection.add(
#             documents=[query_text],
#             metadatas=[doc],
#             ids=[f"{intent['component']}_{intent['purpose']}_{len(intent['fields'])}"]
#         )

#         return {"html": clean_html, "template_id": template_id}

#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
def retrieve_ui_templates(input_str: str) -> dict:
    try:
        # Updated LLM prompt for consistent structured JSON
        intent_prompt = f"""
        Extract the structured intent from: "{input_str}"

        Respond with a **valid JSON** object ONLY with the following keys:
        - component: string
        - fields: array of strings
        - purpose: string
        - style: string

        Only return valid JSON. Do NOT include markdown or explanation.
        Example:
        {{
          "component": "form",
          "fields": ["name", "email", "message"],
          "purpose": "contact form",
          "style": "modern"
        }}
        """

        # Call LLM and strip whitespace
        intent_response = llm.invoke(intent_prompt).content.strip()
        print("[DEBUG] LLM Raw Response:", repr(intent_response))

        # Remove markdown formatting if accidentally included
        cleaned_response = re.sub(r"^```json\s*|```$", "", intent_response).strip()

        # Try to parse JSON
        try:
            intent = json.loads(cleaned_response)
        except json.JSONDecodeError as e:
            raise HTTPException(status_code=500, detail=f"LLM returned invalid JSON: {e}\nRaw: {cleaned_response}")

        # Create query for ChromaDB
        query_text = f"{intent['component']} {intent['purpose']} {','.join(intent['fields'])}"
        query_embedding = embedding_function([query_text])[0]

        # Search ChromaDB
        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=1,
            # where={
            #     "component": intent["component"],
            #     "purpose": intent.get("purpose", "general")
            # }
        )

        template_id = str(uuid.uuid4())

        # if results["documents"] and results["metadatas"][0]["component"] == intent["component"]:
        if (
            results.get("metadatas") and 
            len(results["metadatas"]) > 0 and 
            len(results["metadatas"][0]) > 0 and 
            results["metadatas"][0][0]["component"] == intent["component"]
        ):
              return {
                "html": results["metadatas"][0][0]["html"],
                "template_id": results["metadatas"][0][0].get("template_id", template_id)
            }

        # If no match, generate new HTML with LLM
        generate_prompt = f"""
        Generate a responsive {intent['component']} for {intent['purpose']} purpose,
        using {intent['style']} CSS. Fields: {', '.join(intent['fields'])}.
        Return only raw HTML. Do NOT include markdown or explanation.
        """
        html = llm.invoke(generate_prompt).content.strip()
        clean_html = re.sub(r"^```html\s*|```$", "", html).strip()

        # Store in MongoDB and ChromaDB
        def to_serializable(val):
            if isinstance(val, ObjectId):
                return str(val)
            if isinstance(val, list):
                return [to_serializable(i) for i in val]
            if isinstance(val, dict):
                return {k: to_serializable(v) for k, v in val.items()}
            return val

        doc = {
                "template_id": str(template_id),  # should already be string, but safe to cast
                "component": intent["component"],
                "fields": ", ".join(intent["fields"]),
                "purpose": intent["purpose"],
                "style": intent["style"],
                "html": clean_html,
                "source": "gemini"
            }

     # Sanitize doc to ensure no ObjectId in values
        doc = to_serializable(doc)
            
            
        base_col.insert_one(doc)

        collection.add(
            documents=[query_text],
            metadatas=[{k: (str(v) if isinstance(v, ObjectId) else v) for k, v in doc.items()}],
            ids=[f"{intent['component']}_{intent['purpose']}_{len(intent['fields'])}"]
        )
        return {"html": clean_html, "template_id": template_id}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

# === LangChain tool ===
tools = [
    Tool(
        name="retrieve_ui_templates",
        func=lambda x: retrieve_ui_templates(x)["html"],
        description="Retrieve or generate UI templates using RAG and LLM."
    )
]

# === Agent ===
agent = initialize_agent(
    tools=tools,
    llm=llm,
    agent=AgentType.ZERO_SHOT_REACT_DESCRIPTION,
    verbose=True,
)


# === LangGraph State ===
class AgentState(TypedDict):
    input: str
    output: Any

def agent_node(state: AgentState) -> AgentState:
    print("\n[LangGraph Node] Running agent on input...")
    state["output"] = agent.invoke(state["input"])
    return state

# === Function to safely initialize app_graph ===
def init_graph():
    try:
        graph = StateGraph(AgentState)
        graph.add_node("agent", agent_node)
        graph.set_entry_point("agent")
        compiled_graph = graph.compile()
        print("[INFO] LangGraph compiled successfully.")
        return compiled_graph
    except Exception as e:
        print(f"[ERROR] Failed to compile LangGraph: {e}")
        raise

# === Compile the graph (IMPORTANT: MUST be at top level) ===
app_graph = init_graph()



# === API Endpoints ===
@app.post("/generate-ui")
async def generate_ui(request: GenerateUIRequest):
    try:
        print(f"[DEBUG] Received request: {request.command}")
        initial_state = {"input": request.command}
        result = app_graph.invoke(initial_state)
        return {
            "html": result["output"],
            "template_id": ""
        }
    except Exception as e:
        print("Error in /generate-ui:", e)
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/save-ui")
async def save_ui(request: SaveUIRequest):
    try:
        doc = {
            "template_id": str(uuid.uuid4()),
            "parent_template_id": request.parent_template_id,
            "user": request.user,
            "html": request.html,
            "source": "user_modified"
        }
        user_col.insert_one(doc)
        return {"message": "Template saved successfully", "template_id": doc["template_id"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error saving template: {str(e)}")

# === Run the agent with input (for testing) ===
if __name__ == "__main__":
    import uvicorn
    
    print("\n=== Final Output ===")
   
    uvicorn.run(app, host="127.0.0.1", port=5000)