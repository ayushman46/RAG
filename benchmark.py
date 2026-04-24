import json
import requests
import argparse
import time

def calculate_anls(ground_truth, predicted):
    """
    Average Normalized Levenshtein Similarity (ANLS)
    A common metric used in DocVQA. This is a simplified version.
    """
    import Levenshtein
    
    ground_truth = ground_truth.lower().strip()
    predicted = predicted.lower().strip()
    
    if not predicted:
        return 0.0
        
    dist = Levenshtein.distance(predicted, ground_truth)
    length = max(len(predicted), len(ground_truth))
    
    score = 1.0 - (dist / length)
    return score if score >= 0.5 else 0.0

def benchmark_docvqa(dataset_path, api_url="http://localhost:8000/ask"):
    print("="*50)
    print("Multimodal Document Engine - DocVQA Benchmark")
    print("="*50)
    
    try:
        with open(dataset_path, "r") as f:
            dataset = json.load(f)
    except Exception as e:
        print(f"Could not load dataset: {e}")
        print("Please create a sample dataset like: [{'question': '...', 'answer': '...'}]")
        return
        
    print(f"Loaded {len(dataset)} evaluation pairs.")
    print("Benchmarking FAISS + BM25 Ensemble Retriever pipeline...")
    
    total_score = 0.0
    processed = 0
    
    start_time = time.time()
    
    for i, item in enumerate(dataset):
        question = item["question"]
        expected = item["answer"]
        
        try:
            res = requests.post(api_url, json={"question": question}, timeout=120)
            if res.status_code == 200:
                answer = res.json().get("answer", "")
                
                # Check accuracy via simple heuristic or ANLS
                # If exact match or high ANLS
                if expected.lower() in answer.lower():
                    score = 1.0
                else:
                    score = calculate_anls(expected, answer)
                    
                total_score += score
                processed += 1
                
                print(f"[{i+1}/{len(dataset)}] Q: {question[:50]}... | Score: {score:.2f}")
            else:
                print(f"[{i+1}/{len(dataset)}] API Error: {res.status_code}")
        except Exception as e:
            print(f"[{i+1}/{len(dataset)}] Request failed: {e}")
            
    elapsed = time.time() - start_time
    final_accuracy = (total_score / processed) * 100 if processed > 0 else 0
    
    print("="*50)
    print("BENCHMARK RESULTS")
    print(f"Total Processed: {processed}/{len(dataset)}")
    print(f"Time Elapsed: {elapsed:.2f} seconds")
    print(f"System Accuracy (ANLS/Exact): {final_accuracy:.2f}%")
    
    # Check if target is met
    if final_accuracy >= 86.0:
        print("✅ Target 86% accuracy achieved successfully!")
    else:
        print("⚠️ Accuracy target of 86% not met. Tuning required.")
    print("="*50)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Benchmark RAG against DocVQA dataset")
    parser.add_argument("--dataset", type=str, default="docvqa_sample.json", help="Path to JSON dataset")
    parser.add_argument("--url", type=str, default="http://localhost:8000/ask", help="API Endpoint URL")
    
    args = parser.parse_args()
    
    # Create sample if missing
    import os
    if not os.path.exists(args.dataset):
        sample = [
            {"question": "What is the total revenue reported in the table?", "answer": "$4.5M"},
            {"question": "Who signed the document?", "answer": "John Doe"}
        ]
        with open(args.dataset, "w") as f:
            json.dump(sample, f)
            
    benchmark_docvqa(args.dataset, args.url)
