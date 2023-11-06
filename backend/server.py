from flask import Flask, render_template, jsonify, send_file, abort, request
import asyncio
from scrape.scraper import scraper_main
from flask_cors import CORS
import os
from datetime import datetime


app = Flask(__name__)
CORS(app)


@app.route('/start_scrape', methods=['POST'])
def start_scrape():
    try:
        # Extract title and location from the JSON data in the request
        data = request.json
        title = data['title']
        location = data['location']
        print(f"title: {title}, location: {location}")
        
        # Run the scraper function asynchronously and wait for it to complete
        asyncio.run(scraper_main(title=[title], location=[location]))
        
        # If the scraping is successful, send a success response
        return jsonify(status="Scraping started"), 200
    
    except Exception as e:
        # If an error occurs, print the error and send a failure response
        print(f"An error occurred: {e}")
        return jsonify(status="Scraping failed", error=str(e)), 500
    

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

    print(all_data)

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



if __name__ == "__main__":
    app.run(debug=True)
