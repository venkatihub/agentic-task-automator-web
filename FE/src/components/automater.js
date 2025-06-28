// // // components/BlockEditor.tsx
// "use client";
// import { useState } from "react";

// export default function BlockEditor() {
//     const [command, setCommand] = useState("");
//     const [html, setHtml] = useState("");
//     const [templateId, setTemplateId] = useState("");
//     const [loading, setLoading] = useState(false); // Loading state

//     const fetchBlock = async () => {
//         setLoading(true);

//         const res = await fetch("http://127.0.0.1:8000/generate-ui", {
//             method: "POST",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify({ command }),
//         });
//         let data = await res.json();

//         console.log("Received data:", data);

//         // Extract clean HTML string from data.html.output
//         const cleanedHtml = extractHtmlFromOutput(data.html.output); // or data.html if that's the structure

//         setHtml(cleanedHtml);
//         setTemplateId(data.template_id);

//         setLoading(false);
//     };
//     function extractHtmlFromOutput(output) {
//         // Remove markdown code block if present
//         if (typeof output === "string") {
//             return output.replace(/^```html\s*|```$/g, "").trim();
//         }
//         return output;
//     }

//     const saveBlock = async () => {
//         const res = await fetch("http://127.0.0.1:8000/save-ui", {
//             method: "POST",
//             headers: { "Content-Type": "application/json" },
//             body: JSON.stringify({
//                 html,
//                 parent_template_id: templateId,
//                 user: "demo_user",
//             }),
//         });
//         alert("Saved!");
//     };

//     return (
//         <div>
//             <textarea
//                 placeholder="Describe your UI component..."
//                 className="w-full p-2 border mb-4"
//                 rows={3}
//                 value={command}
//                 onChange={(e) => setCommand(e.target.value)}
//             />
//             <button onClick={fetchBlock} className="bg-blue-600 text-white p-2 rounded">
//                 Generate UI
//             </button>
//             <div className="my-4">
//                 <h2 className="font-semibold">Editable Preview</h2>
//                 <div
//                     contentEditable
//                     className="p-4 border min-h-[100px]"
//                     dangerouslySetInnerHTML={{ __html: html }}
//                     onInput={(e) => setHtml(e.currentTarget.innerHTML)}
//                 />
//             </div>
//             <button onClick={saveBlock} className="bg-green-600 text-white p-2 rounded">
//                 Save Changes
//             </button>
//         </div>
//     );


// }



"use client"
import { useState } from "react"

export default function BlockEditor() {
  const [command, setCommand] = useState("")
  const [html, setHtml] = useState("")
  const [templateId, setTemplateId] = useState("")
  const [loading, setLoading] = useState(false)

  const fetchBlock = async () => {
    if (!command.trim()) return

    setLoading(true)
    try {
      const res = await fetch("http://127.0.0.1:8000/generate-ui", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command }),
      })
      const data = await res.json()

      console.log("Received data:", data)

      const cleanedHtml = extractHtmlFromOutput(data.html.output)
      setHtml(cleanedHtml)
      setTemplateId(data.template_id)
    } catch (error) {
      console.error("Error generating UI:", error)
    } finally {
      setLoading(false)
    }
  }

  function extractHtmlFromOutput(output) {
    if (typeof output === "string") {
      return output.replace(/^```html\s*|```$/g, "").trim()
    }
    return output
  }

  const saveBlock = async () => {
    if (!html || !templateId) return

    try {
      const res = await fetch("http://127.0.0.1:8000/save-ui", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          html,
          parent_template_id: templateId,
          user: "demo_user",
        }),
      })

      if (res.ok) {
        // Show success message
        const successMsg = document.createElement("div")
        successMsg.className = "fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50"
        successMsg.textContent = "Saved successfully!"
        document.body.appendChild(successMsg)
        setTimeout(() => successMsg.remove(), 3000)
      }
    } catch (error) {
      console.error("Error saving:", error)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      fetchBlock()
    }
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">UI Block Editor</h1>
        <p className="text-gray-600">Describe your UI component and generate it instantly</p>
      </div>

      {/* Input Section */}
      <div className="mb-6">
        <label htmlFor="command" className="block text-sm font-medium text-gray-700 mb-2">
          Describe your UI component
        </label>
        <textarea
          id="command"
          placeholder="e.g., Create a modern login form with email and password fields..."
          className="w-full p-4 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none transition-colors"
          rows={4}
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        <p className="text-xs text-gray-500 mt-1">Press Ctrl+Enter to generate</p>
      </div>

      {/* Generate Button */}
      <button
        onClick={fetchBlock}
        disabled={loading || !command.trim()}
        className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 mb-8"
      >
        {loading ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            Generating...
          </>
        ) : (
          <>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Generate UI
          </>
        )}
      </button>

      {/* Preview Section */}
      {html && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Editable Preview</h2>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              Click to edit
            </div>
          </div>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-1">
            <div
              contentEditable
              className="p-6 min-h-[200px] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset rounded-md"
              dangerouslySetInnerHTML={{ __html: html }}
              onInput={(e) => setHtml(e.currentTarget.innerHTML)}
              suppressContentEditableWarning={true}
            />
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              onClick={saveBlock}
              disabled={!html || !templateId}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-medium py-2 px-6 rounded-lg transition-colors duration-200 flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                />
              </svg>
              Save Changes
            </button>
          </div>

          {/* Template ID Display */}
          {templateId && (
            <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded border">
              Template ID: <code className="bg-gray-200 px-1 rounded">{templateId}</code>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {!html && !loading && (
        <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
          <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No UI generated yet</h3>
          <p className="text-gray-500">Describe your component above and click "Generate UI" to get started</p>
        </div>
      )}
    </div>
  )
}
