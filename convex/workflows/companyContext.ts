import { ActionCtx } from '../_generated/server';

/**
 * Input types for processing company inputs
 */
export interface ProcessCompanyInputsArgs {
  urls?: string[];
  rawText?: string;
  documents?: Array<{
    type: "text" | "pdf" | "url";
    title?: string;
    content: string;
  }>;
}

/**
 * Workflow for processing company inputs and combining content
 * The combined content will be used to generate context modules (team, customer, product, market, etc.)
 */
export class ProcessCompanyInputsWorkflow {
  /**
   * Process company inputs and return combined content string
   */
  async generate(
    ctx: ActionCtx,
    args: ProcessCompanyInputsArgs
  ): Promise<string> {
    // Collect all content
    const allContent: string[] = [];

    // Process URLs with Firecrawl (currently commented out)
    // if (args.urls && args.urls.length > 0) {
      // const firecrawlApiKey = process.env.FIRECRAWL_API_KEY;
      // if (!firecrawlApiKey) {
      //   throw new Error("FIRECRAWL_API_KEY environment variable is not set");
      // }
    //   for (const url of args.urls) {
    //     try {
    //       const response = await fetch("https://api.firecrawl.dev/v1/scrape", {
    //         method: "POST",
    //         headers: {
    //           "Content-Type": "application/json",
    //           Authorization: `Bearer ${process.env.FIRECRAWL_API_KEY}`,
    //         },
    //         body: JSON.stringify({
    //           url,
    //           formats: ["markdown"],
    //         }),
    //       });

    //       if (!response.ok) {
    //         console.error(`Failed to scrape ${url}: ${response.statusText}`);
    //         continue;
    //       }

    //       const data = await response.json();
    //       if (data.data?.markdown) {
    //         allContent.push(`Content from ${url}:\n${data.data.markdown}`);
    //       }
    //     } catch (error) {
    //       console.error(`Error scraping ${url}:`, error);
    //     }
    //   }
    // }

    // Add raw text
    if (args.rawText) {
      allContent.push(args.rawText);
    }

    // Process documents (content is already extracted client-side)
    if (args.documents && args.documents.length > 0) {
      for (const doc of args.documents) {
        if (doc.content) {
          allContent.push(`Document: ${doc.title || "Untitled"}\n${doc.content}`);
        }
      }
    }

    // Combine all content
    const combinedContent = allContent.join("\n\n");

    // Return the combined content string (or empty string if no content)
    return combinedContent.trim() || "";
  }
}

