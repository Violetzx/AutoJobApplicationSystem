from flask import Blueprint, request, jsonify
from docx import Document
from docx.shared import Pt
from flask_cors import CORS
import os


cover_letter_blueprint = Blueprint('cover_letter', __name__)
CORS(cover_letter_blueprint)


def replace_placeholder_run(run, key, value, font_name='Arial', font_size_pt=12):
    if key in run.text:
        run.text = run.text.replace(key, value)
        run.font.name = font_name
        run.font.size = Pt(font_size_pt)

def replace_placeholders(doc_path, replacements):
    doc = Document(doc_path)
    for paragraph in doc.paragraphs:
        for run in paragraph.runs:
            for key, value in replacements.items():
                replace_placeholder_run(run, key, value)
    return doc
def get_full_path(relative_path):
    script_dir = os.path.dirname(os.path.abspath(__file__))  # Directory of the script
    return os.path.join(script_dir, relative_path)  # Full path to the file

@cover_letter_blueprint.route('/modify-cover-letter', methods=['POST'])
def modify_cover_letter():
    # Extract job details from the POST request
    data = request.json
    company = data.get('company')
    city = data.get('city')
    title = data.get('title')
    via = data.get('via')
    date = data.get('date')  # Default date if not provided

    # Dictionary of placeholders and their replacements
    replacements = {
        '[date]': date,
        '[company]': company,
        '[city]': city,
        '[title]': title,
        '[via]': via
    }

    # Replace placeholders in the document
    doc_path = get_full_path('cover_letter/cover_letter.docx')
    modified_doc_path = get_full_path('cover_letter/modified_cover_letter.docx')

    modified_doc = replace_placeholders(doc_path, replacements)
    modified_doc.save(modified_doc_path)

    # Return a success response
    return jsonify({'message': 'Cover letter modified successfully', 'path': modified_doc_path})
