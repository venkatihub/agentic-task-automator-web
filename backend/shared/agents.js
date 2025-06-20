const Template = require("../db/TemplateModel");

async function extractIntent(command, llm) {
  const prompt = `
You are an expert Intent Extractor.
Extract the user command into JSON like this:
{ "component": "...", "fields": [...], "validation": [...] }

Command: "${command}"
`;
  const response = await llm.invoke([{ role: "user", content: prompt }]);
  let content = response.content?.trim() || "{}";
  // Remove code fences if present
  content = content.replace(/^```json|^```|```$/gim, "").trim();

  let intent = {};
  try {
    intent = JSON.parse(content);
  } catch (e) {
    console.error("Failed to parse intent JSON:", content, e);
    intent = {};
  }
  return intent;
}
// async function selectTemplateRAG(intent, llm) {
//   console.log("Selecting template for intent:", intent);
//   const templates = await Template.find({ component: intent.component }).lean();
//   if (templates.length === 0) {
//     if (templates.length === 0) {
//       // No template found, generate one with LLM
//       const genPrompt = `
// You are an expert HTML/CSS UI generator.

// Generate a clean, minimal, fully functional HTML snippet for a "${
//         intent.component
//       }" component.
// Use semantic HTML tags where possible.
// Include the following fields: ${JSON.stringify(intent.fields || [])}.
// Apply basic styling with inline CSS or a <style> block (avoid external frameworks).
// Do not include any explanations, markdown, or comments — output ONLY pure HTML (with embedded CSS if needed).

// The HTML should be ready to insert directly into a web page.
// `;

//       const response = await llm.invoke([{ role: "user", content: genPrompt }]);
//       let html = response.content?.trim() || "";
//       html = html.replace(/^```html|^```|```$/gim, "").trim();

//       // Create and save new template
//       const newTemplate = await Template.create({
//         component: intent.component,
//         templateName: `${intent.component} (auto-generated)`,
//         html,
//         css: "",
//         js: "",
//         dependencies: [],
//       });
//       console.log("Created new template:", newTemplate);
//       return newTemplate.toObject();
//     }
//   }

//   // Simple RAG logic: prompt LLM to choose best-fit template
//   const ragPrompt = `
// Available templates:
// ${templates.map((t) => t.templateName).join("\n")}

// Intent:
// ${JSON.stringify(intent)}

// Which template fits best? Reply ONLY with template name.
// `;
//   const response = await llm.invoke([{ role: "user", content: ragPrompt }]);
//   const bestTemplateName = response.content?.trim();

//   return (
//     templates.find((t) => t.templateName === bestTemplateName) || templates[0]
//   );
// }

async function selectTemplateRAG(intent, llm) {
  console.log("Selecting template for intent:", intent);
  let templates = await Template.find({ component: intent.component }).lean();

  // Helper: compare fields/validation arrays
  const isIntentMatch = (tmpl, intent) =>
    JSON.stringify(tmpl.fields || []) === JSON.stringify(intent.fields || []) &&
    JSON.stringify(tmpl.validation || []) ===
      JSON.stringify(intent.validation || []);

  // 1. If templates exist, use RAG to select best fit
  if (templates.length > 0) {
    // Try to find an exact match
    let bestTemplate = templates.find((t) => isIntentMatch(t, intent));
    if (!bestTemplate) {
      // Use LLM to pick best template name
      const ragPrompt = `
Available templates:
${templates.map((t) => t.templateName).join("\n")}

Intent:
${JSON.stringify(intent)}

Which template fits best? Reply ONLY with template name.
`;
      const response = await llm.invoke([{ role: "user", content: ragPrompt }]);
      const bestTemplateName = response.content?.trim();
      bestTemplate =
        templates.find((t) => t.templateName === bestTemplateName) ||
        templates[0];
    }

    // If the selected template does not match the new intent, update it
    if (!isIntentMatch(bestTemplate, intent)) {
      // Generate updated HTML with LLM
      const updatePrompt = `
You are an expert HTML/CSS UI generator.

Update the following HTML template to match these fields: ${JSON.stringify(
        intent.fields || []
      )}
and validation: ${JSON.stringify(intent.validation || [])}.
Only output valid HTML, no explanations, no markdown.

Current template:
${bestTemplate.html}
`;
      const updateResponse = await llm.invoke([
        { role: "user", content: updatePrompt },
      ]);
      let updatedHtml = updateResponse.content?.trim() || "";
      updatedHtml = updatedHtml.replace(/^```html|^```|```$/gim, "").trim();

      // Update the template in DB
      await Template.updateOne(
        { _id: bestTemplate._id },
        {
          html: updatedHtml,
          fields: intent.fields,
          validation: intent.validation,
        }
      );
      // Return the updated template
      return {
        ...bestTemplate,
        html: updatedHtml,
        fields: intent.fields,
        validation: intent.validation,
      };
    }

    // Return the best matching template as is
    return bestTemplate;
  }

  // 2. If no template exists, generate and store a new one
  const genPrompt = `
You are an expert web UI developer and designer.

Generate a modern, visually appealing, responsive, and accessible HTML snippet for a "${
    intent.component
  }" web component.
- Use semantic HTML5 tags and ARIA attributes where appropriate.
- Include the following fields: ${JSON.stringify(intent.fields || [])}.
- Apply the following validation: ${JSON.stringify(intent.validation || [])}.
- Use a <style> block for all CSS (do not use inline styles).
- Make the design mobile-friendly and visually distinct.
- Use clear labels, helpful placeholders, and accessible form controls.
- Do NOT include explanations, markdown, or comments—output ONLY pure HTML (with a <style> block for CSS if needed).

The HTML should be ready to insert directly into a web page.
`;

  const response = await llm.invoke([{ role: "user", content: genPrompt }]);
  let llmOutput = response.content?.trim() || "";
  llmOutput = llmOutput.replace(/^```html|^```|```$/gim, "").trim();

  const { html, css } = extractHtmlAndCss(llmOutput);

  const newTemplate = await Template.create({
    component: intent.component,
    templateName: `${intent.component} (auto-generated)`,
    html,
    fields: intent.fields,
    validation: intent.validation,
    css,
    js: "",
    dependencies: [],
  });
  console.log("Created new template:", newTemplate);
  return newTemplate.toObject();
}
function extractHtmlAndCss(llmOutput) {
  let html = llmOutput;
  let css = "";

  // Extract <style>...</style> block if present
  const styleMatch = html.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
  if (styleMatch) {
    css = styleMatch[1].trim();
    html = html.replace(styleMatch[0], "").trim();
  }

  return { html, css };
}
async function resolveDependencies(template) {
  // For now, simply return stored dependencies (extend with smarter checks later)
  return template.dependencies || [];
}

async function generateUIBlock(template, dependencies, llm) {
  const depLinks = dependencies
    .map((dep) => `<script src="${dep}"></script>`)
    .join("\n");
  const styleBlock = template.css ? `<style>${template.css}</style>` : "";
  const jsBlock = template.js ? `<script>${template.js}</script>` : "";

  return `
${depLinks}
${styleBlock}
${template.html}
${jsBlock}
  `.trim();
}

async function injectToDOM(generatedBlock) {
  // Simulate injection for now - extend later with real DOM insertion APIs
  console.log("Injecting block into DOM...", generatedBlock);
  return { injected: true, html: generatedBlock };
}

module.exports = {
  extractIntent,
  selectTemplateRAG,
  resolveDependencies,
  generateUIBlock,
  injectToDOM,
};

// const Template = require("../db/TemplateModel");

// async function extractIntent(command, llm) {
//   const prompt = `
// You are an expert Intent Extractor.
// Extract the user command into JSON like this:
// { "component": "...", "action": "...", "fields": [...], "validation": [...] }

// Command: "${command}"
// `;
//   const response = await llm.invoke([{ role: "user", content: prompt }]);
//   let content = response.content?.trim() || "{}";
//   // Remove markdown code fences if present
//   content = content.replace(/^```json|^```|```$/gim, "").trim();

//   let intent = {};
//   try {
//     intent = JSON.parse(content);
//   } catch (e) {
//     console.error("Failed to parse intent JSON:", content, e);
//     intent = {};
//   }
//   return intent;
// }

// async function selectTemplateRAG(intent, llm) {
//   console.log("Selecting template for intent:", intent);

//   // Try to find a matching template
//   const templates = await Template.find({ component: intent.component }).lean();

//   if (templates.length === 0) {
//     console.log("No template found. Falling back to LLM generation.");
//     return generateTemplateWithLLM(intent, llm);
//   }

//   console.log("Using existing template from DB.");
//   return templates[0]; // Return the first match for now
// }

// async function generateTemplateWithLLM(intent, llm) {
//   const fieldsList = (intent.fields || []).join(", ");
//   const prompt = `
// You are an expert HTML/CSS UI generator.

// Generate a clean, minimal, fully functional HTML snippet for a "${
//     intent.component
//   }" component.
// Use semantic HTML tags where possible.
// Include the following fields: ${fieldsList}.
// Apply basic styling with inline CSS or <style> block.
// Only return valid HTML inside a single code fence.

// Example format:
// \`\`\`html
// <div class="...">
//   ...
// </div>
// \`\`\`
// `;

//   const response = await llm.invoke([{ role: "user", content: prompt }]);
//   let html = response.content?.trim() || "";

//   // Strip markdown if needed
//   html = html.replace(/^```html|^```|```$/gim, "").trim();

//   return {
//     component: intent.component,
//     html,
//     generatedBy: "LLM",
//   };
// }

// function resolveDependencies(template) {
//   const dependencies = [];

//   // Basic dependency detection based on component name
//   // if (template.component.includes("form")) {
//   //   dependencies.push("https://cdn.tailwindcss.com");
//   // }

//   // Add more rules as needed
//   return dependencies;
// }

// async function generateUIBlock(intent, llm) {
//   const template = await selectTemplateRAG(intent, llm);
//   const dependencies = resolveDependencies(template);

//   const depLinks = dependencies
//     .map((url) => `<link rel="stylesheet" href="${url}">`)
//     .join("\n");

//   const styleBlock = template.html.includes("<style>")
//     ? ""
//     : `<style>
//         /* Auto-injected styles */
//         body { font-family: sans-serif; }
//       </style>`;

//   const jsBlock = `<script>
//       // Placeholder script
//       document.addEventListener('DOMContentLoaded', () => {
//         console.log('${template.component} loaded');
//       });
//     </script>`;

//   const fullHTML = `
// ${depLinks}
// ${styleBlock}
// ${template.html}
// ${jsBlock}
// `;

//   return fullHTML.trim();
// }

// async function injectToDOM(generatedBlock) {
//   // Simulate DOM injection for now - extend later with real browser APIs
//   console.log("Injecting block into DOM...", generatedBlock);
//   return { injected: true, html: generatedBlock };
// }

// module.exports = {
//   extractIntent,
//   selectTemplateRAG,
//   resolveDependencies,
//   generateUIBlock,
//   injectToDOM,
// };
