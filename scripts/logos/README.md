## Raw logos (unused)
1. logobook site scraped with firecrawl > site-crawl.json
1. scraped /logos/ pages from site-crawl.json into logos-svg/ and logos-sb.json.

## Dataset - Logo Embeddings (subset, seperate source)
1. convert https://huggingface.co/datasets/mozci/logobookDB parquet into json
2. augmented with embeddings > logos_with_text_and_embeddings.jsonl
3. ingest.ts adds the results to the convex db

logos.zip (image,text files) available for training - built from dataset