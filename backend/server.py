
from flask import Flask, render_template, jsonify, send_file, abort, request
import asyncio
from scrape.scraper import scraper_main
from flask_cors import CORS
import os
from datetime import datetime

from scrape.scraper import scraper_main
from scrape.cancellation_signal import CancellationSignal
from threading import Thread

from flask_socketio import SocketIO

from package.utils import clear_directory, get_cover_letter_filename


from auto_fill.cover_letter_api import cover_letter_blueprint

app = Flask(__name__)
app.register_blueprint(cover_letter_blueprint, url_prefix='/api')
CORS(app)

# Flask-SocketIO
socketio = SocketIO(app, cors_allowed_origins="*")  # Configure CORS as needed for your client

# Shared state
scraper_thread = None
cancellation_signal = CancellationSignal()
scrape_status = {'is_scraping': True, 'is_complete': False}


@app.route('/stop_scrape', methods=['POST'])
def stop_scrape():
    print("you hit the stop scraper button")
    global cancellation_signal
    if cancellation_signal:
        cancellation_signal.set_cancelled()
        return jsonify({"status": "Cancellation signal sent"}), 200
    else:
        return jsonify({"status": "No scrape task to cancel"}), 404


def run_scraper_in_thread(title, location, cancellation_signal):
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    try:
        loop.run_until_complete(scraper_main(title, location, cancellation_signal))
    finally:
        # After scraping is done, set the status to complete
        scrape_status['is_scraping'] = False
        scrape_status['is_complete'] = True
        
        loop.close()
        # Notify frontend that scraping is complete
        socketio.emit('scrape_complete', {'status': 'complete'})

@app.route('/start_scrape', methods=['POST'])
def start_scrape():
    global scraper_thread, cancellation_signal, scrape_status


    if scraper_thread is not None and scraper_thread.is_alive():
        return jsonify(status="Scraping already in progress"), 409
    # Set the scraping status when a new scrape starts
    scrape_status['is_scraping'] = True
    scrape_status['is_complete'] = False

    data = request.json
    title = data['title']
    location = data['location']
    # Split the titles and locations by commas and create lists, stripping whitespace
    title = [title.strip() for title in data['title'].split(',')]
    location = [location.strip() for location in data['location'].split(',')]
    print(f"title: {title}, location: {location}")

    cancellation_signal = CancellationSignal()  # Reset cancellation signal

    # Run the scraper in a separate thread
    scraper_thread = Thread(
        target=run_scraper_in_thread,
        args=(title, location, cancellation_signal)
    )
    scraper_thread.start()

    return jsonify(status="Scraping started"), 200
    

# Route to list all subdirectories within the 'data' directory
@app.route('/data-folders', methods=['GET'])
def list_data_folders():
    data_directory = os.path.join(app.root_path, '../data')
    # List all entities in the directory and filter for directories only
    folders = [name for name in os.listdir(data_directory) if os.path.isdir(os.path.join(data_directory, name))]
    # Sort folders in reverse order so the most recent is first
    sorted_folders = sorted(folders, reverse=True)
    return jsonify(sorted_folders)


@app.route('/all-data', methods=['GET'])
def get_all_data():
    data_directory = os.path.join(app.root_path, '../data')
    # all_data = {}
    all_data = []
    
    # Function to check if the folder name matches the date format
    def is_date(folder_name, date_format='%b-%d-%Y'):
        try:
            datetime.strptime(folder_name, date_format)
            return True
        except ValueError:
            return False


    # List all entities in the directory and filter for directories only
    folders = [name for name in os.listdir(data_directory) if os.path.isdir(os.path.join(data_directory, name))]

    # Separate folders into date-formatted and non-date-formatted
    date_folders = [folder for folder in folders if is_date(folder)]
    other_folders = [folder for folder in folders if not is_date(folder)]

    
    # Parse folder names into dates and sort
    sorted_folders = sorted(date_folders, key=lambda x: datetime.strptime(x, '%b-%d-%Y'), reverse=True)



    # Combine back the sorted date-folders with the non-sorted other folders
    final_folder_list = sorted_folders + other_folders
    
    
    # Loop through all directories in the data folder
    for folder in final_folder_list:
        folder_path = os.path.join(data_directory, folder)
        if os.path.isdir(folder_path):
            # List all json files in this directory
            files = [f for f in os.listdir(folder_path) if f.endswith('.json')]
            all_data.append({'date': folder, 'files': files})

    # print(all_data)

    return jsonify(all_data)


# Define the route for deleting a JSON file
@app.route('/delete-data/<folderDate>/<fileName>', methods=['DELETE'])
def delete_file(folderDate, fileName):
    try:
        # Construct the file path (adjust the path according to your directory structure)
        file_path = f'../data/{folderDate}/{fileName}'
        folder_path = f'../data/{folderDate}'
        # Perform the deletion
        # Make sure to handle any potential errors that can occur when trying to delete a file
        os.remove(file_path)

        # Check if the folder is empty after deletion
        if not os.listdir(folder_path):
            # If the folder is empty, remove the folder
            os.rmdir(folder_path)
            return jsonify({'message': 'File and folder deleted successfully'}), 200
        else:
            return jsonify({'message': 'File deleted successfully'}), 200
        # Return a success response
        
    except FileNotFoundError:
        # If the file was not found
        return jsonify({'error': 'File not found'}), 404
    except Exception as e:
        # Handle other exceptions such as permission issues
        return jsonify({'error': str(e)}), 500



@app.route('/files/<date>/<filename>', methods=['GET'])
def get_file(date, filename):
    # The directory where files are stored
    
    # Construct the full file path
    file_path = os.path.join("../data", date, filename)  
    print(f"filePath: {file_path}")

    # Check if the file exists
    if not os.path.isfile(file_path):
        # If the file does not exist, return a 404 Not Found response
        abort(404, description="File not found")

    try:
        # Open and send the file
        return send_file(file_path, as_attachment=True)  # Set as_attachment to False if the file should be displayed
    except Exception as e:
        # Handle exceptions that could be raised when sending the file
        abort(500, description=str(e))







@app.route('/upload_cover_letter', methods=['POST'])
def upload_cover_letter():
    upload_folder = './auto_fill/cover_letter'

    if 'coverLetter' not in request.files:
        return jsonify({'error': 'No file part'}), 400
    file = request.files['coverLetter']
    if file.filename == '':
        return jsonify({'error': 'No selected file'}), 400
    if file:
        # 清空上传文件夹
        clear_directory(upload_folder)
        filename = file.filename
        # 保存新的 cover letter 文件
        file.save(os.path.join(upload_folder, filename))
        return jsonify({'message': 'File uploaded successfully', 'filename': filename}), 200

    return jsonify({'error': 'File extension not allowed'}), 400


@app.route('/get-cover-letter-name', methods=['GET'])
def get_cover_letter_name():
    directory = './auto_fill/cover_letter'
    cover_letter_filename = get_cover_letter_filename(directory)
    if cover_letter_filename:
        return jsonify({'filename': cover_letter_filename})
    else:
        return jsonify({'error': 'No cover letter found'}), 404


if __name__ == "__main__":
    app.run(debug=True)