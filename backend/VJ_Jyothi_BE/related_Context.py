# from langchain.vectorstores import FAISS
# from langchain.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import HuggingFaceEmbeddings
# import google.generativeai as genai
import os
# genai.configure(api_key="AIzaSyDm8DdIpiNlNrQGtRQ6V1H7Y9ipkedVz6M")
import warnings
warnings.filterwarnings("ignore")


# Define cache directory
CACHE_DIR = os.path.expanduser("~/.cache/huggingface")
embedding_model_name = "sentence-transformers/all-mpnet-base-v2"


def get_Related_Context(query):
    # Paths
    faiss_index_path = "faiss_index_"


    # Load embedding model from cache
    
    embeddings = HuggingFaceEmbeddings(model_name=embedding_model_name, cache_folder=CACHE_DIR)

    # Load FAISS index (without regenerating)
    vectorstore = FAISS.load_local(faiss_index_path, embeddings, allow_dangerous_deserialization=True)
    retriever = vectorstore.as_retriever()
    relevant_docs = retriever.invoke(query)    
        # Combine retrieved texts
    context = "\n".join([doc.page_content for doc in relevant_docs])
    # print("context",context)
    return context

# get_Related_Context("which companies are visited for placements to VNR")
# def get_gemini_response(query):
#     """Retrieve results from FAISS index and generate a response using Gemini AI."""
#     # Retrieve relevant documents from FAISS
#     relevant_docs = retriever.invoke(query)
    
#     # Combine retrieved texts
#     context = "\n".join([doc.page_content for doc in relevant_docs])

#     # Prepare prompt
#     prompt = f"""
#     You are an AI assistant. Use the following context to answer the query accurately.
    
#     Context:
#     {context}
    
#     Query:
#     {query}
#     """

#     # Use Gemini AI to generate response
#     model = genai.GenerativeModel("models/gemini-2.0-flash-exp")
#     response = model.generate_content(prompt)
    
#     return response.text

# # Example usage
# query = "List out the comapnies that are visited VNR for placements which give internship stipend greater than 50000"
# response = get_gemini_response(query)
# print(response)
