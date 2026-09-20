// Server-rendered JSON-LD. Unlike next/script, this ships in the initial HTML so crawlers
// that don't execute JavaScript (e.g. Merchant Center) still see the structured data.
export default function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  )
}
