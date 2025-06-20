"use client"

import { useState } from "react"

export default function Home() {
  const [command, setCommand] = useState("")
  const [result, setResult] = useState(null)
  const [isLoading, setIsLoading] = useState(false)

  const runTask = async () => {
    if (!command.trim()) return

    setIsLoading(true)
    try {
      const res = await fetch("http://localhost:5000/api/run-task", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command }),
      })
      const data = await res.json()
      setResult(data.result)
    } catch (error) {
      console.error("Error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      runTask()
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full mb-4">
            <span className="text-2xl">🧠</span>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Agentic AI</h1>
          <p className="text-xl text-gray-600">One-Click Task Automator for Web Blocks
</p>
        </div>

        {/* Input Section */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8 mb-8">
          <div className="space-y-6">
            <div>
              <label htmlFor="command" className="block text-sm font-medium text-gray-700 mb-2">
                Describe your task
              </label>
              <div className="relative">
                <textarea
                  id="command"
                  value={command}
                  onChange={(e) => setCommand(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Tell me what you'd like to automate... (Press Enter to run)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none transition-all duration-200 text-gray-900 placeholder-gray-500"
                  rows={3}
                />
              </div>
            </div>

            <button
              onClick={runTask}
              disabled={!command.trim() || isLoading}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:from-gray-300 disabled:to-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-[1.02] disabled:scale-100 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
            >
              {isLoading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Processing...</span>
                </div>
              ) : (
                <div className="flex items-center justify-center space-x-2">
                  <span>🚀</span>
                  <span>Run Task</span>
                </div>
              )}
            </button>
          </div>
        </div>

        {/* Results Section */}
        {result && (
          <div className="space-y-6">
            {/* Intent Display */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 px-6 py-4">
                <h3 className="text-lg font-semibold text-white flex items-center">
                  <span className="mr-2">🎯</span>
                  Detected Intent
                </h3>
              </div>
              <div className="p-6">
                <pre className="bg-gray-50 rounded-lg p-4 text-sm text-gray-800 overflow-x-auto border">
                  {JSON.stringify(result.intent, null, 2)}
                </pre>
              </div>
            </div>

            {/* Generated Block Display */}
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-purple-500 to-pink-600 px-6 py-4">
                <h3 className="text-lg font-semibold text-white flex items-center">
                  <span className="mr-2">⚡</span>
                  Generated Output
                </h3>
              </div>
              <div className="p-6">
                <div
                  className="prose prose-sm max-w-none bg-gray-50 rounded-lg p-4 border overflow-x-auto"
                  dangerouslySetInnerHTML={{ __html: result.generatedBlock }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!result && !isLoading && (
          <div className="text-center py-12">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <span className="text-3xl text-gray-400">💭</span>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to automate your tasks</h3>
            <p className="text-gray-500 max-w-md mx-auto">
              Describe any task you&#39;d like to automate and I&#39;ll analyze the intent and generate the appropriate solution
              for you.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
