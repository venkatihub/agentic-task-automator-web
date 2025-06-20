// async function runAgenticFlow(command, broadcast = () => {}) {
//   broadcast({ step: 'Start', message: `Running command: ${command}` });

//   const intent = await extractIntent(command, llm);
//   broadcast({ step: 'Intent Extracted', data: intent });

//   const selectedTemplate = await selectTemplateRAG(intent, llm);
//   broadcast({ step: 'Template Selected', data: selectedTemplate.templateName });

//   const dependencies = await resolveDependencies(selectedTemplate);
//   broadcast({ step: 'Dependencies Resolved', data: dependencies });

//   const generatedBlock = await generateUIBlock(selectedTemplate, dependencies, llm);
//   broadcast({ step: 'UI Generated' });

//   const injectionResult = await injectToDOM(generatedBlock);
//   broadcast({ step: 'Injection Complete' });

//   return { intent, selectedTemplate, dependencies, generatedBlock, injectionResult };
// }
// module.exports = runAgenticFlow;

const { ChatGoogleGenerativeAI } = require("@langchain/google-genai");
// const Template = require("../db/TemplateModel");
const {
  extractIntent,
  selectTemplateRAG,
  resolveDependencies,
  generateUIBlock,
  injectToDOM,
} = require("./agents");

const llm = new ChatGoogleGenerativeAI({
  model: "gemini-1.5-flash",
  apiKey: process.env.GEMINI_API_KEY,
});

async function runAgenticFlow(command, broadcast = () => {}) {
  broadcast({ step: "Start", message: `Running command: ${command}` });

  const intent = await extractIntent(command, llm);
  broadcast({ step: "Intent Extracted", data: intent });

  const selectedTemplate = await selectTemplateRAG(intent, llm);
  broadcast({ step: "Template Selected", data: selectedTemplate.templateName });

  const dependencies = await resolveDependencies(selectedTemplate);
  broadcast({ step: "Dependencies Resolved", data: dependencies });

  const generatedBlock = await generateUIBlock(
    selectedTemplate,
    dependencies,
    llm
  );
  broadcast({ step: "UI Generated" });

  const injectionResult = await injectToDOM(generatedBlock);
  broadcast({ step: "Injection Complete" });

  return {
    intent,
    selectedTemplate,
    dependencies,
    generatedBlock,
    injectionResult,
  };
}

module.exports = { runAgenticFlow };
