from flask import Flask, request, jsonify
from flask_cors import CORS
from facenet_pytorch import MTCNN, InceptionResnetV1
import torch
from PIL import Image
import numpy as np
import os
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Initialize the MTCNN and InceptionResnetV1 models
device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
logger.info(f"Using device: {device}")

try:
    mtcnn = MTCNN(device=device)
    resnet = InceptionResnetV1(pretrained='vggface2').eval().to(device)
    logger.info("Models loaded successfully")
except Exception as e:
    logger.error(f"Error loading models: {str(e)}")
    raise

@app.route('/create-embedding', methods=['POST'])
def create_embedding():
    logger.info("Received create-embedding request")
    
    if 'image' not in request.files:
        logger.error("No image file in request")
        return jsonify({'error': 'No image file provided'}), 400

    image_file = request.files['image']
    user_id = request.form.get('userId')
    
    if not user_id:
        logger.error("No user ID provided")
        return jsonify({'error': 'No user ID provided'}), 400

    logger.info(f"Processing image for user {user_id}")
    
    try:
        # Save the uploaded image temporarily
        temp_path = f'temp_{user_id}.jpg'
        image_file.save(temp_path)
        
        # Get embedding
        img = Image.open(temp_path)
        face = mtcnn(img)
        
        if face is None:
            logger.error("No face detected in the image")
            return jsonify({'error': 'No face detected in the image'}), 400
            
        embedding = resnet(face.unsqueeze(0))
        embedding_np = embedding.detach().cpu().numpy().flatten()
        
        # Save embedding
        os.makedirs('stored_embeddings', exist_ok=True)
        embedding_path = f'stored_embeddings/{user_id}.npy'
        np.save(embedding_path, embedding_np)
        
        logger.info(f"Successfully created and saved embedding for user {user_id}")
        
        return jsonify({
            'userId': user_id,
            'embedding': embedding_np.tolist()
        })
        
    except Exception as e:
        logger.error(f"Error processing image: {str(e)}")
        return jsonify({'error': str(e)}), 500
        
    finally:
        # Clean up temporary file
        if os.path.exists(temp_path):
            os.remove(temp_path)

@app.route('/verify-face', methods=['POST'])
def verify_face():
    logger.info("Received verify-face request")
    
    if 'image' not in request.files:
        logger.error("No image file in request")
        return jsonify({'error': 'No image file provided'}), 400

    user_id = request.form.get('userId')
    if not user_id:
        logger.error("No user ID provided")
        return jsonify({'error': 'No user ID provided'}), 400

    # Save the uploaded image temporarily
    temp_path = f'temp_{user_id}.jpg'
    
    try:
        image = request.files['image']
        image.save(temp_path)
        
        # Get the embedding for the uploaded image
        img = Image.open(temp_path)
        face = mtcnn(img)
        
        if face is None:
            logger.error("No face detected in verification image")
            return jsonify({'error': 'No face detected in the image'}), 400
            
        current_embedding = resnet(face.unsqueeze(0))
        current_embedding_np = current_embedding.detach().cpu().numpy().flatten()

        # Get the stored embedding for the user
        stored_embedding_path = f'stored_embeddings/{user_id}.npy'
        if not os.path.exists(stored_embedding_path):
            logger.error(f"No stored embedding found for user {user_id}")
            return jsonify({'error': 'No stored face data for this user'}), 404

        stored_embedding = np.load(stored_embedding_path)
        
        # Calculate similarity
        similarity = np.dot(current_embedding_np, stored_embedding) / (
            np.linalg.norm(current_embedding_np) * np.linalg.norm(stored_embedding)
        )
        
        is_match = similarity > 0.7
        logger.info(f"Verification result for user {user_id}: match={is_match}, similarity={similarity}")
        
        return jsonify({
            'access_granted': is_match,
            'similarity_score': float(similarity)
        })

    except Exception as e:
        logger.error(f"Error during face verification: {str(e)}")
        return jsonify({'error': str(e)}), 500
        
    finally:
        # Clean up temporary file
        if os.path.exists(temp_path):
            os.remove(temp_path)


@app.route('/recognize-face', methods=['POST'])
def recognize_face():
    logger.info("Received recognize-face request")

    if 'image' not in request.files:
        logger.error("No image file in request")
        return jsonify({'error': 'No image file provided'}), 400

    # Zapisz tymczasowo obraz
    temp_path = 'temp_recognition.jpg'

    try:
        image = request.files['image']
        image.save(temp_path)

        img = Image.open(temp_path)
        face = mtcnn(img)

        if face is None:
            logger.error("No face detected in the image")
            return jsonify({'error': 'No face detected in the image'}), 400

        input_embedding = resnet(face.unsqueeze(0)).detach().cpu().numpy().flatten()

        # Przeglądaj wszystkie zapisane embeddingi
        best_match = None
        highest_similarity = -1
        threshold = 0.7  # dopasowanie twarzy

        for file in os.listdir('stored_embeddings'):
            if file.endswith('.npy'):
                user_id = os.path.splitext(file)[0]
                stored_embedding = np.load(os.path.join('stored_embeddings', file))
                similarity = np.dot(input_embedding, stored_embedding) / (
                        np.linalg.norm(input_embedding) * np.linalg.norm(stored_embedding)
                )
                logger.info(f"Compared with {user_id}: similarity={similarity}")

                if similarity > highest_similarity:
                    highest_similarity = similarity
                    best_match = user_id

        if highest_similarity >= threshold:
            logger.info(f"Best match: {best_match} with similarity {highest_similarity}")
            return jsonify({
                'recognized': True,
                'userId': best_match,
                'similarity_score': float(highest_similarity)
            })
        else:
            logger.info("No matching user found")
            return jsonify({
                'recognized': False,
                'message': 'No matching user found'
            })

    except Exception as e:
        logger.error(f"Error during face recognition: {str(e)}")
        return jsonify({'error': str(e)}), 500

    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

if __name__ == '__main__':
    # Create directory for stored embeddings if it doesn't exist
    os.makedirs('stored_embeddings', exist_ok=True)
    logger.info("Starting Flask server...")
    app.run(host='0.0.0.0', port=5000, debug=True) 