import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import fs from 'fs';
import path from 'path';

export default async function IngestionManualPage() {
  const filePath = path.resolve(process.cwd(), '..', 'INGESTION_MANUAL.md');
  
  if (!fs.existsSync(filePath)) {
    // If not found, maybe we are in the root directory already?
    const fallbackPath = path.resolve(process.cwd(), 'INGESTION_MANUAL.md');
    if (fs.existsSync(fallbackPath)) {
      return (
        <div className="container mx-auto px-6 py-12 max-w-4xl">
          <article className="prose prose-slate prose-lg max-w-none">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {fs.readFileSync(fallbackPath, 'utf-8')}
            </ReactMarkdown>
          </article>
        </div>
      );
    }
    return (
      <div className="container mx-auto px-6 py-12">
        <h1>Error: Manual file not found</h1>
        <p>Could not locate the ingestion manual at {filePath} or {fallbackPath}</p>
      </div>
    );
  }
  const markdownContent = fs.readFileSync(filePath, 'utf-8');

  return (
    <div className="container mx-auto px-6 py-12 max-w-4xl">
      <article className="prose prose-slate prose-lg max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {markdownContent}
        </ReactMarkdown>
      </article>
    </div>
  );
}
