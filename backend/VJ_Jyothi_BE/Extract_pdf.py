import os
# from langchain.vectorstores import FAISS
from langchain_community.vectorstores import FAISS

# from langchain.embeddings import HuggingFaceEmbeddings
from langchain_community.embeddings import HuggingFaceEmbeddings

# from langchain.document_loaders import PyPDFLoader
from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import CharacterTextSplitter
import warnings
warnings.filterwarnings("ignore")

# Paths
pdfs_folder = "pdfs"
faiss_index_path = "faiss_index_"

# Load embedding model
embedding_model_name = "sentence-transformers/all-mpnet-base-v2"
embeddings = HuggingFaceEmbeddings(model_name=embedding_model_name)

def generate_faiss_index():
    """Generate and update FAISS index only if new PDFs are present."""
    # Load existing FAISS index if available
    if os.path.exists(faiss_index_path):
        vectorstore = FAISS.load_local(faiss_index_path, embeddings, allow_dangerous_deserialization=True)
    else:
        vectorstore = None

    # Define text splitter
    text_splitter = CharacterTextSplitter(chunk_size=1000, chunk_overlap=30, separator="\n")

    # Process all PDFs in the folder
    for pdf_file in os.listdir(pdfs_folder):
        if pdf_file.endswith(".pdf"):
            pdf_path = os.path.join(pdfs_folder, pdf_file)
            print(f"Processing: {pdf_path}")

            # Load and split PDF
            loader = PyPDFLoader(pdf_path)
            documents = loader.load()
            new_docs = text_splitter.split_documents(documents)

            # Add documents to FAISS index
            if vectorstore:
                vectorstore.add_documents(new_docs)
            else:
                vectorstore = FAISS.from_documents(new_docs, embeddings)

    # Save updated FAISS index
    vectorstore.save_local(faiss_index_path)
    print("FAISS index updated successfully!")


generate_faiss_index()
# it is run only once when we add new pdfs to the pdfs list  