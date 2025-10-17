from fastapi import FastAPI
from transformers import AutoTokenizer, AutoModelForCausalLM, pipeline
from related_Context import get_Related_Context

# Initialize FastAPI
app = FastAPI()

# Define cache directory and model name
CACHE_DIR = "./falcon_model_cache"
MODEL_NAME = "tiiuae/falcon-7b-instruct"

# Load Model & Tokenizer
try:
    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME, cache_dir=CACHE_DIR)
    model = AutoModelForCausalLM.from_pretrained(
        MODEL_NAME,
        cache_dir=CACHE_DIR
    )

    text_generator = pipeline("text-generation", model=model, tokenizer=tokenizer)

except Exception as e:
    print(f"Error loading model: {e}")
    text_generator = None


def generate_text(query: str):
    """Generates a response based on provided query."""
    if text_generator is None:
        return {"error": "Model not loaded properly."}

    context = get_Related_Context(query)
    formatted_prompt = f"""
    You are an AI assistant. Use the following context to answer the query accurately.

    Context:
    {context}

    Query:
    {query}
    """

    try:
        output = text_generator(
            formatted_prompt, 
            max_new_tokens=1024,
            do_sample=True, 
            temperature=0.7
        )

        return {"generated_text": output[0]["generated_text"]}

    except Exception as e:
        return {"error": str(e)}


# Example usage
if __name__ == "__main__":
    result = generate_text("List out the top 5 companies that give the highest salary")
    print(result)
