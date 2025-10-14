            <ReactQuill
              theme="snow"
              value={notes}
              onChange={onNotesChange}
              placeholder="Take a note..."
              modules={{
                toolbar: [
                  ['bold', 'italic', 'underline', 'strike'],
                  [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                  ['clean']
                ]
              }}
              className="quill-form-field"
            /> 

